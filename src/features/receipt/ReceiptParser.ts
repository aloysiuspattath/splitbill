import { BillItem, TaxItem, CurrencyCode } from '../../types';
import { toPaise } from '../../utils/currency';

export interface ParsedReceiptData {
  restaurantName?: string;
  items: BillItem[];
  detectedSubtotalPaise?: number;
  detectedTaxes: TaxItem[];
  detectedDiscountPaise?: number;
  detectedTotalPaise?: number;
  rawText: string;
}

// Common junk lines on receipts
const IGNORE_PATTERNS = [
  /^(tax\s*invoice|bill|receipt|cash\s*memo|table|token|waiter|captain|server|order\s*no|date|time|gstin|fssai|tel|ph|phone|email|www\.|welcome|thank\s*you|visit\s*again)/i,
  /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/, // dates
  /^\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?/i, // times
  /^[=\-_*#]{3,}$/, // horizontal divider lines
  /^(cash|card|upi|paytm|gpay|visa|mastercard)/i,
];

/**
 * Parses raw OCR text into candidate bill items, taxes, and totals.
 */
export function parseReceiptText(text: string, currency: CurrencyCode = 'INR'): ParsedReceiptData {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 1);

  const items: BillItem[] = [];
  const detectedTaxes: TaxItem[] = [];
  let restaurantName = '';
  let detectedSubtotalPaise: number | undefined;
  let detectedDiscountPaise: number | undefined;
  let detectedTotalPaise: number | undefined;

  // Potential restaurant name is usually in the first 1-3 non-empty non-junk lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i];
    if (!IGNORE_PATTERNS.some(p => p.test(line)) && !/[0-9]{5,}/.test(line) && line.length > 2) {
      // Remove any prices if present
      const cleanName = line.replace(/[\d.,₹$€£]+/g, '').trim();
      if (cleanName.length > 2) {
        restaurantName = cleanName;
        break;
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line should be skipped
    if (IGNORE_PATTERNS.some(p => p.test(line))) {
      continue;
    }

    // Check for Subtotal line
    if (/^(sub\s*total|subtotal)/i.test(line)) {
      const numbers = extractNumbers(line);
      if (numbers.length > 0) {
        detectedSubtotalPaise = toPaise(numbers[numbers.length - 1], currency);
      }
      continue;
    }

    // Check for Grand Total line
    if (/^(grand\s*total|total|net\s*amount|bill\s*amount|amount\s*payable)/i.test(line)) {
      const numbers = extractNumbers(line);
      if (numbers.length > 0) {
        detectedTotalPaise = toPaise(numbers[numbers.length - 1], currency);
      }
      continue;
    }

    // Check for Discount line
    if (/^(discount|disc|promo|less|offer)/i.test(line)) {
      const numbers = extractNumbers(line);
      if (numbers.length > 0) {
        detectedDiscountPaise = toPaise(numbers[numbers.length - 1], currency);
      }
      continue;
    }

    // Check for Taxes (CGST, SGST, VAT, GST, Tax)
    const taxMatch = line.match(/(cgst|sgst|vat|gst|tax|service\s*charge)\s*@?\s*([\d.]+)?%?/i);
    if (taxMatch) {
      const taxName = taxMatch[1].toUpperCase();
      const taxRate = taxMatch[2] ? parseFloat(taxMatch[2]) : undefined;
      const numbers = extractNumbers(line);
      const taxAmount = numbers.length > 0 ? toPaise(numbers[numbers.length - 1], currency) : 0;

      detectedTaxes.push({
        id: `tax-${Date.now()}-${detectedTaxes.length}`,
        name: taxName,
        type: taxRate ? 'percentage' : 'fixed',
        rate: taxRate,
        fixedAmountPaise: taxRate ? undefined : taxAmount,
      });
      continue;
    }

    // Standard Food / Beverage Item line parsing
    // Line might look like:
    // "Erachi Choru 2 240.00 480.00"
    // "Lebanese Al Faham 370.00"
    // "Pal Kappa With Beef 1 349"
    // "2 x Kuboos 12.00 24.00"
    // "Ginger Lime 40"
    const parsedItem = tryParseItemLine(line, currency, items.length + 1);
    if (parsedItem) {
      items.push(parsedItem);
    }
  }

  return {
    restaurantName: restaurantName || undefined,
    items,
    detectedSubtotalPaise,
    detectedTaxes,
    detectedDiscountPaise,
    detectedTotalPaise,
    rawText: text,
  };
}

function extractNumbers(str: string): number[] {
  const matches = str.match(/(?:[₹$€£\s])?(\d+(?:[.,]\d{1,2})?)/g);
  if (!matches) return [];
  return matches
    .map(m => {
      const cleaned = m.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned);
    })
    .filter(n => !isNaN(n) && n > 0);
}

function tryParseItemLine(line: string, currency: CurrencyCode, index: number): BillItem | null {
  // Check for leading quantity pattern: "2x Burger" or "2 Burger"
  let quantity = 1;
  let remainingLine = line;

  const leadingQtyMatch = remainingLine.match(/^(\d{1,2})\s*(?:x|\*|@)?\s+(.+)$/i);
  if (leadingQtyMatch) {
    const candidateQty = parseInt(leadingQtyMatch[1], 10);
    if (candidateQty > 0 && candidateQty <= 50) {
      quantity = candidateQty;
      remainingLine = leadingQtyMatch[2];
    }
  }

  // Extract all numbers in line
  const numbers = extractNumbers(remainingLine);
  if (numbers.length === 0) {
    return null; // Not an item line
  }

  // Last number is almost always the line total
  const lineTotal = numbers[numbers.length - 1];

  // If there are multiple numbers, penultimate number might be quantity or unit price
  let unitPrice = lineTotal;
  if (numbers.length >= 2) {
    const secondLast = numbers[numbers.length - 2];
    // Check if second last was a quantity (e.g. integer between 1 and 20)
    if (numbers.length >= 3) {
      // e.g. [2, 240, 480]
      quantity = Math.round(numbers[numbers.length - 3]);
      unitPrice = secondLast;
    } else if (secondLast > 0 && Math.abs(secondLast * quantity - lineTotal) < 1) {
      unitPrice = secondLast;
    } else if (secondLast > 0 && lineTotal % secondLast === 0 && lineTotal / secondLast <= 20) {
      quantity = lineTotal / secondLast;
      unitPrice = secondLast;
    } else {
      unitPrice = lineTotal / quantity;
    }
  } else {
    unitPrice = lineTotal / quantity;
  }

  // Extract item name: remove the trailing numbers and symbols
  const nameCleaned = remainingLine
    .replace(/(?:[₹$€£\s])?(\d+(?:[.,]\d{1,2})?)/g, '')
    .replace(/[*#=\-_x@]+$/i, '')
    .trim();

  // If item name is too short or empty, give a generic name
  const name = nameCleaned.length >= 2 ? nameCleaned : `Item #${index}`;

  const unitPricePaise = toPaise(unitPrice, currency);
  const totalPricePaise = toPaise(lineTotal, currency);

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name,
    quantity: Math.max(1, quantity),
    unitPricePaise: unitPricePaise || Math.round(totalPricePaise / Math.max(1, quantity)),
    totalPricePaise: totalPricePaise || unitPricePaise * Math.max(1, quantity),
    assignedPersonIds: [],
    assignments: [],
  };
}
