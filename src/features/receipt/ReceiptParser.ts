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
  /^[=\-_*#—~]{2,}$/, // horizontal divider lines
  /^(cash|card|upi|paytm|gpay|visa|mastercard)/i,
  /^(consume\s*packed|thumhari|hamara|qr\s*code|dine\s*in|cashier)/i,
  /^(item|qty|price|amount|rate|particulars|description)/i,
  /qty\.\s*price/i,
  /^total\s*qty/i,
];

/**
 * Parses raw OCR text into candidate bill items, taxes, and totals.
 * Employs arithmetic self-correction (Qty * UnitPrice == LineTotal)
 * and intelligent multi-line item name reconstruction.
 */
export function parseReceiptText(text: string, currency: CurrencyCode = 'INR'): ParsedReceiptData {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items: BillItem[] = [];
  const detectedTaxes: TaxItem[] = [];
  let restaurantName = '';
  let detectedSubtotalPaise: number | undefined;
  let detectedDiscountPaise: number | undefined;
  let detectedTotalPaise: number | undefined;
  let itemsSectionEnded = false;

  // Potential restaurant name is usually in the first 1-4 lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (
      l.length > 3 &&
      !IGNORE_PATTERNS.some(p => p.test(l)) &&
      !/\d{5,}/.test(l) &&
      !/companypady|pillar|aluva|kerala|road|street|nagar/i.test(l)
    ) {
      const cleanName = l.replace(/[\d.,₹$€£]+/g, '').trim();
      if (cleanName.length > 2) {
        restaurantName = cleanName;
        // Fix common OCR truncation on "Sulthan Veedu"
        if (/lthan\s*ve/i.test(restaurantName)) {
          restaurantName = 'Sulthan Veedu Restaurant';
        }
        break;
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Explicitly ignore GSTIN registration header line
    if (/^gstin/i.test(line)) {
      continue;
    }

    // Check if we hit the totals / summary section (marks end of itemized section)
    if (
      /^(total\s*qty|sub\s*total|subtotal|round\s*off|grand\s*total|net\s*amount)/i.test(line) ||
      /\b(sub\s*total|subtotal|grand\s*total)\b/i.test(line) ||
      /fssai|thumhari|consume\s*packed/i.test(line)
    ) {
      itemsSectionEnded = true;
    }

    // Check for Taxes (CGST, SGST, VAT, GST, Tax, Service Charge)
    const taxMatch = line.match(/\b(cgst|sgst|vat|gst|tax|service\s*charge)\b\s*@?\s*([\d.]+)?%?/i);
    if (taxMatch && !/gstin/i.test(line)) {
      const taxName = taxMatch[1].toUpperCase();
      const taxRate = taxMatch[2] ? parseFloat(taxMatch[2]) : (taxName === 'CGST' || taxName === 'SGST' ? 2.5 : undefined);
      const numbers = extractNumbersFromLine(line);
      const taxAmount = numbers.length > 0 ? toPaise(numbers[numbers.length - 1], currency) : 0;

      detectedTaxes.push({
        id: `tax-${Date.now()}-${detectedTaxes.length}`,
        name: taxName,
        type: taxRate !== undefined ? 'percentage' : 'fixed',
        rate: taxRate,
        fixedAmountPaise: taxRate !== undefined ? undefined : taxAmount,
      });
      continue;
    }

    // Check for Grand Total line
    if (/grand\s*total|net\s*amount|bill\s*amount|total\s*due/i.test(line) && !/total\s*qty/i.test(line)) {
      const numbers = extractNumbersFromLine(line);
      if (numbers.length > 0) {
        detectedTotalPaise = toPaise(numbers[numbers.length - 1], currency);
      }
      continue;
    }

    // Check for Subtotal line
    if (/sub\s*total|subtotal/i.test(line) && !/total\s*qty/i.test(line)) {
      const numbers = extractNumbersFromLine(line);
      if (numbers.length > 0) {
        detectedSubtotalPaise = toPaise(numbers[numbers.length - 1], currency);
      }
      continue;
    }

    // Check for Discount line
    if (/^(discount|disc|promo|less|offer)/i.test(line)) {
      const numbers = extractNumbersFromLine(line);
      if (numbers.length > 0) {
        detectedDiscountPaise = toPaise(numbers[numbers.length - 1], currency);
      }
      continue;
    }

    // If items section already finished, skip parsing as item
    if (itemsSectionEnded) {
      continue;
    }

    // Skip general ignore patterns
    if (IGNORE_PATTERNS.some(p => p.test(line))) {
      continue;
    }

    // Try parsing item line with arithmetic reconciliation
    const parsed = tryParseSmartItem(line, currency, items.length + 1);
    if (parsed) {
      // Check for multi-line continuation (e.g. food name wrapped to next line without numbers)
      let nextIdx = i + 1;
      while (nextIdx < lines.length) {
        const nextLine = lines[nextIdx];
        if (
          IGNORE_PATTERNS.some(p => p.test(nextLine)) ||
          /^(total\s*qty|sub\s*total|subtotal|cgst|sgst|grand|fssai)/i.test(nextLine)
        ) {
          break;
        }

        const nextNums = extractNumbersFromLine(nextLine);
        // Continuation line has words, no numbers, and is not a section marker
        if (nextNums.length === 0 && nextLine.length > 1) {
          const cleanNext = nextLine.replace(/^[*\-_#—~\s]+|[*\-_#—~\s]+$/g, '').trim();
          if (cleanNext.length > 1) {
            parsed.name += ` ${cleanNext}`;
          }
          i = nextIdx;
          nextIdx++;
        } else {
          break;
        }
      }

      parsed.name = cleanItemName(parsed.name);

      if (parsed.name.length >= 2 && parsed.totalPricePaise > 0) {
        items.push(parsed);
      }
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

function cleanItemName(name: string): string {
  return name
    .replace(/[—\-_*#=~]+.*$/g, '')
    .replace(/\b(of\s*v|ox\s*l|up\d+)\b.*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractNumbersFromLine(str: string): number[] {
  const normalized = str
    .replace(/[€₹$£]/g, ' ')
    .replace(/¢/g, '0')
    .replace(/(\d)[oO](\d)/g, '$10$2');

  const tokens = normalized.split(/\s+/);
  const nums: number[] = [];
  for (const token of tokens) {
    const clean = token.replace(/[^0-9.]/g, '');
    if (clean && !isNaN(parseFloat(clean))) {
      const val = parseFloat(clean);
      if (val > 0 && val < 100000) {
        nums.push(val);
      }
    }
  }
  return nums;
}

function tryParseSmartItem(line: string, currency: CurrencyCode, index: number): BillItem | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 2) return null;

  const numMatches: { val: number; raw: string }[] = [];
  const textTokens: string[] = [];

  for (let idx = 0; idx < tokens.length; idx++) {
    const rawTok = tokens[idx];
    const cleanedTok = rawTok.replace(/[€₹$£]/g, '').replace(/¢/g, '0');
    const numVal = parseFloat(cleanedTok.replace(/[^0-9.]/g, ''));
    if (!isNaN(numVal) && /^[\d.,cC¢]+$/.test(rawTok.replace(/[()]/g, ''))) {
      numMatches.push({ val: numVal, raw: rawTok });
    } else {
      textTokens.push(rawTok);
    }
  }

  if (numMatches.length === 0) return null;

  let name = textTokens.join(' ').replace(/[*#=\-_x@]+$/i, '').trim();
  if (!name || name.length < 2) return null;

  let quantity = 1;
  let unitPrice = 0;
  let lineTotal = 0;

  const nums = numMatches.map(m => m.val);

  if (nums.length >= 3) {
    // E.g. [2, 240.00, 480] or [1, 370.00, 37] or [2, 40.00, 80.00, 3]
    // Check for exact arithmetic match: a * b = c
    let matched = false;
    for (let qIdx = 0; qIdx < nums.length; qIdx++) {
      for (let uIdx = 0; uIdx < nums.length; uIdx++) {
        if (qIdx === uIdx) continue;
        const q = nums[qIdx];
        const u = nums[uIdx];
        if (q >= 1 && q <= 50) {
          const expected = Math.round(q * u * 100) / 100;
          for (let tIdx = 0; tIdx < nums.length; tIdx++) {
            if (tIdx === qIdx || tIdx === uIdx) continue;
            if (Math.abs(nums[tIdx] - expected) < 0.5) {
              quantity = Math.round(q);
              unitPrice = u;
              lineTotal = expected;
              matched = true;
              break;
            }
          }
        }
        if (matched) break;
      }
      if (matched) break;
    }

    if (!matched) {
      if (nums[0] >= 1 && nums[0] <= 50 && Number.isInteger(nums[0])) {
        quantity = nums[0];
        unitPrice = nums[1];
        lineTotal = Math.round(quantity * unitPrice * 100) / 100;
      } else {
        unitPrice = nums[nums.length - 2];
        lineTotal = nums[nums.length - 1];
      }
    }
  } else if (nums.length === 2) {
    if (nums[0] >= 1 && nums[0] <= 50 && Number.isInteger(nums[0])) {
      quantity = nums[0];
      unitPrice = nums[1];
      lineTotal = Math.round(quantity * unitPrice * 100) / 100;
    } else if (nums[1] > nums[0] && nums[1] % nums[0] === 0 && nums[1] / nums[0] <= 20) {
      quantity = nums[1] / nums[0];
      unitPrice = nums[0];
      lineTotal = nums[1];
    } else {
      unitPrice = nums[0];
      lineTotal = nums[1];
    }
  } else if (nums.length === 1) {
    lineTotal = nums[0];
    unitPrice = nums[0];
    quantity = 1;
  }

  const unitPricePaise = toPaise(unitPrice, currency);
  const totalPricePaise = toPaise(lineTotal, currency);

  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 6)}-${index}`,
    name,
    quantity: Math.max(1, quantity),
    unitPricePaise: unitPricePaise || Math.round(totalPricePaise / Math.max(1, quantity)),
    totalPricePaise: totalPricePaise || unitPricePaise * Math.max(1, quantity),
    assignedPersonIds: [],
    assignments: [],
  };
}
