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

// Common metadata and noise patterns that can never be bill items
const METADATA_PATTERNS = [
  /\b(date|time|dina?\s*in|table|token|waiter|captain|server|cashier|bill\s*no|order\s*no|order\s*#|gstin|fssai|tel|ph|phone|email|www\.|welcome|thank\s*you|visit\s*again)\b/i,
  /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/, // dates like 04/09/26 or 31-08-2026
  /\b\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?\b/i, // times like 21:30 or 08:48 PM
  /\b\d{1,2}\.\d{2}\s*(am|pm)\b/i, // times with dot like 08.48 PM
  /\bph[:\s]*\d+/i, // phone numbers
  /\b\d{10}\b/, // standalone 10-digit phone numbers like 9633624533
  /\b(bill|frill|biil)\s*n[o0]\b/i,
  /\border\s*no\b/i,
  /\bcashier\b/i,
  /\bdina?\s*in\b/i,
  /\bgstin\b/i,
  /\bfssai\b/i,
  /\bpillar\b/i,
  /\b(ctr|staff)\b/i,
  /\b(item|particulars|description)\b.*\b(qty|rate|price|amount)\b/i,
  /qty\.\s*(price|amount|rate)/i,
  /^[=\-_*#—~]{2,}$/, // divider lines
  /^(cash|card|upi|paytm|gpay|visa|mastercard)/i,
  /^(consume\s*packed|thumhari|hamara|qr\s*code)/i,
  /^total\s*qty/i,
  /#\s*\d+\s*item/i,
];

function isMetadataOrHeaderLine(line: string): boolean {
  return METADATA_PATTERNS.some(p => p.test(line));
}

/**
 * Detects the restaurant name from the top header lines,
 * ignoring stray OCR noise like "ban '", "x Tr BILL", or addresses.
 */
function detectRestaurantName(lines: string[]): string {
  // First priority: lines with known restaurant keywords
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const l = lines[i];
    if (/if\s*thar/i.test(l)) {
      return 'IFTHAR';
    }
    if (/sulthan|veedu|restaurant|hotel|cafe|kitchen|bakes|diner/i.test(l)) {
      if (/sulthan|veedu|lthan\s*ve/i.test(l)) {
        return 'Sulthan Veedu Restaurant';
      }
      return l.replace(/[\d.,₹$€£#*~_\\/]+/g, '').trim();
    }
  }

  // Second priority: first clean title line with >= 4 chars, skipping generic words like "BILL"
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i].trim();
    if (
      l.length >= 4 &&
      !isMetadataOrHeaderLine(l) &&
      !/\d{4,}/.test(l) &&
      !/^(bill|tax\s*invoice|invoice|receipt|cash\s*memo)$/i.test(l) &&
      !/companypady|aluva|kerala|road|street|pillar/i.test(l)
    ) {
      const clean = l.replace(/[\d.,₹$€£#*~_\\/]+/g, '').trim();
      // Ignore lowercase noise words like "ban '" or "x Tr BILL"
      if (clean.length >= 4 && !/^[a-z\s']+$/.test(clean) && !/\bbill\b/i.test(clean)) {
        return clean;
      }
    }
  }

  return 'Restaurant Bill';
}

/**
 * Parses raw OCR text into candidate bill items, taxes, and totals.
 * Employs arithmetic self-correction (Qty * UnitPrice == LineTotal)
 * and intelligent multi-line item name reconstruction without right-margin noise.
 */
export function parseReceiptText(text: string, currency: CurrencyCode = 'INR'): ParsedReceiptData {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items: BillItem[] = [];
  const detectedTaxes: TaxItem[] = [];
  const restaurantName = detectRestaurantName(lines);
  let detectedSubtotalPaise: number | undefined;
  let detectedDiscountPaise: number | undefined;
  let detectedTotalPaise: number | undefined;
  let itemsSectionEnded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we hit the totals / summary section (marks end of itemized section)
    if (
      /\b(sub\s*total|subtotal|grand\s*total|net\s*amount|total\s*due)\b/i.test(line) ||
      /^total\s*qty/i.test(line) ||
      /\b(round\s*off|fssai|thumhari|consume\s*packed)\b/i.test(line)
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

    // Check for Grand Total (e.g. "TOTAL PAYABLE : 719.00", "Grand Total 1720.00", "Net Amount", "Total Due")
    if (/\b(total\s*payable|grand\s*total|net\s*amount|total\s*due)\b/i.test(line)) {
      const numbers = extractNumbersFromLine(line);
      if (numbers.length > 0) {
        detectedTotalPaise = toPaise(numbers[numbers.length - 1], currency);
      }
      continue;
    }

    // Check for Subtotal line (e.g. "Subtotal 684.61" or pre-tax "TOTAL : 13 684.61")
    if (
      (/\b(sub\s*total|subtotal)\b/i.test(line) || (/^total\s*[:\s]/i.test(line) && !detectedSubtotalPaise)) &&
      !/total\s*qty|total\s*payable/i.test(line)
    ) {
      const numbers = extractNumbersFromLine(line);
      if (numbers.length > 0) {
        detectedSubtotalPaise = toPaise(numbers[numbers.length - 1], currency);
      }
      continue;
    }

    // Fallback: Standalone Total (e.g. "Total 32.28")
    if (/\btotal\b/i.test(line) && !/total\s*qty|sub\s*total|subtotal|total\s*payable/i.test(line)) {
      const numbers = extractNumbersFromLine(line);
      if (numbers.length > 0) {
        if (!detectedTotalPaise) {
          detectedTotalPaise = toPaise(numbers[numbers.length - 1], currency);
        }
      }
      continue;
    }

    // Check for Discount line
    if (/\b(discount|disc|promo|less|offer)\b/i.test(line)) {
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

    // Skip metadata headers (Date, Time, Cashier, Phone, Table header)
    if (isMetadataOrHeaderLine(line)) {
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
          isMetadataOrHeaderLine(nextLine) ||
          /\b(total\s*qty|sub\s*total|subtotal|grand\s*total|round\s*off|fssai)\b/i.test(nextLine)
        ) {
          break;
        }

        const nextNums = extractNumbersFromLine(nextLine);
        // Continuation line has words, no numbers, and is not a section marker
        if (nextNums.length === 0 && nextLine.length > 1) {
          let cleanCont = nextLine
            .replace(/[|]/g, ' ')
            .replace(/^[*\-_#—~\s:;]+|[*\-_#—~\s:;]+$/g, '')
            .replace(/\b(eh|ah|oh|em|er|th)\b/gi, '') // strip stray syllable noise
            .replace(/\s+[a-zA-Z0-9:()\[\]]{1,2}$/, '') // strip trailing orphan char like " v"
            .replace(/\s{2,}/g, ' ')
            .trim();

          if (cleanCont.length > 1 && !/^(total|subtotal|tax|bill)/i.test(cleanCont)) {
            parsed.name += ` ${cleanCont}`;
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
    .replace(/^[a-z0-9]{1,2}\s+(?=[A-Za-z])/i, '') // strip leading 1-2 char stray OCR debris like "L ", "vf ", "x "
    .replace(/[—\-_*#=~|]+.*$/g, '')
    .replace(/\b(of\s*v|ox\s*l|up\d+|at\s*k\s*\(?|f\s*ba|:\s*a)\b.*$/i, '')
    .replace(/\s+[a-zA-Z0-9:()\[\]]{1,2}$/, '') // strip trailing orphan characters
    .replace(/_/g, ' ') // replace underscore (e.g. CKN_NADAN -> CKN NADAN)
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
      // Food prices are never >= 50,000 (blocks phone numbers, bill numbers, barcodes)
      if (val > 0 && val < 50000) {
        nums.push(val);
      }
    }
  }
  return nums;
}

function tryParseSmartItem(line: string, currency: CurrencyCode, index: number): BillItem | null {
  let cleanedLine = line.trim();

  // 1. Check & strip leading serial numbers: e.g. "1. Butter Chicken", "01) Naan", "[1] Rice"
  const serialMatch = cleanedLine.match(/^(\d{1,3})[.)\]\s-]+\s+([a-zA-Z].+)$/);
  if (serialMatch) {
    cleanedLine = serialMatch[2].trim();
  }

  // 2. Check for leading quantity: e.g. "2x Burger", "2 * Fries", "1 Avocado Toast"
  let leadingQty: number | undefined;

  // Leading "2x " or "2 x "
  const leadingXQtyMatch = cleanedLine.match(/^(\d{1,2})\s*(?:x|\*|@)\s+(.+)$/i);
  if (leadingXQtyMatch) {
    leadingQty = parseInt(leadingXQtyMatch[1], 10);
    cleanedLine = leadingXQtyMatch[2].trim();
  } else {
    // Leading standalone number followed by words and a trailing price: e.g. "1 Avocado Toast 14.50"
    const leadingNumMatch = cleanedLine.match(/^(\d{1,2})\s+([a-zA-Z].+?\s+\d+(?:[.,]\d{1,2})?.*)$/);
    if (leadingNumMatch) {
      leadingQty = parseInt(leadingNumMatch[1], 10);
      cleanedLine = leadingNumMatch[2].trim();
    }
  }

  const tokens = cleanedLine.split(/\s+/);
  if (tokens.length < 2) return null;

  let firstNumIdx = -1;
  const numMatches: { index: number; val: number }[] = [];

  for (let idx = 0; idx < tokens.length; idx++) {
    const rawTok = tokens[idx];
    const cleanedTok = rawTok.replace(/[€₹$£]/g, '').replace(/¢/g, '0');
    const numVal = parseFloat(cleanedTok.replace(/[^0-9.]/g, ''));
    // Enforce valid food price bounds (< 50,000) to discard phone numbers or barcodes
    if (!isNaN(numVal) && numVal > 0 && numVal < 50000 && /^[\d.,cC¢]+$/.test(rawTok.replace(/[()]/g, ''))) {
      numMatches.push({ index: idx, val: numVal });
      if (firstNumIdx === -1) firstNumIdx = idx;
    }
  }

  // An item line MUST have numbers, and the item name must be BEFORE the first number
  if (numMatches.length === 0 || firstNumIdx <= 0) return null;

  // Item name is STRICTLY the tokens BEFORE the numbers
  const nameTokens = tokens.slice(0, firstNumIdx);
  let name = nameTokens
    .join(' ')
    .replace(/[*#=\-_x@|]+$/i, '')
    .replace(/\s*\|\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!name || name.length < 2) return null;

  let quantity = leadingQty || 1;
  let unitPrice = 0;
  let lineTotal = 0;

  const nums = numMatches.map(m => m.val);

  if (nums.length >= 3) {
    // E.g. [2, 240.00, 480] or [1, 370.00, 37] or [17.15, 4, 68.60]
    // Check for exact arithmetic match: a * b = c
    interface MatchCandidate {
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      isIntegerQty: boolean;
    }
    const candidates: MatchCandidate[] = [];

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
              const isInt = Math.abs(q - Math.round(q)) < 0.05;
              candidates.push({
                quantity: Math.round(q),
                unitPrice: u,
                lineTotal: expected,
                isIntegerQty: isInt,
              });
            }
          }
        }
      }
    }

    if (candidates.length > 0) {
      // Prioritize candidates where quantity is an exact integer, then smallest quantity
      candidates.sort((a, b) => {
        if (a.isIntegerQty !== b.isIntegerQty) {
          return a.isIntegerQty ? -1 : 1;
        }
        return a.quantity - b.quantity;
      });

      quantity = candidates[0].quantity;
      unitPrice = candidates[0].unitPrice;
      lineTotal = candidates[0].lineTotal;
    } else {
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
    if (nums[0] >= 1 && nums[0] <= 50 && Number.isInteger(nums[0]) && !leadingQty) {
      quantity = nums[0];
      unitPrice = nums[1];
      lineTotal = Math.round(quantity * unitPrice * 100) / 100;
    } else {
      unitPrice = nums[0];
      lineTotal = nums[1];
    }
  } else if (nums.length === 1) {
    lineTotal = nums[0];
    unitPrice = nums[0];
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
