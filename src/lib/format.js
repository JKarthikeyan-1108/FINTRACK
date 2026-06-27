const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function money(value, compact = false) {
  const amount = Number(value || 0);
  return compact ? inrCompact.format(amount) : inr.format(amount);
}

export function number(value) {
  return Number(value || 0).toLocaleString('en-IN');
}

export function pct(value, digits = 0) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

export function dateShort(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function dateLong(value) {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function daysUntil(value) {
  if (!value) return null;
  return Math.ceil((new Date(value) - new Date()) / 86400000);
}
