import { Bill, CalculatedBillResult } from '../../types';
import { formatMoney } from '../../utils/currency';

/**
 * Builds clean plain-text summary for sharing via WhatsApp, SMS, Telegram, etc.
 */
export function generateShareText(
  bill: Bill,
  result: CalculatedBillResult,
  includeItemized: boolean = false
): string {
  const currency = bill.currency;
  const lines: string[] = [
    `🍽️ SplitBill`,
    `${bill.restaurantName || 'Restaurant Bill'}`,
    `Total: ${formatMoney(result.effectiveBillTotalPaise, currency)}`,
    ``,
    `--------------------------------`,
  ];

  result.personShares.forEach(person => {
    lines.push(`${person.personName} — ${formatMoney(person.totalPaise, currency)}`);
    if (includeItemized && person.assignedItems.length > 0) {
      person.assignedItems.forEach(item => {
        lines.push(`   • ${item.itemName}${item.details ? ` (${item.details})` : ''}: ${formatMoney(item.sharePaise, currency)}`);
      });
      if (person.taxSharePaise > 0) {
        lines.push(`   • Tax: ${formatMoney(person.taxSharePaise, currency)}`);
      }
      if (person.discountSharePaise > 0) {
        lines.push(`   • Discount: -${formatMoney(person.discountSharePaise, currency)}`);
      }
    }
  });

  lines.push(`--------------------------------`);
  lines.push(`Total: ${formatMoney(result.effectiveBillTotalPaise, currency)}`);
  lines.push(``);
  lines.push(`Split effortlessly with SplitBill: https://splitbill.techfliq.com (100% private, no signup)`);

  return lines.join('\n');
}

/**
 * Shares via browser Web Share API if supported, or copies to clipboard.
 */
export async function shareBillSummary(
  bill: Bill,
  result: CalculatedBillResult,
  includeItemized: boolean = false
): Promise<{ method: 'share' | 'clipboard'; success: boolean }> {
  const text = generateShareText(bill, result, includeItemized);
  const title = `Split for ${bill.restaurantName || 'Restaurant Bill'}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return { method: 'share', success: true };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { method: 'share', success: false };
      }
    }
  }

  return copyBillSummary(bill, result, includeItemized);
}

export async function copyBillSummary(
  bill: Bill,
  result: CalculatedBillResult,
  includeItemized: boolean = false
): Promise<{ method: 'share' | 'clipboard'; success: boolean }> {
  const text = generateShareText(bill, result, includeItemized);
  
  try {
    await navigator.clipboard.writeText(text);
    return { method: 'clipboard', success: true };
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return { method: 'clipboard', success: false };
  }
}

/**
 * Direct WhatsApp sharing with URL-encoded text.
 */
export function openWhatsAppShare(
  bill: Bill,
  result: CalculatedBillResult,
  includeItemized: boolean = false
): void {
  const text = generateShareText(bill, result, includeItemized);
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

