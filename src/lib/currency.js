/**
 * FinTrack Multi-Currency & Real-Time FX Conversion Engine
 * Supports international currency conversions, rate calculation,
 * and live exchange rate synchronization with offline caching.
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', region: 'India', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', region: 'United States', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', region: 'Eurozone', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', region: 'United Kingdom', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', region: 'Japan', locale: 'ja-JP' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', region: 'United Arab Emirates', locale: 'ar-AE' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦', region: 'Canada', locale: 'en-CA' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', region: 'Singapore', locale: 'en-SG' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', region: 'Australia', locale: 'en-AU' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭', region: 'Switzerland', locale: 'de-CH' },
];

export const CURRENCIES = SUPPORTED_CURRENCIES;

// Baseline reference rates relative to 1 USD
export const BASE_USD_RATES = {
  USD: 1.0,
  INR: 86.85,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.20,
  AED: 3.67,
  CAD: 1.38,
  SGD: 1.35,
  AUD: 1.55,
  CHF: 0.88,
};

const FX_STORAGE_KEY = 'fintrack_fx_rates_cache';
const FX_UPDATED_KEY = 'fintrack_fx_last_updated';

export function getActiveRates() {
  if (typeof window === 'undefined') return BASE_USD_RATES;
  try {
    const raw = localStorage.getItem(FX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...BASE_USD_RATES, ...parsed };
      }
    }
  } catch {
    // fallback
  }
  return BASE_USD_RATES;
}

export function getLastFXSyncTime() {
  if (typeof window === 'undefined') return null;
  const time = localStorage.getItem(FX_UPDATED_KEY);
  return time ? new Date(time) : null;
}

export async function syncLiveFXRates() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('FX HTTP error');
    const data = await res.json();
    if (data && data.rates) {
      const filtered = {};
      SUPPORTED_CURRENCIES.forEach(c => {
        if (data.rates[c.code]) {
          filtered[c.code] = data.rates[c.code];
        }
      });
      localStorage.setItem(FX_STORAGE_KEY, JSON.stringify(filtered));
      localStorage.setItem(FX_UPDATED_KEY, new Date().toISOString());
      return { success: true, rates: filtered, time: new Date() };
    }
  } catch {
    // Use fallback rates gracefully
  }
  return { success: false, rates: getActiveRates(), time: getLastFXSyncTime() || new Date() };
}

export function getExchangeRate(fromCode = 'INR', toCode = 'USD') {
  const from = (fromCode || 'INR').toUpperCase();
  const to = (toCode || 'USD').toUpperCase();
  if (from === to) return 1.0;

  const rates = getActiveRates();
  const rateFrom = rates[from] || BASE_USD_RATES[from] || 1;
  const rateTo = rates[to] || BASE_USD_RATES[to] || 1;

  // Base is USD: 1 from = (1 / rateFrom) USD = (rateTo / rateFrom) to
  return rateTo / rateFrom;
}

export function convertCurrency(amount = 0, fromCode = 'INR', toCode = 'USD') {
  const val = Number(amount || 0);
  if (val === 0) return 0;
  const rate = getExchangeRate(fromCode, toCode);
  return val * rate;
}

export function formatCurrencyFX(amount = 0, currencyCode = 'USD', compact = false) {
  const code = (currencyCode || 'USD').toUpperCase();
  const item = SUPPORTED_CURRENCIES.find(c => c.code === code);
  const locale = item?.locale || 'en-US';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
    }).format(amount);
  } catch {
    const sym = item?.symbol || code;
    return `${sym}${Number(amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
