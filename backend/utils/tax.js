/**
 * Backend Tax Utility Mirror
 */

const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
];

const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

function calculateSlabTax(taxableIncome, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = Math.min(taxableIncome - slab.min, slab.max - slab.min);
      tax += taxableInSlab * slab.rate;
    }
  }
  return Math.round(tax);
}

function calculateNewRegime(grossIncome, isSalaried = true) {
  const standardDeduction = isSalaried ? 75000 : 0;
  const taxableIncome = Math.max(0, grossIncome - standardDeduction);
  const rawTax = calculateSlabTax(taxableIncome, NEW_REGIME_SLABS);

  let rebate87A = 0;
  if (taxableIncome <= 700000) {
    rebate87A = rawTax;
  }

  const taxAfterRebate = Math.max(0, rawTax - rebate87A);
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTax = taxAfterRebate + cess;

  return {
    regime: 'new',
    grossIncome,
    taxableIncome,
    standardDeduction,
    totalTax,
    monthlyTax: Math.round(totalTax / 12),
    takeHomeAnnual: Math.max(0, grossIncome - totalTax),
  };
}

function calculateOldRegime(grossIncome, deductions = {}, isSalaried = true) {
  const standardDeduction = isSalaried ? 50000 : 0;
  const sec80C = Math.min(150000, Number(deductions.sec80C || 0));
  const sec80D = Math.min(75000, Number(deductions.sec80D || 0));
  const sec80CCD = Math.min(50000, Number(deductions.sec80CCD || 0));
  const homeLoanSec24 = Math.min(200000, Number(deductions.homeLoanSec24 || 0));
  const hraExemption = Number(deductions.hraExemption || 0);

  const totalDeductions = standardDeduction + sec80C + sec80D + sec80CCD + homeLoanSec24 + hraExemption;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  const rawTax = calculateSlabTax(taxableIncome, OLD_REGIME_SLABS);

  let rebate87A = 0;
  if (taxableIncome <= 500000) {
    rebate87A = Math.min(rawTax, 12500);
  }

  const taxAfterRebate = Math.max(0, rawTax - rebate87A);
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTax = taxAfterRebate + cess;

  return {
    regime: 'old',
    grossIncome,
    taxableIncome,
    totalDeductions,
    totalTax,
    monthlyTax: Math.round(totalTax / 12),
    takeHomeAnnual: Math.max(0, grossIncome - totalTax),
  };
}

function compareTaxRegimes(grossIncome, deductions = {}, isSalaried = true) {
  const newRegime = calculateNewRegime(grossIncome, isSalaried);
  const oldRegime = calculateOldRegime(grossIncome, deductions, isSalaried);
  const diff = oldRegime.totalTax - newRegime.totalTax;
  return {
    grossIncome,
    newRegime,
    oldRegime,
    recommendedRegime: diff <= 0 ? 'old' : 'new',
    taxSavings: Math.abs(diff),
  };
}

function analyzeTaxLossHarvesting(investments = []) {
  let unrealizedLosses = 0;
  const harvestingOpportunities = [];

  for (const inv of investments) {
    const invested = Number(inv.invested_amount || inv.cost_basis || inv.amount || 0);
    const current = Number(inv.current_value || inv.market_value || invested);
    const diff = current - invested;

    if (diff < -500) {
      const loss = Math.abs(diff);
      unrealizedLosses += loss;
      harvestingOpportunities.push({
        name: inv.name || inv.symbol,
        unrealizedLoss: loss,
        potentialTaxOffset: Math.round(loss * 0.20),
      });
    }
  }

  return {
    unrealizedLosses,
    harvestingOpportunities,
    totalHarvestableTaxSaving: Math.round(unrealizedLosses * 0.20),
  };
}

module.exports = {
  calculateNewRegime,
  calculateOldRegime,
  compareTaxRegimes,
  analyzeTaxLossHarvesting,
};
