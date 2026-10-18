const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calcEMI,
  amortizationPaid,
  simpleInterest,
  compoundAmount,
  sipFutureValue,
  monthlySavingsRequired,
  transactionInBudgetPeriod,
} = require('../utils/finance');
const { toMoney } = require('../utils/money');
const { csvEscape, toCsv } = require('../utils/csv');

test('toMoney: rounds strictly to 2 decimal places and handles invalid inputs', () => {
  assert.equal(toMoney(123.456), 123.46);
  assert.equal(toMoney(123.454), 123.45);
  assert.equal(toMoney(0.1 + 0.2), 0.3); // Floating point precision check
  assert.equal(toMoney('500.50'), 500.5);
  assert.equal(toMoney(null), 0);
  assert.equal(toMoney(undefined), 0);
  assert.equal(toMoney('invalid'), 0);
  assert.equal(toMoney(NaN), 0);
});

test('calcEMI: standard reducing balance loan calculation', () => {
  // Principal: 100,000, 12% annual, 12 months (1 yr)
  // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1) where r = 0.01
  // Expected EMI approx 8884.88
  const emi = calcEMI(100000, 12, 12);
  assert.equal(emi, 8884.88);
});

test('calcEMI: handles zero interest rate gracefully', () => {
  // Principal: 120,000, 0% interest, 12 months -> exactly 10,000 per month
  const emi = calcEMI(120000, 0, 12);
  assert.equal(emi, 10000);
});

test('calcEMI: handles invalid or edge-case tenure and principal', () => {
  assert.equal(calcEMI(0, 10, 12), 0);
  assert.equal(calcEMI(-5000, 10, 12), 0);
  assert.equal(calcEMI(10000, 10, 0), 0);
  assert.equal(calcEMI(10000, 10, 700), 0); // > 600 months limit
});

test('amortizationPaid: calculates interest, principal and remaining balances correctly', () => {
  const p = 100000;
  const rate = 12;
  const tenure = 12;
  const res = amortizationPaid(p, rate, tenure, 6); // 6 months paid
  assert.equal(res.emi, 8884.88);
  assert.equal(res.remainingTenure, 6);
  assert.ok(res.remaining < p);
  assert.ok(res.principalPaid > 0);
  assert.ok(res.interestPaid > 0);
  assert.equal(toMoney(res.principalPaid + res.remaining), p);
});

test('simpleInterest: computes accurately without floating bleed', () => {
  // P = 50,000, R = 6.5%, T = 3 years -> 50000 * 6.5 * 3 / 100 = 9750
  assert.equal(simpleInterest(50000, 6.5, 3), 9750);
});

test('compoundAmount: computes compounding across frequencies', () => {
  // P = 10,000, R = 10%, T = 2 years, Annual (n=1) -> 10000 * 1.10^2 = 12100
  assert.equal(compoundAmount(10000, 10, 2, 1), 12100);

  // Quarterly (n=4): 10000 * (1 + 0.10/4)^(4*2) = 10000 * (1.025)^8 = 12184.03
  assert.equal(compoundAmount(10000, 10, 2, 4), 12184.03);
});

test('sipFutureValue: monthly SIP projections', () => {
  // Monthly: 5,000, 12% annual (1% monthly), 12 months
  // FV = 5000 * [ (1.01^12 - 1) / 0.01 ] * 1.01 = 64,046.60
  const fv = sipFutureValue(5000, 12, 12);
  assert.equal(fv, 64046.64);

  // Zero return SIP: 5000 * 12 = 60,000
  assert.equal(sipFutureValue(5000, 0, 12), 60000);
});

test('monthlySavingsRequired: calculates remaining monthly requirement', () => {
  // Target: 100,000, Saved: 40,000, 6 months left -> 60,000 / 6 = 10,000
  assert.equal(monthlySavingsRequired(100000, 40000, 6), 10000);
  // Already saved >= target -> 0 needed
  assert.equal(monthlySavingsRequired(100000, 120000, 6), 0);
});

test('transactionInBudgetPeriod: correctly matches periods', () => {
  const refDate = new Date('2026-10-18T12:00:00Z');

  // Monthly budget
  const monthlyBudget = { period: 'monthly' };
  assert.equal(transactionInBudgetPeriod('2026-10-05', monthlyBudget, refDate), true);
  assert.equal(transactionInBudgetPeriod('2026-09-28', monthlyBudget, refDate), false);

  // Yearly budget
  const yearlyBudget = { period: 'yearly' };
  assert.equal(transactionInBudgetPeriod('2026-03-15', yearlyBudget, refDate), true);
  assert.equal(transactionInBudgetPeriod('2025-10-18', yearlyBudget, refDate), false);

  // Custom range budget
  const customBudget = {
    period: 'custom',
    start_date: '2026-10-01',
    end_date: '2026-10-15',
  };
  assert.equal(transactionInBudgetPeriod('2026-10-10', customBudget, refDate), true);
  assert.equal(transactionInBudgetPeriod('2026-10-20', customBudget, refDate), false);
});

test('csvEscape: neutralizes spreadsheet formula injection', () => {
  // Cells starting with =, +, -, @ must be prepended with '
  assert.equal(csvEscape('=cmd|/C calc!A0'), "'=cmd|/C calc!A0");
  assert.equal(csvEscape('+12345'), "'+12345");
  assert.equal(csvEscape('-50.00'), "'-50.00");
  assert.equal(csvEscape('@SUM(A1:A10)'), "'@SUM(A1:A10)");

  // Quotes and commas are properly escaped
  assert.equal(csvEscape('Normal Text'), 'Normal Text');
  assert.equal(csvEscape('Hello, World'), '"Hello, World"');
  assert.equal(csvEscape('He said "Hello"'), '"He said ""Hello"""');
});

test('toCsv: formats rows with headers and BOM', () => {
  const headers = ['id', 'title', 'amount'];
  const rows = [
    { id: '1', title: 'Salary', amount: 50000 },
    { id: '2', title: 'Groceries, Fruit', amount: 1500 },
  ];
  const csv = toCsv(rows, headers);
  assert.ok(csv.startsWith('\uFEFF')); // UTF-8 BOM
  assert.ok(csv.includes('id,title,amount'));
  assert.ok(csv.includes('"Groceries, Fruit"'));
});
