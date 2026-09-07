import { Bill, CalculatedBillResult } from '../../types';
import { formatMoneyPdf } from '../../utils/currency';

export async function generateBillPdf(bill: Bill, result: CalculatedBillResult): Promise<void> {
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

  const currency = bill.currency;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 99, 235); // Brand Blue
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SplitBill Summary', 14, 16);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('https://splitbill.techfliq.com • 100% Free & Private', 14, 24);

  // Restaurant details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.restaurantName || 'Restaurant Bill', 14, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${new Date(bill.date || bill.createdAt).toLocaleDateString()}`, 14, 48);

  // 1. Who Owes What Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Individual Share Breakdown', 14, 58);

  const peopleRows = result.personShares.map(p => [
    p.personName,
    formatMoneyPdf(p.itemsSharePaise, currency),
    p.taxSharePaise > 0 ? formatMoneyPdf(p.taxSharePaise, currency) : '-',
    p.discountSharePaise > 0 ? `-${formatMoneyPdf(p.discountSharePaise, currency)}` : '-',
    formatMoneyPdf(p.totalPaise, currency),
  ]);

  autoTable(doc, {
    startY: 62,
    head: [['Person', 'Items Share', 'Tax', 'Discount', 'Total Owed']],
    body: peopleRows,
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

  // 2. Bill Items Table
  // @ts-ignore
  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 120;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Bill Items & Assignments', 14, currentY);

  const itemRows = bill.items.map(item => {
    const assignedNames = item.assignedPersonIds
      .map(id => bill.people.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');

    return [
      item.name,
      `${item.quantity}x`,
      formatMoneyPdf(item.unitPricePaise, currency),
      formatMoneyPdf(item.totalPricePaise, currency),
      assignedNames || 'Unassigned',
    ];
  });

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Item', 'Qty', 'Unit Price', 'Total', 'Shared By']],
    body: itemRows,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: 255,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
  });

  // 3. Totals summary
  // @ts-ignore
  currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 200;

  // Check page overflow
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(110, currentY, 86, 36, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', 115, currentY + 8);
  doc.setTextColor(30, 41, 59);
  doc.text(formatMoneyPdf(result.subtotalPaise, currency), 192, currentY + 8, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.text('Total Taxes:', 115, currentY + 15);
  doc.setTextColor(30, 41, 59);
  doc.text(formatMoneyPdf(result.taxesTotalPaise, currency), 192, currentY + 15, { align: 'right' });

  if (result.discountTotalPaise > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text('Total Discount:', 115, currentY + 22);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatMoneyPdf(result.discountTotalPaise, currency)}`, 192, currentY + 22, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Grand Total:', 115, currentY + 31);
  doc.setTextColor(37, 99, 235);
  doc.text(formatMoneyPdf(result.effectiveBillTotalPaise, currency), 192, currentY + 31, { align: 'right' });

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated with SplitBill • https://splitbill.techfliq.com • 100% Client-Side & Private', 14, 285);

  const cleanFilename = (bill.restaurantName || 'splitbill')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  doc.save(`${cleanFilename}-${bill.date || new Date().toISOString().split('T')[0]}.pdf`);
}
