import { Group, Bill, BILL_CATEGORIES } from '../../types';
import { formatMoney } from '../../utils/currency';
import { calculateDetailedBalances, calculateCategoryTotals, calculateSettleUp } from '../calculation/settleUp';

export interface GroupShareOptions {
  includeBillsList?: boolean;
  includeCategoryBreakdown?: boolean;
  includeMemberBalances?: boolean;
  settlementOnly?: boolean;
}

/**
 * Generates an emoji-rich, formatted text summary of the group/trip for WhatsApp, Telegram, SMS, etc.
 */
export function generateGroupShareText(
  group: Group,
  bills: Bill[],
  options: GroupShareOptions = {
    includeBillsList: true,
    includeCategoryBreakdown: true,
    includeMemberBalances: true,
    settlementOnly: false,
  }
): string {
  const currency = group.currency;
  const detailedBalances = calculateDetailedBalances(bills);
  const categoryTotals = calculateCategoryTotals(bills);
  const transactions = calculateSettleUp(bills);
  
  const totalGroupSpentPaise = bills.reduce((sum, b) => {
    return sum + b.items.reduce((itemSum, item) => itemSum + item.totalPricePaise, 0);
  }, 0);

  const lines: string[] = [];

  // Title
  lines.push(`🌴 *${group.name}*`);
  lines.push(`💰 *Total Spend:* ${formatMoney(totalGroupSpentPaise, currency)}`);
  lines.push(`👥 *Members:* ${group.members.map(m => m.name).join(', ')}`);
  lines.push(`📅 *Total Bills:* ${bills.length}`);
  lines.push(``);

  if (options.settlementOnly) {
    // Quick Settle-Up view
    lines.push(`🤝 *WHO PAYS WHOM:*`);
    lines.push(`--------------------------------`);
    if (transactions.length === 0) {
      lines.push(`🎉 Everyone is all settled up! No payments needed.`);
    } else {
      transactions.forEach(tx => {
        const from = group.members.find(m => m.id === tx.fromPersonId);
        const to = group.members.find(m => m.id === tx.toPersonId);
        if (from && to) {
          lines.push(`👉 *${from.name}* pays *${to.name}*: ${formatMoney(tx.amountPaise, currency)}`);
        }
      });
    }
    lines.push(``);
    lines.push(`Split effortlessly with SplitBill: https://splitbill.techfliq.com ⚡`);
    return lines.join('\n');
  }

  // Category Breakdown
  if (options.includeCategoryBreakdown && Object.keys(categoryTotals).length > 0) {
    lines.push(`📊 *SPEND BY CATEGORY:*`);
    lines.push(`--------------------------------`);
    BILL_CATEGORIES.forEach(cat => {
      const amount = categoryTotals[cat.id];
      if (amount && amount > 0) {
        lines.push(`${cat.emoji} ${cat.label}: ${formatMoney(amount, currency)}`);
      }
    });
    lines.push(``);
  }

  // Member Balances
  if (options.includeMemberBalances) {
    lines.push(`💳 *MEMBER BALANCES:*`);
    lines.push(`--------------------------------`);
    group.members.forEach(member => {
      const details = detailedBalances[member.id] || { totalPaidPaise: 0, totalSharePaise: 0, netPaise: 0 };
      const net = details.netPaise;
      let statusStr = '';
      if (net > 0) {
        statusStr = `(gets back ${formatMoney(net, currency)} 🟢)`;
      } else if (net < 0) {
        statusStr = `(owes ${formatMoney(Math.abs(net), currency)} 🔴)`;
      } else {
        statusStr = `(settled ⚪)`;
      }

      lines.push(`• *${member.name}*: Paid ${formatMoney(details.totalPaidPaise, currency)} • Share ${formatMoney(details.totalSharePaise, currency)} ${statusStr}`);
    });
    lines.push(``);
  }

  // Settle-Up Transactions
  lines.push(`🤝 *FINAL SETTLEMENT PLAN:*`);
  lines.push(`--------------------------------`);
  if (transactions.length === 0) {
    lines.push(`🎉 Everyone is all settled up! No payments needed.`);
  } else {
    transactions.forEach(tx => {
      const from = group.members.find(m => m.id === tx.fromPersonId);
      const to = group.members.find(m => m.id === tx.toPersonId);
      if (from && to) {
        lines.push(`👉 *${from.name}* pays *${to.name}*: ${formatMoney(tx.amountPaise, currency)}`);
      }
    });
  }

  // Recent Bills List (optional)
  if (options.includeBillsList && bills.length > 0) {
    lines.push(``);
    lines.push(`🧾 *BILLS BREAKDOWN:*`);
    lines.push(`--------------------------------`);
    bills.forEach(bill => {
      const payer = group.members.find(m => m.id === bill.paidBy) || group.members[0];
      const cat = BILL_CATEGORIES.find(c => c.id === (bill.category || 'other'));
      const billTotal = bill.items.reduce((sum, item) => sum + item.totalPricePaise, 0);
      lines.push(`${cat?.emoji || '🧾'} ${bill.restaurantName || 'Bill'} — ${formatMoney(billTotal, bill.currency)} (Paid by ${payer?.name || 'Someone'})`);
    });
  }

  lines.push(``);
  lines.push(`Split effortlessly with SplitBill: https://splitbill.techfliq.com 🔒`);

  return lines.join('\n');
}

/**
 * Launches WhatsApp with pre-filled text.
 */
export function openWhatsApp(text: string): void {
  const encodedText = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank');
}

/**
 * Copies text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export interface GroupExportPayload {
  version: number;
  exportedAt: number;
  group: Group;
  bills: Bill[];
}

/**
 * Exports complete group with all its bills as a JSON file.
 */
export function exportGroupToJson(group: Group, bills: Bill[]): void {
  const safeName = group.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const filename = `splitbill-trip-${safeName}-${new Date().toISOString().split('T')[0]}.json`;

  const payload: GroupExportPayload = {
    version: 1,
    exportedAt: Date.now(),
    group,
    bills,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Validates and sanitizes imported Group JSON payload.
 */
export function validateAndSanitizeGroupJson(rawJson: unknown): { group: Group; bills: Bill[] } {
  if (typeof rawJson !== 'object' || rawJson === null || Array.isArray(rawJson)) {
    throw new Error('Invalid JSON: expected a JSON object.');
  }

  const obj = rawJson as Record<string, any>;
  if (!obj.group || typeof obj.group !== 'object') {
    throw new Error('Invalid file: missing group data.');
  }

  const rawGroup = obj.group;
  const groupId = typeof rawGroup.id === 'string' ? rawGroup.id : `group-${Date.now()}`;
  const groupName = typeof rawGroup.name === 'string' ? rawGroup.name.slice(0, 100) : 'Imported Trip';
  const currency = typeof rawGroup.currency === 'string' ? rawGroup.currency : 'INR';

  if (!Array.isArray(rawGroup.members) || rawGroup.members.length === 0) {
    throw new Error('Invalid group: members list is empty.');
  }

  const members = rawGroup.members.map((m: any, idx: number) => ({
    id: typeof m.id === 'string' ? m.id : `m-${idx}`,
    name: typeof m.name === 'string' ? m.name.slice(0, 50) : `Member ${idx + 1}`,
    avatar: typeof m.avatar === 'string' ? m.avatar : '👤',
    color: typeof m.color === 'string' ? m.color : '#3b82f6',
  }));

  const group: Group = {
    id: groupId,
    name: groupName,
    currency,
    members,
    createdAt: typeof rawGroup.createdAt === 'number' ? rawGroup.createdAt : Date.now(),
    updatedAt: Date.now(),
  };

  const rawBills = Array.isArray(obj.bills) ? obj.bills : [];
  const bills: Bill[] = rawBills.map((b: any, idx: number) => ({
    id: typeof b.id === 'string' ? b.id : `bill-${Date.now()}-${idx}`,
    restaurantName: typeof b.restaurantName === 'string' ? b.restaurantName.slice(0, 100) : 'Expense',
    date: typeof b.date === 'string' ? b.date : new Date().toISOString().split('T')[0],
    currency: typeof b.currency === 'string' ? b.currency : currency,
    groupId: group.id,
    category: b.category || 'other',
    paidBy: typeof b.paidBy === 'string' ? b.paidBy : members[0]?.id,
    items: Array.isArray(b.items) ? b.items : [],
    people: members,
    taxes: Array.isArray(b.taxes) ? b.taxes : [],
    discount: b.discount || { type: 'none', allocationMethod: 'proportional' },
    createdAt: typeof b.createdAt === 'number' ? b.createdAt : Date.now(),
    updatedAt: Date.now(),
  }));

  return { group, bills };
}
