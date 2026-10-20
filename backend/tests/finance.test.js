const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calcEMI,
  amortizationPaid,
  simpleInterest,
  compoundAmount,
  sipFutureValue,
  monthlySavingsRequired,
  runMonteCarloSimulation,
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

test('runMonteCarloSimulation: generates statistical distributions adhering to financial dynamics', () => {
  const sim = runMonteCarloSimulation({
    initialInvestment: 100000,
    monthlyContribution: 10000,
    years: 5,
    expectedReturn: 12,
    volatility: 15,
    inflation: 5,
    simulationsCount: 150,
  });

  // Principal invested: 100k + (10k * 60) = 700k
  assert.equal(sim.totalInvested, 700000);

  // Percentile hierarchy: bull (90th) >= median (50th) >= bear (10th)
  assert.ok(sim.bullFinal >= sim.medianFinal, 'Bull run should equal or exceed median');
  assert.ok(sim.medianFinal >= sim.bearFinal, 'Median should equal or exceed bear floor');

  // Real purchasing power should be less than nominal median due to inflation
  assert.ok(sim.realPurchasingPower < sim.medianFinal, 'Inflation must discount purchasing power');
  assert.ok(sim.inflationErosionPct > 0, 'Inflation erosion percentage must be positive');

  // Trajectory should span years 0 to 5
  assert.equal(sim.yearlyPercentiles.length, 6);
  assert.equal(sim.yearlyPercentiles[0].year, 0);
  assert.equal(sim.yearlyPercentiles[5].year, 5);
});

const {
  cleanMerchantTitle,
  detectCategory,
  stringSimilarity,
  checkDuplicate,
  parseCsvStatement,
} = require('../utils/statementParser');

const {
  calculateNewRegime,
  calculateOldRegime,
  compareTaxRegimes,
  analyzeTaxLossHarvesting,
} = require('../utils/tax');

test('cleanMerchantTitle: cleans banking codes and normalizes vendor names', () => {
  assert.equal(cleanMerchantTitle('UPI/CR/981249/SWIGGY/BANGALORE'), 'Swiggy');
  assert.equal(cleanMerchantTitle('POS 491024*STARBUCKS IND'), 'Starbucks');
  assert.equal(cleanMerchantTitle('NEFT-AXIS-AMAZON PAY-RETAIL'), 'Amazon');
  assert.equal(cleanMerchantTitle('BLINKIT GROCERIES IND'), 'Blinkit');
});

test('detectCategory: intelligently infers expense categories from transaction descriptions', () => {
  assert.equal(detectCategory('Swiggy Dineout payment'), 'Food & Dining');
  assert.equal(detectCategory('Zepto quick delivery'), 'Groceries');
  assert.equal(detectCategory('Netflix recurring sub'), 'Entertainment');
  assert.equal(detectCategory('Uber trip Mumbai airport'), 'Transportation');
  assert.equal(detectCategory('Airtel broadband bill'), 'Utilities');
  assert.equal(detectCategory('Apollo Pharmacy medicines'), 'Healthcare');
});

test('stringSimilarity: correctly scores token & bigram overlaps', () => {
  assert.equal(stringSimilarity('Starbucks Coffee', 'Starbucks Coffee'), 1.0);
  assert.ok(stringSimilarity('Swiggy Order', 'Swiggy') >= 0.7);
  assert.equal(stringSimilarity('', 'Something'), 0);
});

test('checkDuplicate: flags transactions with matching amount and close dates', () => {
  const existingTxns = [
    { id: 'tx_1', title: 'Swiggy', amount: 450, type: 'expense', date: '2026-10-18' },
    { id: 'tx_2', title: 'Salary', amount: 80000, type: 'income', date: '2026-10-01' },
  ];

  // Exact duplicate candidate within 1 day
  const dupCandidate = { title: 'UPI SWIGGY', amount: 450, type: 'expense', date: '2026-10-19' };
  const res1 = checkDuplicate(dupCandidate, existingTxns);
  assert.equal(res1.isDuplicate, true);

  // Different amount candidate
  const nonDupCandidate = { title: 'Swiggy', amount: 950, type: 'expense', date: '2026-10-18' };
  const res2 = checkDuplicate(nonDupCandidate, existingTxns);
  assert.equal(res2.isDuplicate, false);
});

test('parseCsvStatement: extracts tabular records with auto column identification', () => {
  const sampleCsv = `
Bank Statement of Account
Account Number: 1234567890
Date,Narration,Withdrawal,Deposit,Balance
2026-10-15,"UPI/CR/98124/SWIGGY",450.00,,45000.00
2026-10-16,"SALARY INFOSYS LTD",,85000.00,130000.00
2026-10-17,"NETFLIX.COM",649.00,,129351.00
  `.trim();

  const txns = parseCsvStatement(sampleCsv);
  assert.equal(txns.length, 3);

  // Row 1: Swiggy expense
  assert.equal(txns[0].title, 'Swiggy');
  assert.equal(txns[0].amount, 450);
  assert.equal(txns[0].type, 'expense');
  assert.equal(txns[0].category, 'Food & Dining');

  // Row 2: Salary income
  assert.equal(txns[1].title, 'Salary Credit');
  assert.equal(txns[1].amount, 85000);
  assert.equal(txns[1].type, 'income');
  assert.equal(txns[1].category, 'Salary / Income');

  // Row 3: Netflix expense
  assert.equal(txns[2].title, 'Netflix');
  assert.equal(txns[2].amount, 649);
  assert.equal(txns[2].category, 'Entertainment');
});

test('calculateNewRegime: applies FY 2024-25 slabs and standard deduction', () => {
  // Salaried person earning 7,50,000 gross
  // Standard deduction = 75,000 -> Taxable = 6,75,000 (<= 7,00,000 -> 100% Section 87A rebate)
  const taxFree = calculateNewRegime(750000, true);
  assert.equal(taxFree.taxableIncome, 675000);
  assert.equal(taxFree.totalTax, 0);

  // Salaried person earning 15,00,000 gross
  // Standard deduction 75,000 -> Taxable 14,25,000
  // Slabs: 0-3L (0), 3-7L (20k), 7-10L (30k), 10-12L (30k), 12-14.25L (20% of 2.25L = 45k) -> 1,25,000 + 4% cess (5k) = 1,30,000
  const higherEarner = calculateNewRegime(1500000, true);
  assert.equal(higherEarner.taxableIncome, 1425000);
  assert.equal(higherEarner.totalTax, 130000);
});

test('compareTaxRegimes: gives correct regime winner and tax savings', () => {
  // For ₹12,00,000 gross with ₹2,50,000 in deductions (80C + 80D + standard)
  const comparison = compareTaxRegimes(1200000, { sec80C: 150000, sec80D: 25000, homeLoanSec24: 0 });
  assert.ok(['new', 'old'].includes(comparison.recommendedRegime));
  assert.ok(comparison.taxSavings >= 0);
});

test('analyzeTaxLossHarvesting: finds loss harvesting opportunities', () => {
  const investments = [
    { name: 'Nifty 50 Index', invested_amount: 100000, current_value: 125000 },
    { name: 'Tech ETF', invested_amount: 50000, current_value: 38000 }, // 12,000 unrealized loss
  ];

  const analysis = analyzeTaxLossHarvesting(investments);
  assert.equal(analysis.unrealizedLosses, 12000);
  assert.equal(analysis.harvestingOpportunities.length, 1);
  assert.equal(analysis.harvestingOpportunities[0].unrealizedLoss, 12000);
  assert.equal(analysis.totalHarvestableTaxSaving, 2400); // 20% of 12,000
});

const {
  calculateSplits,
  simplifyDebts,
} = require('../utils/debtSimplification');

test('calculateSplits: distributes equal amounts with penny-rounding reconciliation', () => {
  const members = [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }];
  const splits = calculateSplits(100, 'equal', members);
  assert.equal(splits.length, 3);
  const sum = Math.round(splits.reduce((acc, s) => acc + s.amount, 0) * 100) / 100;
  assert.equal(sum, 100);
  assert.equal(splits[0].amount, 33.34);
  assert.equal(splits[1].amount, 33.33);
  assert.equal(splits[2].amount, 33.33);
});

test('calculateSplits: percentage splits computes exact proportions', () => {
  const members = [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }];
  const splits = calculateSplits(1000, 'percentage', members, { m1: 50, m2: 30, m3: 20 });
  assert.equal(splits[0].amount, 500);
  assert.equal(splits[1].amount, 300);
  assert.equal(splits[2].amount, 200);
});

test('simplifyDebts: resolves multi-person shared expenses to minimum cash flows', () => {
  const members = [
    { id: 'm1', name: 'Alice' },
    { id: 'm2', name: 'Bob' },
    { id: 'm3', name: 'Charlie' },
  ];

  // Alice pays 300 for dinner split equally (100 each)
  // Bob pays 150 for cab split equally (50 each)
  const expenses = [
    { id: 'e1', amount: 300, paidBy: 'm1', splitType: 'equal' },
    { id: 'e2', amount: 150, paidBy: 'm2', splitType: 'equal' },
  ];

  const result = simplifyDebts(members, expenses, [], 'm1');

  // Balances:
  // Alice: +300 - 100 - 50 = +150
  // Bob: +150 - 100 - 50 = 0
  // Charlie: 0 - 100 - 50 = -150
  assert.equal(result.balances.m1, 150);
  assert.equal(result.balances.m2, 0);
  assert.equal(result.balances.m3, -150);
  assert.equal(result.myNetBalance, 150);
  assert.equal(result.totalGroupSpend, 450);

  // Simplified Debts: exactly 1 transaction: Charlie owes Alice 150
  assert.equal(result.simplifiedDebts.length, 1);
  assert.equal(result.simplifiedDebts[0].from, 'm3');
  assert.equal(result.simplifiedDebts[0].to, 'm1');
  assert.equal(result.simplifiedDebts[0].amount, 150);
});

test('simplifyDebts: eliminates circular debts completely', () => {
  const members = [
    { id: 'm1', name: 'A' },
    { id: 'm2', name: 'B' },
    { id: 'm3', name: 'C' },
  ];

  // A pays 100 for B
  // B pays 100 for C
  // C pays 100 for A
  const expenses = [
    { id: 'e1', amount: 100, paidBy: 'm1', splits: [{ memberId: 'm2', amount: 100 }] },
    { id: 'e2', amount: 100, paidBy: 'm2', splits: [{ memberId: 'm3', amount: 100 }] },
    { id: 'e3', amount: 100, paidBy: 'm3', splits: [{ memberId: 'm1', amount: 100 }] },
  ];

  const result = simplifyDebts(members, expenses, []);
  assert.equal(result.balances.m1, 0);
  assert.equal(result.balances.m2, 0);
  assert.equal(result.balances.m3, 0);
  assert.equal(result.simplifiedDebts.length, 0); // Completely settled out
});

test('simplifyDebts: handles settle-up repayments correctly', () => {
  const members = [
    { id: 'm1', name: 'A' },
    { id: 'm2', name: 'B' },
  ];

  // A pays 200 for both (B owes 100)
  const expenses = [{ id: 'e1', amount: 200, paidBy: 'm1', splitType: 'equal' }];
  // B settles up 100 to A
  const settlements = [{ id: 's1', fromMemberId: 'm2', toMemberId: 'm1', amount: 100 }];

  const result = simplifyDebts(members, expenses, settlements);
  assert.equal(result.balances.m1, 0);
  assert.equal(result.balances.m2, 0);
  assert.equal(result.simplifiedDebts.length, 0);
});


