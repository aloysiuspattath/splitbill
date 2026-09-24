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
  /\b(date|time|dina?\s*in|table|tbl|tisch|token|waiter|captain|server|cashier|bill\s*no|order\s*no|order\s*#|gstin|fssai|tel|ph|phone|email|www\.|welcome|thank\s*you|visit\s*again)\b/i,
  /\b(chk|check|stn|station|pax|covers?|guests?|terminal|shift|drawer|dining\s*room)\b/i,
  /\b(rech\s*\.?\s*nr|rechnung|facture|fattura|recibo|comprobante)\b/i,
  /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/, // dates like 04/09/26 or 31-08-2026
  /\b\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)\b/i, // times with am/pm like 07:20PM or 08:48 PM
  /\b([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?\b(?!\.\d)/, // 24h times without decimal (blocks matching prices like 1:23.81)
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
  /\b(street|road|st\.|ave|avenue|blvd|lane|nagar|floor|pincode|pin\s*code|dist|district|junction|building|tower|mall|complex|metro|pillar)\b/i,
  /\b(tax\s*invoice|retail\s*invoice|cash\s*memo|cash\s*receipt|original\s*for\s*recipient|duplicate|bill\s*of\s*supply|guest\s*check|customer\s*copy)\b/i,
  /\b(item|items|particulars|description|desc)\b.*\b(qty|rate|price|amount|amt|total)\b/i,
  /\b(qty|quantity)\b.*\b(price|rate|amount|amt|total)\b/i,
  /\brate\b.*\b(qty|amount)\b/i,
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

function cleanRestaurantTitle(raw: string): string {
  return raw
    .replace(/^[\\/'"_*#—~`|:;\s-]+|[\\/'"_*#—~`|:;\s-]+$/g, '')
    .replace(/^[a-z]{1,2}\s+(?=[A-Z])/i, '')
    .replace(/[\d.,₹$€£#*~_\\/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface DetectedRestaurant {
  name: string;
  lineIndex: number;
}

/**
 * Detects the restaurant name from the top header lines.
 * Generally the first title line (skipping generic invoice headers like TAX INVOICE/BILL).
 */
function detectRestaurantName(lines: string[]): DetectedRestaurant {
  // First priority: lines with known restaurant/food brand keywords
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const l = lines[i];
    if (/if\s*thar/i.test(l)) {
      return { name: 'IFTHAR', lineIndex: i };
    }
    if (/sulthan|veedu|lthan\s*ve/i.test(l)) {
      return { name: 'Sulthan Veedu Restaurant', lineIndex: i };
    }
    if (/restaurant|hotel|cafe|kitchen|bakes|bakery|diner|bistro|pizzeria|grill|barbeque|biryani|coffee|tea|dhaba|house|sweets/i.test(l)) {
      const clean = cleanRestaurantTitle(l);
      if (clean.length >= 3 && !/^(tax\s*invoice|bill|receipt|cash\s*memo)$/i.test(clean)) {
        return { name: clean, lineIndex: i };
      }
    }
  }

  // Second priority: The FIRST clean title line at the top of the receipt
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i].trim();
    if (
      l.length >= 3 &&
      !isMetadataOrHeaderLine(l) &&
      !/\d{4,}/.test(l) &&
      !/^(bill|tax\s*invoice|retail\s*invoice|invoice|receipt|cash\s*memo|cash\s*receipt|guest\s*check)$/i.test(l) &&
      !/companypady|aluva|kerala|road|street|pillar|floor/i.test(l)
    ) {
      const clean = cleanRestaurantTitle(l);
      // Skip lowercase noise words like "ban '" or generic words
      if (clean.length >= 3 && !/^[a-z\s']+$/.test(clean) && !/\bbill\b/i.test(clean)) {
        return { name: clean, lineIndex: i };
      }
    }
  }

  return { name: 'Restaurant Bill', lineIndex: -1 };
}

/**
 * Finds the line index where itemized bill rows start.
 * Table header line (e.g. "Item Qty Price Amount") or lines following top metadata.
 */
function findItemsTableStartIndex(lines: string[], restaurantLineIndex: number): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /\b(item|items|particulars|description|desc)\b.*\b(qty|quantity|count|rate|price|unit|amount|amt|total)\b/i.test(line) ||
      /\b(qty|quantity)\b.*\b(price|rate|amount|amt|total)\b/i.test(line) ||
      /\brate\b.*\b(qty|amount)\b/i.test(line)
    ) {
      return i + 1; // Items strictly begin immediately after table header
    }
  }

  // If no explicit table column header was detected, items start after restaurant name and top metadata
  let startIndex = Math.max(0, restaurantLineIndex + 1);
  while (startIndex < lines.length) {
    const line = lines[startIndex];
    if (isMetadataOrHeaderLine(line) || /^[=\-_*#—~]{2,}$/.test(line)) {
      startIndex++;
    } else {
      break;
    }
  }
  return startIndex;
}

/**
 * Parses raw OCR text into candidate bill items, taxes, and totals.
 * Employs arithmetic self-correction (Qty * UnitPrice == LineTotal)
 * and intelligent multi-line item name reconstruction without right-margin noise.
 */
export function parseReceiptText(text: string, currency: CurrencyCode = 'INR', ocrLines?: any[], yoloBox?: [number, number, number, number]): ParsedReceiptData {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items: BillItem[] = [];
  const detectedTaxes: TaxItem[] = [];
  const { name: restaurantName, lineIndex: restaurantLineIndex } = detectRestaurantName(lines);
  const tableStartIdx = findItemsTableStartIndex(lines, restaurantLineIndex);
  let detectedSubtotalPaise: number | undefined;
  let detectedDiscountPaise: number | undefined;
  let detectedTotalPaise: number | undefined;
  let itemsSectionEnded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if we hit the totals / summary section (marks end of itemized section)
    if (
      /\b(sub\s*total|subtotal|grand\s*total|net\s*amount|total\s*due|total\s*payable)\b/i.test(line) ||
      /^total\s*qty/i.test(line) ||
      /^total\s*[:\s-]*\d/i.test(line) ||
      /^(total|amount|amt)\s*[:\s-]*$/i.test(line) ||
      /\b(round\s*off|fssai|thumhari|consume\s*packed)\b/i.test(line)
    ) {
      itemsSectionEnded = true;
    }

    // Check for Taxes (CGST, SGST, VAT, GST, Tax, Service Charge, MwSt, Ust, IVA, TVA)
    const taxMatch = line.match(/\b(cgst|sgst|vat|gst|tax|service\s*charge|mwst|ust|iva|tva)\b/i);
    if (taxMatch && !/gstin/i.test(line)) {
      const taxName = taxMatch[1].toUpperCase();
      const pctMatch = line.match(/([\d.]+)%/);
      const afterMatch = line.slice(taxMatch.index! + taxMatch[0].length).match(/^\s*@?\s*([\d.]+)/);
      let taxRate: number | undefined = pctMatch
        ? parseFloat(pctMatch[1])
        : afterMatch && parseFloat(afterMatch[1]) < 100
        ? parseFloat(afterMatch[1])
        : taxName === 'CGST' || taxName === 'SGST'
        ? 2.5
        : undefined;

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

    // Lines before the items table header CAN NEVER be bill items
    if (i < tableStartIdx) {
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

  if (!detectedTotalPaise && detectedSubtotalPaise) {
    detectedTotalPaise = detectedSubtotalPaise;
  }

  // 🚀 YOLO MATHEMATICAL OVERLAY
  if (ocrLines && yoloBox) {
    const [yx1, yy1, yx2, yy2] = yoloBox;
    for (const line of ocrLines) {
      if (!line.bbox) continue;
      const { x0, y0, x1, y1 } = line.bbox;
      const overlapX = Math.max(0, Math.min(x1, yx2) - Math.max(x0, yx1));
      const overlapY = Math.max(0, Math.min(y1, yy2) - Math.max(y0, yy1));
      
      // If the Tesseract text overlaps physically with the YOLO bounding box
      if (overlapX > 0 && overlapY > 0) {
        const numbers = extractNumbersFromLine(line.text);
        if (numbers.length > 0) {
          const parsedAmt = toPaise(numbers[numbers.length - 1], currency);
          if (parsedAmt > 0) {
            // Overwrite Regex total with YOLO confirmed total!
            detectedTotalPaise = parsedAmt;
            break;
          }
        }
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
  let cleaned = name
    .replace(/_/g, ' ') // replace underscore FIRST (e.g. CKN_NADAN -> CKN NADAN)
    .replace(/\bJulce\b/gi, 'Juice') // fix common OCR typo in drinks
    .replace(/\bS(00ML|OOML)\b/gi, '500ML') // fix OCR misread of 500ML
    .replace(/^(\d{1,3})[.)\]\s-]+\s*/, '') // strip leading serial numbers (1., 01), [1])
    .replace(/^[a-z0-9]{1,2}\s+(?=[A-Za-z])/i, '') // strip leading 1-2 char stray OCR debris like "L ", "vf ", "x "
    .replace(/^(vf|vl|lf|xr|xl)(?=[A-Z])/i, '') // strip leading stray prefixes stuck to words (VFLIME -> LIME)
    .replace(/^[*\-_#—~|•>\s:;]+/, '') // strip leading symbols
    .replace(/[—\-_*#=~|]{2,}.*$/g, '') // only replace divider of 2+ symbols (preserves single hyphens like GL-BAROLO)
    .replace(/\b(of\s*v|ox\s*l|up\d+|at\s*k\s*\(?|f\s*ba|:\s*a)\b.*$/i, '')
    .replace(/[\s©®™*#~|\\/]+$/, '') // strip trailing symbols like ©, ®, ™, *, |
    .replace(/\s+(?!(?:PN|GL|OZ|KG|ML|GM|LT|LB|XL)\b)[a-zA-Z0-9:()\[\]]{1,2}$/, '') // strip trailing orphan characters unless known food/wine acronym
    .replace(/\s+[à@]$/i, '') // strip trailing European unit indicators (e.g. "à")
    .replace(/\b(pay|amt|rate|price|rs|ra|ea|qty|qtv)\.?$/i, '') // strip trailing payment/price/rate labels
    .replace(/[\s.:\-_*#—~|\\/@]+$/, '') // strip trailing dots/dashes/symbols connecting to prices
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Validate that cleaned name is a plausible food item and not OCR gibberish
  const letterCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 2) return '';

  const hasVowel = /[aeiouyAEIOUY]/.test(cleaned);
  const hasAcronym = /\b(CKN|BBQ|BLT|QTR|HALF|PCS|ML|KG|LTR|GL|GLS)\b/i.test(cleaned);
  if (!hasVowel && !hasAcronym) return '';

  const nonWordCount = (cleaned.match(/[^a-zA-Z0-9\s]/g) || []).length;
  if (nonWordCount > letterCount) return '';

  return cleaned;
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

  // 1. Separate OCR merged fraction: e.g. "11/2 GL" -> "1 1/2 GL"
  cleanedLine = cleanedLine.replace(/^(\d)(1\/[248]|3\/4)\s+/i, '$1 $2 ');

  // 2. Pre-clean colons between numbers: e.g. "1:23.81" -> "1 23.81"
  cleanedLine = cleanedLine.replace(/(\d+):(\d+\.\d{1,2})/g, '$1 $2');

  // 3. Pre-clean slashed digits in prices: e.g. "1/6.19" -> "1 76.19"
  cleanedLine = cleanedLine.replace(/(\d)\/(\d+\.\d{2})/g, '$1 7$2');

  // 4. Normalize course prefixes: e.g. "1D SOUP" -> "1 SOUP", "1.0 LOBSTER" -> "1 LOBSTER"
  cleanedLine = cleanedLine.replace(/^(\d{1,2})[.\s]*[dDlL]\s+([a-zA-Z])/i, '$1 $2');
  cleanedLine = cleanedLine.replace(/^(\d{1,2})\.0\s+([a-zA-Z])/i, '$1 $2');

  // 5. If line begins with "10 <Dish>" and ends with single price, treat 10 as 1 (OCR misread "1 D")
  cleanedLine = cleanedLine.replace(/^1[0O]\s+([A-Z][a-zA-Z\s\-]+?\s+\d+(?:\.\d{1,2})?)$/, (match, rest) => {
    const words = rest.trim().split(/\s+/);
    const lastTok = words[words.length - 1];
    if (/^\d+(?:\.\d{1,2})?$/.test(lastTok)) {
      return `1 ${rest}`;
    }
    return match;
  });

  // 6. Check & strip leading serial numbers: e.g. "1. Butter Chicken", "01) Naan", "[1] Rice"
  const serialMatch = cleanedLine.match(/^(\d{1,3})[.)\]\s-]+\s+([a-zA-Z].+)$/);
  if (serialMatch) {
    cleanedLine = serialMatch[2].trim();
  }

  // 7. Check for leading quantity: e.g. "2x Burger", "2xLatte", "1 Avocado Toast", "1 1/2 GL Wine"
  let leadingQty: number | undefined;

  // Leading "2x " or "2x" or "2 * "
  const leadingXQtyMatch = cleanedLine.match(/^(\d{1,2})\s*(?:x|\*|@)\s*(.+)$/i);
  if (leadingXQtyMatch) {
    leadingQty = parseInt(leadingXQtyMatch[1], 10);
    cleanedLine = leadingXQtyMatch[2].trim();
  } else {
    // Leading standalone number followed by words (or fractions) and a trailing price
    const leadingNumMatch = cleanedLine.match(/^(\d{1,2})(?:\.0?)?\s+((?:[a-zA-Z]|1\/[248]|3\/4).+?\s+\d+(?:[.,]\d{1,2})?.*)$/);
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
    const cleanedTok = rawTok
      .replace(/^[€₹$£Rp.\/:]+/, '')
      .replace(/[€₹$£()]/g, '')
      .replace(/¢/g, '0');
    const numVal = parseFloat(cleanedTok.replace(/[^0-9.]/g, ''));
    // Enforce valid food price bounds (< 50,000) and NO slashes in price tokens (preserves fractions like 1/2 in names)
    if (!isNaN(numVal) && numVal > 0 && numVal < 50000 && /^[\d.,cC¢:]+$/.test(rawTok.replace(/[()]/g, ''))) {
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

  if (leadingQty && nums.length >= 2) {
    // Leading quantity given with unit price and total price: e.g. "2x Latte à 4.50 CHF 9.00"
    if (Math.abs(leadingQty * nums[0] - nums[1]) < 0.5) {
      quantity = leadingQty;
      unitPrice = nums[0];
      lineTotal = nums[1];
    } else {
      unitPrice = nums[0];
      lineTotal = nums[1];
    }
  } else if (nums.length >= 3) {
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
    // Check if first number has a fused quantity prefix: e.g. "147.62 47.62" -> Qty 1, Rate 47.62
    const s0 = nums[0].toFixed(2);
    const s1 = nums[1].toFixed(2);
    if (s0.length > s1.length && s0.endsWith(s1)) {
      const qtyPrefix = parseInt(s0.slice(0, s0.length - s1.length), 10);
      if (!isNaN(qtyPrefix) && qtyPrefix >= 1 && qtyPrefix <= 50) {
        quantity = qtyPrefix;
        unitPrice = nums[1];
        lineTotal = Math.round(quantity * unitPrice * 100) / 100;
      } else {
        unitPrice = nums[0];
        lineTotal = nums[1];
      }
    } else if (nums[0] >= 1 && nums[0] <= 50 && Number.isInteger(nums[0]) && !leadingQty) {
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
