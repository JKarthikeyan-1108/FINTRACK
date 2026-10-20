/**
 * FinTrack AI Tax Optimization & Regime Comparison Engine
 * Computes Old vs New Income Tax Regimes (FY 2024-25 / FY 2025-26 under Finance Act 2024)
 * with Section 80C, 80D, 80CCD NPS, HRA, Section 24 Home Loan, and Tax-Loss Harvesting.
 */

// Slabs for New Tax Regime (FY 2024-25+ / Budget 2024)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
];

// Slabs for Old Tax Regime (Individuals < 60 years)
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

/**
 * Calculate tax by applying progressive slab brackets
 */
function calculateSlabTax(taxableIncome, slabs) {
  let tax = 0;
  const breakdown = [];

  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = Math.min(taxableIncome - slab.min, slab.max - slab.min);
      const slabTax = taxableInSlab * slab.rate;
      tax += slabTax;
      breakdown.push({
        range: slab.max === Infinity ? `Above ₹${(slab.min / 100000).toFixed(1)}L` : `₹${(slab.min / 100000).toFixed(1)}L – ₹${(slab.max / 100000).toFixed(1)}L`,
        rate: slab.rate * 100,
        amountInSlab: Math.round(taxableInSlab),
        taxPaid: Math.round(slabTax),
      });
    }
  }

  return { tax: Math.round(tax), breakdown };
}

/**
 * Compute New Regime Tax
 */
export function calculateNewRegime(grossIncome, isSalaried = true) {
  const standardDeduction = isSalaried ? 75000 : 0; // Raised to 75k in Budget 2024
  const taxableIncome = Math.max(0, grossIncome - standardDeduction);

  const { tax: rawTax, breakdown } = calculateSlabTax(taxableIncome, NEW_REGIME_SLABS);

  // Section 87A Rebate: Under New Regime, if taxable income <= 7,00,000, tax is 0 (effective gross 7.75L tax-free)
  let rebate87A = 0;
  if (taxableIncome <= 700000) {
    rebate87A = rawTax;
  }

  const taxAfterRebate = Math.max(0, rawTax - rebate87A);
  const cess = Math.round(taxAfterRebate * 0.04); // 4% Health & Education cess
  const totalTax = taxAfterRebate + cess;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    regime: 'new',
    grossIncome,
    standardDeduction,
    totalDeductions: standardDeduction,
    taxableIncome,
    rawTax,
    rebate87A,
    cess,
    totalTax,
    monthlyTax: Math.round(totalTax / 12),
    takeHomeAnnual: Math.max(0, grossIncome - totalTax),
    takeHomeMonthly: Math.round(Math.max(0, grossIncome - totalTax) / 12),
    effectiveRate: Math.round(effectiveRate * 10) / 10,
    breakdown,
  };
}

/**
 * Compute Old Regime Tax
 */
export function calculateOldRegime(grossIncome, deductions = {}, isSalaried = true) {
  const standardDeduction = isSalaried ? 50000 : 0;
  const sec80C = Math.min(150000, Number(deductions.sec80C || 0)); // Cap 1.5L
  const sec80D = Math.min(75000, Number(deductions.sec80D || 0)); // Cap 25k self + 50k parents = 75k
  const sec80CCD = Math.min(50000, Number(deductions.sec80CCD || 0)); // NPS Tier 1 cap 50k
  const homeLoanSec24 = Math.min(200000, Number(deductions.homeLoanSec24 || 0)); // Cap 2L
  const hraExemption = Number(deductions.hraExemption || 0);
  const otherDeductions = Number(deductions.otherDeductions || 0);

  const totalDeductions = standardDeduction + sec80C + sec80D + sec80CCD + homeLoanSec24 + hraExemption + otherDeductions;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  const { tax: rawTax, breakdown } = calculateSlabTax(taxableIncome, OLD_REGIME_SLABS);

  // Section 87A Rebate: Under Old Regime, if taxable income <= 5,00,000, rebate up to 12,500
  let rebate87A = 0;
  if (taxableIncome <= 500000) {
    rebate87A = Math.min(rawTax, 12500);
  }

  const taxAfterRebate = Math.max(0, rawTax - rebate87A);
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTax = taxAfterRebate + cess;
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    regime: 'old',
    grossIncome,
    standardDeduction,
    itemizedDeductions: {
      sec80C,
      sec80D,
      sec80CCD,
      homeLoanSec24,
      hraExemption,
      otherDeductions,
    },
    totalDeductions,
    taxableIncome,
    rawTax,
    rebate87A,
    cess,
    totalTax,
    monthlyTax: Math.round(totalTax / 12),
    takeHomeAnnual: Math.max(0, grossIncome - totalTax),
    takeHomeMonthly: Math.round(Math.max(0, grossIncome - totalTax) / 12),
    effectiveRate: Math.round(effectiveRate * 10) / 10,
    breakdown,
  };
}

/**
 * Compare Old vs New Regime and deliver AI Tax Optimization Strategy
 */
export function compareTaxRegimes(grossIncome, deductions = {}, isSalaried = true) {
  const newRegime = calculateNewRegime(grossIncome, isSalaried);
  const oldRegime = calculateOldRegime(grossIncome, deductions, isSalaried);

  const taxDiff = oldRegime.totalTax - newRegime.totalTax;
  const recommendedRegime = taxDiff <= 0 ? 'old' : 'new';
  const taxSavings = Math.abs(taxDiff);

  // Calculate Break-Even deductions needed for Old Regime to beat New Regime
  // Approximate threshold formula: for Old to beat New at higher incomes requires ~3.75L - 4.25L in total deductions
  let breakEvenDeduction = 375000;
  if (grossIncome <= 775000) breakEvenDeduction = Math.max(0, grossIncome - 500000);
  else if (grossIncome <= 1000000) breakEvenDeduction = 300000;
  else if (grossIncome <= 1500000) breakEvenDeduction = 375000;
  else breakEvenDeduction = 425000;

  // AI Recommendations
  const recommendations = [];

  const unused80C = 150000 - (Number(deductions.sec80C) || 0);
  if (unused80C > 5000) {
    const potTaxSaved = Math.round(unused80C * 0.312); // at 30% slab + cess
    recommendations.push({
      type: '80C_gap',
      title: 'Maximize Section 80C Allowance',
      desc: `You have ₹${unused80C.toLocaleString()} remaining in Section 80C. Investing in ELSS Tax-Saver mutual funds or PPF can shield up to ₹${potTaxSaved.toLocaleString()} under the Old Regime.`,
      potentialSaving: potTaxSaved,
    });
  }

  const unused80CCD = 50000 - (Number(deductions.sec80CCD) || 0);
  if (unused80CCD > 5000) {
    const potTaxSaved = Math.round(unused80CCD * 0.312);
    recommendations.push({
      type: 'nps_80ccd',
      title: 'NPS Section 80CCD(1B) Exclusive Deduction',
      desc: `You can claim an exclusive ₹50,000 deduction for NPS above 80C, saving up to ₹${potTaxSaved.toLocaleString()} in taxes while building retirement wealth.`,
      potentialSaving: potTaxSaved,
    });
  }

  const unused80D = 25000 - (Number(deductions.sec80D) || 0);
  if (unused80D > 5000) {
    const potTaxSaved = Math.round(unused80D * 0.208);
    recommendations.push({
      type: 'health_80d',
      title: 'Health Insurance Tax Shield (Sec 80D)',
      desc: `Health insurance premiums for self, spouse and children qualify for up to ₹25,000 deduction, saving up to ₹${potTaxSaved.toLocaleString()}.`,
      potentialSaving: potTaxSaved,
    });
  }

  if (recommendedRegime === 'new') {
    recommendations.push({
      type: 'regime_switch',
      title: 'Switch to New Tax Regime',
      desc: `The New Regime saves you ₹${taxSavings.toLocaleString()} annually with lower slab rates and an enhanced ₹75,000 standard deduction with zero paperwork.`,
      potentialSaving: taxSavings,
    });
  } else {
    recommendations.push({
      type: 'regime_stick',
      title: 'Stay on Old Tax Regime',
      desc: `Your itemized deductions total ₹${oldRegime.totalDeductions.toLocaleString()}, saving you ₹${taxSavings.toLocaleString()} annually compared to the New Regime.`,
      potentialSaving: taxSavings,
    });
  }

  return {
    grossIncome,
    newRegime,
    oldRegime,
    recommendedRegime,
    taxSavings,
    breakEvenDeduction,
    recommendations,
  };
}

/**
 * Capital Gains & Tax-Loss Harvesting Analyzer
 * Scans investment positions to find loss harvesting opportunities to offset capital gains
 */
export function analyzeTaxLossHarvesting(investments = []) {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let unrealizedGains = 0;
  let unrealizedLosses = 0;
  const harvestingOpportunities = [];

  for (const inv of investments) {
    const invested = Number(inv.invested_amount || inv.cost_basis || inv.amount || 0);
    const current = Number(inv.current_value || inv.market_value || invested);
    const diff = current - invested;

    totalInvested += invested;
    totalCurrentValue += current;

    if (diff > 0) {
      unrealizedGains += diff;
    } else if (diff < -500) {
      const loss = Math.abs(diff);
      unrealizedLosses += loss;
      // Potential tax saved by offsetting STCG (20%) or LTCG (12.5%)
      const potTaxSaved = Math.round(loss * 0.20);
      harvestingOpportunities.push({
        id: inv.id || inv.symbol || inv.name,
        name: inv.name || inv.symbol || 'Asset',
        type: inv.type || 'Equity',
        invested,
        current,
        unrealizedLoss: loss,
        lossPct: invested > 0 ? Math.round((loss / invested) * 100) : 0,
        potentialTaxOffset: potTaxSaved,
        action: 'Sell to harvest loss, repurchase identical or alternative ETF after wash period to lock tax credits.',
      });
    }
  }

  // LTCG Exemption limit under Budget 2024 is ₹1.25 Lakh
  const ltcgExemption = 125000;
  const taxableLTCG = Math.max(0, unrealizedGains - ltcgExemption);
  const potentialHarvestSavings = Math.round(unrealizedLosses * 0.20);

  return {
    totalInvested,
    totalCurrentValue,
    unrealizedGains,
    unrealizedLosses,
    ltcgExemption,
    taxableLTCG,
    harvestingOpportunities,
    totalHarvestableTaxSaving: potentialHarvestSavings,
  };
}
