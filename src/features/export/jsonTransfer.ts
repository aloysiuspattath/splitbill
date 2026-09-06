import { Bill } from '../../types';

/**
 * Downloads bill data as formatted JSON.
 */
export function exportBillToJson(bill: Bill): void {
  const safeName = (bill.restaurantName || 'bill')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  const dateStr = bill.date || new Date().toISOString().split('T')[0];
  const filename = `splitbill-${safeName}-${dateStr}.json`;

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bill, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Validates and sanitizes imported JSON bill data to prevent prototype pollution or corrupted state.
 */
export function validateAndSanitizeBillJson(rawJson: unknown): Bill {
  if (typeof rawJson !== 'object' || rawJson === null || Array.isArray(rawJson)) {
    throw new Error('Invalid JSON: expected an object.');
  }

  const obj = rawJson as Record<string, any>;

  // Check for prototype pollution attempts safely
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  for (const key of dangerousKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      throw new Error('Invalid or unsafe payload detected.');
    }
  }

  const billId = typeof obj.id === 'string' ? obj.id : `imported-${Date.now()}`;

  const restaurantName = typeof obj.restaurantName === 'string'
    ? obj.restaurantName.slice(0, 100).replace(/<[^>]*>?/gm, '')
    : 'Imported Bill';

  const currency = typeof obj.currency === 'string' && ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY'].includes(obj.currency)
    ? obj.currency
    : 'INR';

  if (!Array.isArray(obj.items)) {
    throw new Error('Invalid bill format: items must be an array.');
  }

  if (!Array.isArray(obj.people)) {
    throw new Error('Invalid bill format: people must be an array.');
  }

  // Sanitize people
  const sanitizedPeople = obj.people.map((p: any, idx: number) => ({
    id: typeof p.id === 'string' ? p.id : `p-${idx}`,
    name: typeof p.name === 'string' ? p.name.slice(0, 50).replace(/<[^>]*>?/gm, '') : `Person ${idx + 1}`,
    avatar: typeof p.avatar === 'string' ? p.avatar.slice(0, 10) : '👤',
    color: typeof p.color === 'string' ? p.color : '#3b82f6',
  }));

  // Sanitize items
  const sanitizedItems = obj.items.map((it: any, idx: number) => ({
    id: typeof it.id === 'string' ? it.id : `item-${idx}`,
    name: typeof it.name === 'string' ? it.name.slice(0, 100).replace(/<[^>]*>?/gm, '') : `Item ${idx + 1}`,
    quantity: typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 1,
    unitPricePaise: typeof it.unitPricePaise === 'number' ? Math.max(0, it.unitPricePaise) : 0,
    totalPricePaise: typeof it.totalPricePaise === 'number' ? Math.max(0, it.totalPricePaise) : 0,
    assignedPersonIds: Array.isArray(it.assignedPersonIds) ? it.assignedPersonIds.filter((id: any) => typeof id === 'string') : [],
    assignments: Array.isArray(it.assignments) ? it.assignments.map((a: any) => ({
      personId: String(a.personId),
      mode: ['equal', 'percentage', 'amount'].includes(a.mode) ? a.mode : 'equal',
      value: typeof a.value === 'number' ? a.value : undefined,
    })) : [],
  }));

  return {
    id: billId,
    restaurantName,
    date: typeof obj.date === 'string' ? obj.date : new Date().toISOString().split('T')[0],
    currency: currency as any,
    items: sanitizedItems,
    people: sanitizedPeople,
    taxes: Array.isArray(obj.taxes) ? obj.taxes : [],
    discount: typeof obj.discount === 'object' && obj.discount !== null ? (obj.discount as any) : { type: 'none', allocationMethod: 'proportional' },
    customTipPaise: typeof obj.customTipPaise === 'number' ? obj.customTipPaise : 0,
    isPermanent: !!obj.isPermanent,
    createdAt: typeof obj.createdAt === 'number' ? obj.createdAt : Date.now(),
    updatedAt: Date.now(),
  };
}
