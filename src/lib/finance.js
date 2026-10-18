function toMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function calcEMI(principal, annualRate, months) {
  const p = toMoney(principal);
  const n = Number(months);
  const rAnnual = Number(annualRate);
  if (!(p > 0) || !(n > 0) || n > 600) return 0;
  if (!(rAnnual > 0)) return toMoney(p / n);
  const r = rAnnual / 12 / 100;
  const pow = Math.pow(1 + r, n);
  return toMoney((p * r * pow) / (pow - 1));
}

export function simpleInterest(principal, annualRate, years) {
  return toMoney(toMoney(principal) * Number(annualRate) * Number(years) / 100);
}

export function compoundAmount(principal, annualRate, years, compoundsPerYear = 1) {
  const p = toMoney(principal);
  const n = Number(compoundsPerYear) || 1;
  const t = Number(years);
  const r = Number(annualRate) / 100;
  if (!(p >= 0) || !(t >= 0) || n <= 0) return p;
  return toMoney(p * Math.pow(1 + r / n, n * t));
}

export function sipFutureValue(monthly, annualRate, months) {
  const m = toMoney(monthly);
  const n = Number(months);
  if (!(m > 0) || !(n > 0)) return 0;
  const i = Number(annualRate) / 12 / 100;
  if (!(i > 0)) return toMoney(m * n);
  return toMoney(m * ((Math.pow(1 + i, n) - 1) / i) * (1 + i));
}

export function monthlySavingsRequired(target, alreadySaved, monthsRemaining) {
  const need = toMoney(Math.max(0, toMoney(target) - toMoney(alreadySaved)));
  const n = Number(monthsRemaining);
  if (!(n > 0)) return need;
  return toMoney(need / n);
}

export { toMoney };
