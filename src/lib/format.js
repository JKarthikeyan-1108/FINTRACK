let currencyCode = 'INR';
let localeCode = 'en-IN';

export function setMoneyFormat({ currency, locale } = {}) {
  if (currency) currencyCode = currency;
  if (locale) localeCode = locale;
}

function formatter(compact = false) {
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: currencyCode,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  });
}

export function money(value, compact = false) {
  const amount = Number(value || 0);
  try {
    return formatter(compact).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

export function number(value) {
  return Number(value || 0).toLocaleString(localeCode);
}

export function pct(value, digits = 0) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

export function parseDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateShort(value) {
  const date = parseDate(value);
  if (!date) return 'No date';
  return date.toLocaleDateString(localeCode, {
    day: 'numeric',
    month: 'short',
  });
}

export function dateLong(value) {
  const date = parseDate(value);
  if (!date) return 'No date';
  return date.toLocaleDateString(localeCode, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function daysUntil(value) {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date - today) / 86400000);
}
