const { toMoney } = require('./money');

/**
 * Reducing-balance EMI. Zero interest → equal principal instalments.
 * @param {number} principal
 * @param {number} annualRate percent (e.g. 10.5)
 * @param {number} months
 */
function calcEMI(principal, annualRate, months) {
  const p = toMoney(principal);
  const n = Number(months);
  const rAnnual = Number(annualRate);
  if (!(p > 0) || !(n > 0) || n > 600) return 0;
  if (!(rAnnual > 0)) return toMoney(p / n);
  const r = rAnnual / 12 / 100;
  const pow = Math.pow(1 + r, n);
  return toMoney((p * r * pow) / (pow - 1));
}

function amortizationPaid(principal, annualRate, months, paidMonths) {
  const p = toMoney(principal);
  const n = Number(months);
  const paid = Math.max(0, Math.min(Number(paidMonths) || 0, n));
  const emi = calcEMI(p, annualRate, n);
  const r = Number(annualRate) > 0 ? Number(annualRate) / 12 / 100 : 0;
  let remaining = p;
  let interestPaid = 0;
  let principalPaid = 0;
  for (let i = 0; i < paid; i += 1) {
    const interest = toMoney(remaining * r);
    let principalForMonth = toMoney(emi - interest);
    if (principalForMonth > remaining) principalForMonth = remaining;
    interestPaid = toMoney(interestPaid + interest);
    principalPaid = toMoney(principalPaid + principalForMonth);
    remaining = toMoney(remaining - principalForMonth);
  }
  return {
    emi,
    remaining,
    interestPaid,
    principalPaid,
    totalPayable: toMoney(emi * n),
    totalInterest: toMoney(emi * n - p),
    remainingTenure: Math.max(0, n - paid),
  };
}

function simpleInterest(principal, annualRate, years) {
  const p = toMoney(principal);
  return toMoney(p * Number(annualRate) * Number(years) / 100);
}

function compoundAmount(principal, annualRate, years, compoundsPerYear = 1) {
  const p = toMoney(principal);
  const n = Number(compoundsPerYear) || 1;
  const t = Number(years);
  const r = Number(annualRate) / 100;
  if (!(p >= 0) || !(t >= 0) || n <= 0) return p;
  return toMoney(p * Math.pow(1 + r / n, n * t));
}

/** Future value of an ordinary monthly SIP (contribution at end of each month). */
function sipFutureValue(monthly, annualRate, months) {
  const m = toMoney(monthly);
  const n = Number(months);
  if (!(m > 0) || !(n > 0)) return 0;
  const i = Number(annualRate) / 12 / 100;
  if (!(i > 0)) return toMoney(m * n);
  const fv = m * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  return toMoney(fv);
}

function monthlySavingsRequired(target, alreadySaved, monthsRemaining) {
  const need = toMoney(Math.max(0, toMoney(target) - toMoney(alreadySaved)));
  const n = Number(monthsRemaining);
  if (!(n > 0)) return need;
  return toMoney(need / n);
}

function isoWeekKey(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whether an expense date (YYYY-MM-DD) counts toward a budget's current period. */
function transactionInBudgetPeriod(dateStr, budget, now = new Date()) {
  if (!dateStr) return false;
  const period = budget.period || 'monthly';
  if (period === 'custom') {
    const start = budget.start_date || '0000-01-01';
    const end = budget.end_date || '9999-12-31';
    return dateStr >= start && dateStr <= end;
  }
  const today = ymd(now);
  if (period === 'yearly') return dateStr.slice(0, 4) === today.slice(0, 4);
  if (period === 'monthly') return dateStr.slice(0, 7) === today.slice(0, 7);
  if (period === 'weekly') return isoWeekKey(dateStr) === isoWeekKey(today);
  return dateStr.slice(0, 7) === today.slice(0, 7);
}

module.exports = {
  calcEMI,
  amortizationPaid,
  simpleInterest,
  compoundAmount,
  sipFutureValue,
  monthlySavingsRequired,
  isoWeekKey,
  transactionInBudgetPeriod,
};
