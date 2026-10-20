// backend/utils/investmentPlanEngine.js
/**
 * FinTrack Rule-Based Investment Roadmap & Educational Suggestion Engine (CommonJS)
 */

function generateBeginnerRoadmap(profile = {}) {
  const {
    hasRegularIncome = true,
    monthlyIncome = null,
    monthlyExpenses = null,
    hasHighInterestDebt = false,
    emergencyMonths = 0,
    hasHealthInsurance = false,
    hasTermInsurance = false,
    hasDependents = false,
    timeHorizon = 'long',
    riskTolerance = 'moderate',
    monthlyInvestableAmount = 0,
    primaryGoal = 'wealth_growth',
  } = profile;

  const monthlyBurn = monthlyExpenses || (monthlyIncome ? Math.round(monthlyIncome * 0.6) : 25000);
  const targetEmergencyFund = monthlyBurn * 6;
  const currentEmergencySaved = monthlyBurn * (Number(emergencyMonths) || 0);

  return [
    {
      stepNumber: 1,
      title: 'Analyze Cash Flow & Eliminate Toxic Debt',
      status: hasHighInterestDebt ? 'critical_action' : 'completed',
      category: 'Foundation',
      rationale: hasHighInterestDebt
        ? 'High-interest debt costs far more than any safe market investment can earn. Eliminating this debt delivers an instant guaranteed return.'
        : 'Your cash flow is healthy without high-interest liabilities.',
      actionItems: hasHighInterestDebt
        ? ['Adopt the Avalanche debt method.', 'Pause speculative market investing until debt is zero.']
        : ['Maintain a disciplined monthly budget.', 'Aim to save 20-30% of net income.'],
      estimatedTarget: hasHighInterestDebt ? 'Zero high-interest debt' : 'Healthy positive cash flow'
    },
    {
      stepNumber: 2,
      title: 'Build a 3 to 6-Month Liquid Emergency Buffer',
      status: emergencyMonths >= 6 ? 'completed' : emergencyMonths >= 3 ? 'in_progress' : 'critical_action',
      category: 'Liquidity',
      rationale: emergencyMonths < 3
        ? `You currently have ${emergencyMonths || 0} months saved. A liquid cushion is vital before investing.`
        : 'Emergency reserves cushion against unexpected disruptions.',
      actionItems: [
        `Target total reserve: ₹${targetEmergencyFund.toLocaleString('en-IN')}`,
        'Keep 50% in sweep-in bank savings, 50% in instant-redemption Liquid Fund.'
      ],
      estimatedTarget: `₹${targetEmergencyFund.toLocaleString('en-IN')} in liquid savings`
    },
    {
      stepNumber: 3,
      title: 'Fortify Essential Health and Life Protection',
      status: (!hasHealthInsurance || (hasDependents && !hasTermInsurance)) ? 'critical_action' : 'completed',
      category: 'Risk Protection',
      rationale: !hasHealthInsurance
        ? 'Medical emergencies can wipe out years of savings. Health insurance is a non-negotiable shield.'
        : (hasDependents && !hasTermInsurance)
        ? 'Dependents rely on your income; pure term life insurance replaces it.'
        : 'Core insurance protection is established.',
      actionItems: [
        !hasHealthInsurance ? 'Obtain a family floater mediclaim policy.' : 'Review health insurance waiting periods.',
        (hasDependents && !hasTermInsurance) ? 'Secure pure term life insurance for 15-20x annual income.' : 'Keep nominations updated.'
      ],
      estimatedTarget: 'Health floater & Pure Term'
    },
    {
      stepNumber: 4,
      title: 'Map Goals by Horizon (Short, Medium, and Long Term)',
      status: 'recommended',
      category: 'Planning',
      rationale: 'Short-term money belongs in fixed income; only long-term money should face equity volatility.',
      actionItems: ['Map short, medium, and long-term targets to appropriate asset classes.'],
      estimatedTarget: 'Quantified goals'
    },
    {
      stepNumber: 5,
      title: 'Design an Asset Allocation Fitting Your Risk Profile',
      status: 'recommended',
      category: 'Asset Allocation',
      rationale: `Based on your stated "${riskTolerance}" risk tolerance and "${timeHorizon}" horizon.`,
      actionItems: [
        riskTolerance === 'conservative'
          ? 'Recommended: 25% Equity, 65% Debt/FDs, 10% Gold'
          : riskTolerance === 'aggressive'
          ? 'Recommended: 75% Equity, 15% Debt, 10% Gold'
          : 'Recommended: 55% Equity, 35% Debt, 10% Gold'
      ],
      estimatedTarget: `${riskTolerance === 'conservative' ? '25/65/10' : riskTolerance === 'aggressive' ? '75/15/10' : '55/35/10'} Allocation`
    },
    {
      stepNumber: 6,
      title: 'Compare Genuine Products, Fees, and Tax Implications',
      status: 'recommended',
      category: 'Due Diligence',
      rationale: 'Always choose Direct plans to eliminate intermediary commission drag.',
      actionItems: ['Compare Direct vs Regular plans, expense ratios, and capital gains tax rules.'],
      estimatedTarget: 'Low-cost direct investing'
    },
    {
      stepNumber: 7,
      title: 'Open Accounts on Direct Official & SEBI/RBI Platforms',
      status: 'action_required',
      category: 'Execution',
      rationale: 'Transact directly through authorized official platforms.',
      actionItems: ['MFCentral / AMCs, RBI Retail Direct, eNPS, and SEBI registered brokers.'],
      estimatedTarget: 'Direct verified accounts'
    },
    {
      stepNumber: 8,
      title: 'Track Verified Holdings Separately in FinTrack Portfolio',
      status: 'ongoing',
      category: 'Monitoring',
      rationale: 'Keep research separate from executed investments in FinTrack.',
      actionItems: ['Add bookmarked products to Watchlist and record actual holdings in Portfolio.'],
      estimatedTarget: 'Unified net-worth tracking'
    }
  ];
}

function generateSmartSuggestions(profile = {}) {
  const {
    hasHighInterestDebt = false,
    emergencyMonths = 0,
    hasHealthInsurance = false,
    hasTermInsurance = false,
    hasDependents = false,
    timeHorizon = 'long',
    riskTolerance = 'moderate',
    primaryGoal = 'wealth_growth',
  } = profile;

  const suggestions = [];

  if (emergencyMonths < 6) {
    suggestions.push({
      categoryId: 'emergency-savings',
      title: 'Instant-Redemption Liquid Mutual Funds & Sweep FDs',
      matchScore: emergencyMonths < 3 ? 98 : 88,
      priority: 'Urgent Priority',
      badge: 'Capital Preservation',
      whyAppears: `You currently have ${emergencyMonths || 0} months of living reserves saved.`,
      keyBenefits: ['Instant liquidity up to ₹50,000 in 5 minutes.', 'High safety.'],
      importantRisks: ['Taxed at income slab rate.'],
      feesAndLimitations: 'Expense ratio 0.15% - 0.25%.',
      whenUnsuitable: 'Unsuitable for money you do not need for 5+ years.',
      officialPortal: 'https://www.amfiindia.com/',
      providerLabel: 'AMFI India / Leading AMCs'
    });
  }

  if (!hasHealthInsurance) {
    suggestions.push({
      categoryId: 'health-insurance',
      title: 'Comprehensive Health Insurance Floater (₹10L - ₹25L)',
      matchScore: 96,
      priority: 'Non-Negotiable Shield',
      badge: 'Financial Defense',
      whyAppears: 'Medical emergencies can erase investments.',
      keyBenefits: ['Cashless in-patient hospitalization.', 'Section 80D tax deduction.'],
      importantRisks: ['Waiting periods for pre-existing diseases.'],
      feesAndLimitations: 'Annual renewable premium.',
      whenUnsuitable: 'Unsuitable as an investment or savings tool.',
      officialPortal: 'https://irdai.gov.in/',
      providerLabel: 'IRDAI Approved Health Insurers'
    });
  }

  if (hasDependents && !hasTermInsurance) {
    suggestions.push({
      categoryId: 'lic-life-insurance',
      title: 'Pure Term Life Insurance (15x - 20x Annual Income)',
      matchScore: 94,
      priority: 'Family Protection',
      badge: 'Income Replacement',
      whyAppears: 'Replaces income for financial dependents.',
      keyBenefits: ['Massive coverage at affordable rates.', 'Section 10(10D) tax-free payout.'],
      importantRisks: ['Zero maturity return if you survive (pure cover).'],
      feesAndLimitations: 'Pure mortality charges.',
      whenUnsuitable: 'Unsuitable if you have zero dependents.',
      officialPortal: 'https://www.licindia.in/en/web/guest/products',
      providerLabel: 'LIC of India & IRDAI Insurers'
    });
  }

  if (!hasHighInterestDebt && timeHorizon !== 'short' && riskTolerance !== 'conservative') {
    suggestions.push({
      categoryId: 'mutual-funds',
      title: 'Low-Cost Nifty 50 & Large-Cap Index Funds (Direct - Growth)',
      matchScore: primaryGoal === 'wealth_growth' ? 95 : 86,
      priority: 'Wealth Compounding',
      badge: 'Long-Term Growth',
      whyAppears: `Investment horizon of "${timeHorizon}" and "${riskTolerance}" tolerance.`,
      keyBenefits: ['Top 50 Indian enterprises.', 'Ultra-low expense ratio.', 'Rupee cost averaging.'],
      importantRisks: ['Market drawdowns in bear phases.'],
      feesAndLimitations: '12.5% LTCG on gains above ₹1.25 Lakh.',
      whenUnsuitable: 'Unsuitable for money needed within 3 years.',
      officialPortal: 'https://www.amfiindia.com/',
      providerLabel: 'AMFI India / SEBI AMCs'
    });
  }

  if (!hasHighInterestDebt && timeHorizon === 'long') {
    suggestions.push({
      categoryId: 'gold-silver',
      title: 'Sovereign Gold Bonds (SGB) & Gold ETFs',
      matchScore: 84,
      priority: 'Portfolio Hedge',
      badge: 'Currency Hedge',
      whyAppears: '5% to 10% gold allocation stabilizes portfolio.',
      keyBenefits: ['2.5% interest on SGB.', 'Tax-free maturity on SGB.'],
      importantRisks: ['Gold price fluctuates with global bullion.'],
      feesAndLimitations: 'Zero SGB management fee; ETF fee ~0.10%-0.45%.',
      whenUnsuitable: 'Unsuitable as a 100% allocation.',
      officialPortal: 'https://rbiretaildirect.org.in/',
      providerLabel: 'RBI Retail Direct & NSE India'
    });
  }

  if (primaryGoal === 'tax_saving' || primaryGoal === 'retirement' || timeHorizon === 'long') {
    suggestions.push({
      categoryId: 'retirement-pension',
      title: 'National Pension System (NPS Tier 1)',
      matchScore: 89,
      priority: 'Retirement Tax Shield',
      badge: 'Super Low Cost',
      whyAppears: 'Exclusive ₹50,000 tax deduction under 80CCD(1B).',
      keyBenefits: ['Lowest expense ratio globally (0.03%-0.09%).', 'Extra tax deduction.'],
      importantRisks: ['Locked until age 60.', 'Mandatory 40% annuity.'],
      feesAndLimitations: 'Protean CRA maintenance fee.',
      whenUnsuitable: 'Unsuitable if liquidity is needed before 60.',
      officialPortal: 'https://enps.nsdl.com/',
      providerLabel: 'PFRDA / eNPS Protean'
    });
  }

  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = {
  generateBeginnerRoadmap,
  generateSmartSuggestions
};
