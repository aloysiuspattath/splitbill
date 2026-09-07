import { Group, Bill, BILL_CATEGORIES } from '../../types';
import { formatMoneyPdf } from '../../utils/currency';
import { calculateDetailedBalances, calculateSettleUp } from '../calculation/settleUp';

export async function generateGroupPdf(group: Group, bills: Bill[]): Promise<void> {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = (autoTableModule.default || autoTableModule) as any;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = group.currency;
  const pageWidth = doc.internal.pageSize.getWidth();
  const detailedBalances = calculateDetailedBalances(bills);
  const transactions = calculateSettleUp(bills);

  const totalGroupSpentPaise = bills.reduce((sum, b) => {
    return sum + b.items.reduce((itemSum, item) => itemSum + item.totalPricePaise, 0);
  }, 0);

  // 1. Header Banner
  doc.setFillColor(37, 99, 235); // Brand Blue
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SplitBill Trip Statement', 14, 16);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('https://splitbill.techfliq.com • 100% Free & Private', 14, 24);

  // 2. Trip Overview Card
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(group.name, 14, 44);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Members: ${group.members.length}  |  Total Bills: ${bills.length}  |  Generated: ${new Date().toLocaleDateString()}`,
    14,
    51
  );

  // Total Spend Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 56, pageWidth - 28, 16, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL GROUP EXPENDITURE:', 20, 66);
  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  doc.text(formatMoneyPdf(totalGroupSpentPaise, currency), 85, 66);

  // 3. Settle Up Transactions Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('1. Settle Up Plan (Who Pays Whom)', 14, 82);

  const txRows = transactions.length === 0
    ? [['All balances are settled! No payments required.', '', '']]
    : transactions.map(tx => {
        const from = group.members.find(m => m.id === tx.fromPersonId)?.name || 'Someone';
        const to = group.members.find(m => m.id === tx.toPersonId)?.name || 'Someone';
        return [from, `pays ${to}`, formatMoneyPdf(tx.amountPaise, currency)];
      });

  autoTable(doc, {
    startY: 86,
    head: [['Debtor', 'Action', 'Amount']],
    body: txRows,
    theme: 'striped',
    headStyles: {
      fillColor: [16, 185, 129], // Emerald green for settle up
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  // 4. Member Balances Table
  // @ts-ignore
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 120;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('2. Member Balances Ledger', 14, currentY);

  const balanceRows = group.members.map(member => {
    const details = detailedBalances[member.id] || { totalPaidPaise: 0, totalSharePaise: 0, netPaise: 0 };
    const net = details.netPaise;
    const status = net > 0 ? `+${formatMoneyPdf(net, currency)} (Gets back)` : net < 0 ? `-${formatMoneyPdf(Math.abs(net), currency)} (Owes)` : 'Settled';
    return [
      member.name,
      formatMoneyPdf(details.totalPaidPaise, currency),
      formatMoneyPdf(details.totalSharePaise, currency),
      status,
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Member', 'Total Paid', 'Consumed Share', 'Net Balance']],
    body: balanceRows,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
  });

  // 5. Bills List Table
  // @ts-ignore
  currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 180;

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('3. Itemized Group Bills', 14, currentY);

  const billRows = bills.map(bill => {
    const payer = group.members.find(m => m.id === bill.paidBy)?.name || 'Someone';
    const cat = BILL_CATEGORIES.find(c => c.id === (bill.category || 'other'))?.label || 'General';
    const billTotal = bill.items.reduce((sum, item) => sum + item.totalPricePaise, 0);
    return [
      bill.date || '-',
      cat,
      bill.restaurantName || 'Untitled Bill',
      payer,
      formatMoneyPdf(billTotal, bill.currency),
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Date', 'Category', 'Description', 'Paid By', 'Amount']],
    body: billRows,
    theme: 'striped',
    headStyles: {
      fillColor: [71, 85, 105], // Slate
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
    },
  });

  // 6. Footer
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by SplitBill • https://splitbill.techfliq.com • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      288,
      { align: 'center' }
    );
  }

  const safeName = group.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  doc.save(`${safeName}-statement.pdf`);
}
