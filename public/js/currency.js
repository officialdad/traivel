// Currency utility module

export const SYMBOLS = {
  MYR: 'RM', USD: '$', JPY: '¥', EUR: '€', GBP: '£', SGD: 'S$',
  THB: '฿', AUD: 'A$', KRW: '₩', CNY: '¥', TWD: 'NT$', IDR: 'Rp',
  PHP: '₱', INR: '₹', AED: 'د.إ', CHF: 'CHF', HKD: 'HK$', NZD: 'NZ$',
  CAD: 'C$', VND: '₫',
};

export const SYMBOL_TO_CODE = {
  '¥': 'JPY', '$': 'USD', '€': 'EUR', '£': 'GBP', 'RM': 'MYR',
  '₩': 'KRW', '฿': 'THB', '₱': 'PHP', '₹': 'INR', '₫': 'VND',
  'Rp': 'IDR',
};

export function getCurrencySymbol(code) {
  return SYMBOLS[code] || code || '';
}

export function normalizeCurrencyCode(raw) {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase();
  if (SYMBOLS[upper]) return upper;
  return SYMBOL_TO_CODE[raw.trim()] || upper;
}

// In-memory cache: { code, rate, fetchedAt }
let rateCache = null;

export async function getExchangeRate(fromCurrency) {
  const code = normalizeCurrencyCode(fromCurrency);
  if (!code || code === 'MYR') return null;

  if (rateCache && rateCache.code === code && (Date.now() - rateCache.fetchedAt) < 30 * 60 * 1000) {
    return rateCache.rate;
  }

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${code}`);
    const data = await res.json();
    if (data.result !== 'success' || !data.rates?.MYR) return null;
    const rate = data.rates.MYR;
    rateCache = { code, rate, fetchedAt: Date.now() };
    return rate;
  } catch {
    return null;
  }
}

export function convertToMYR(amount, rate) {
  if (!rate || !amount) return null;
  return amount * rate;
}

export function formatMYR(amount) {
  if (amount == null) return '—';
  return `RM${formatNumber(amount)}`;
}

export function formatNumber(num) {
  if (num == null) return '';
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const CURRENCY_CODES = [
  'MYR', 'USD', 'JPY', 'EUR', 'GBP', 'SGD', 'THB', 'AUD', 'KRW', 'CNY',
  'TWD', 'IDR', 'PHP', 'INR', 'AED', 'CHF', 'HKD', 'NZD', 'CAD', 'VND',
];
