import { CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2 },
};

/**
 * Convert user decimal input (e.g. 240.50) into integer smallest currency units (paise/cents).
 * Avoids float math quirks like 240.50 * 100 = 24050.000000000004 by rounding.
 */
export function toPaise(amount: number | string, currency: CurrencyCode = 'INR'): number {
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return 0;
    amount = parsed;
  }
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  const factor = Math.pow(10, config.decimals);
  return Math.round(amount * factor);
}

/**
 * Convert smallest currency units (paise) back to float decimal.
 */
export function fromPaise(paise: number, currency: CurrencyCode = 'INR'): number {
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  const factor = Math.pow(10, config.decimals);
  return paise / factor;
}

/**
 * Format paise into a clean readable string, e.g. "₹240" or "₹147.50".
 */
export function formatMoney(paise: number, currency: CurrencyCode = 'INR', showSymbol: boolean = true): string {
  const config = CURRENCIES[currency] || CURRENCIES.INR;
  const decimalValue = fromPaise(paise, currency);
  
  const formattedNumber = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: decimalValue % 1 === 0 ? 0 : config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(decimalValue);

  if (!showSymbol) return formattedNumber;
  return `${config.symbol}${formattedNumber}`;
}
