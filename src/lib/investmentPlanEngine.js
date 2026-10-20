// src/lib/investmentPlanEngine.js
/**
 * FinTrack Rule-Based Investment Roadmap & Educational Suggestion Engine
 * Tailored for Indian retail users progressing from Zero to Financial Independence.
 * 
 * DISCLAIMER:
 * This engine generates educational suggestions based on transparent financial planning heuristics.
 * It does NOT constitute regulated financial advice under SEBI (Investment Advisers) Regulations, 2013.
 * FinTrack does not execute transactions, hold client money, or guarantee returns.
 */

/**
 * Generates an 8-step customized educational roadmap based on user questionnaire inputs.
 * 
 * @param {Object} profile - User questionnaire inputs
 * @param {boolean} profile.hasRegularIncome
 * @param {number|null} profile.monthlyIncome
 * @param {number|null} profile.monthlyExpenses
 * @param {boolean} profile.hasHighInterestDebt - Credit cards / personal loans (>13% p.a.)
 * @param {number} profile.emergencyMonths - Months of emergency runway currently saved (0 to 6+)
 * @param {boolean} profile.hasHealthInsurance - Has adequate mediclaim
 * @param {boolean} profile.hasTermInsurance - Has pure life protection (if dependents exist)
 * @param {boolean} profile.hasDependents - Family members relying on user's income
 * @param {string} profile.timeHorizon - 'short' (<1 yr), 'medium' (1-4 yrs), 'long' (5+ yrs)
 * @param {string} profile.riskTolerance - 'conservative', 'moderate', 'aggressive'
 * @param {number} profile.monthlyInvestableAmount
 * @param {string} profile.primaryGoal - e.g., 'emergency_fund', 'tax_saving', 'wealth_growth', 'retirement', 'child_future'
 * @returns {Array<Object>} 8-step structured roadmap with status, priority, and rationale
 */
export function generateBeginnerRoadmap(profile = {}) {
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

  const steps = [
    // Step 1: Cash Flow & Debt Elimination
    {
      stepNumber: 1,
      title: 'Analyze Cash Flow & Eliminate Toxic Debt',
      status: hasHighInterestDebt ? 'critical_action' : 'completed',
      category: 'Foundation',
      rationale: hasHighInterestDebt
        ? 'High-interest debt (credit cards at 36-42% APR or personal loans at 14%+) costs far more than any safe market investment can earn. Eliminating this debt delivers an instant, guaranteed, risk-free 36%+ return on your capital.'
        : 'Your cash flow is healthy without high-interest liabilities. Continuing to maintain a disciplined expense-to-income ratio ensures steady investable surplus.',
      actionItems: hasHighInterestDebt
        ? [
            'Adopt the Avalanche debt method (pay minimums on all debt, channel every surplus rupee to the highest APR loan).',
            'Pause speculative market investing until all unsecured personal loans and credit card rollovers are at zero.',
            'Track all discretionary outflows in the FinTrack Transactions ledger.'
          ]
        : [
            'Maintain an automated monthly budget envelope in FinTrack.',
            'Aim to save at least 20-30% of net monthly income.'
          ],
      estimatedTarget: hasHighInterestDebt ? 'Zero high-interest debt' : 'Healthy positive monthly cash flow'
    },

    // Step 2: Emergency Reserve
    {
      stepNumber: 2,
      title: 'Build a 3 to 6-Month Liquid Emergency Buffer',
      status: emergencyMonths >= 6 ? 'completed' : emergencyMonths >= 3 ? 'in_progress' : 'critical_action',
      category: 'Liquidity',
      rationale: emergencyMonths < 3
        ? `You currently have ${emergencyMonths || 0} months of living expenses saved. Without a liquid emergency cushion, any sudden medical emergency or job disruption will force you to liquidate investments at a loss or borrow at extortionate rates.`
        : emergencyMonths < 6
        ? 'You have a 3-month buffer, which is a great start. If you are self-employed or have single-income dependents, expanding this to 6 months provides ultimate peace of mind.'
        : 'Your emergency fund is fully fortified with 6+ months of living expenses. You can comfortably explore long-term wealth creation.',
      actionItems: [
        `Target total reserve: ₹${targetEmergencyFund.toLocaleString('en-IN')} (Current: ~₹${currentEmergencySaved.toLocaleString('en-IN')}).`,
        'Keep 50% in an auto-sweep bank savings account for instant UPI access.',
        'Park remaining 50% in an instant-redemption Liquid Mutual Fund (redeemable within 5 minutes up to ₹50,000).'
      ],
      estimatedTarget: `₹${targetEmergencyFund.toLocaleString('en-IN')} in liquid savings`
    },

    // Step 3: Essential Insurance Shield
    {
      stepNumber: 3,
      title: 'Fortify Essential Health and Life Protection',
      status: (!hasHealthInsurance || (hasDependents && !hasTermInsurance)) ? 'critical_action' : 'completed',
      category: 'Risk Protection',
      rationale: !hasHealthInsurance
        ? 'Medical inflation in India runs at 14% annually. A single hospital stay can wipe out years of stock and mutual fund compounding. Health insurance is your non-negotiable financial shield, not an optional expense.'
        : (hasDependents && !hasTermInsurance)
        ? 'You have financial dependents who rely on your monthly income. Pure term life insurance guarantees that your family can pay off loans and survive if the unexpected occurs.'
        : 'Your core insurance protection is established. Remember to keep protection strictly separate from investments (avoid low-yield endowment/money-back policies).',
      actionItems: [
        !hasHealthInsurance ? 'Obtain a comprehensive family floater mediclaim policy (₹10L - ₹25L sum insured) with zero room-rent capping.' : 'Review health insurance waiting periods and network hospitals.',
        (hasDependents && !hasTermInsurance) ? 'Secure a pure term life insurance policy worth 15x to 20x your annual income (e.g., ₹1 Crore cover).' : 'Ensure term policy nominees and contact details are up to date.',
        'Never mix insurance with investments. Pure term gives 50x higher cover per rupee than traditional endowment policies.'
      ],
      estimatedTarget: 'Health floater (₹10L+) & Pure Term (15x income)'
    },

    // Step 4: Define Time Horizons & Quantified Goals
    {
      stepNumber: 4,
      title: 'Map Goals by Horizon (Short, Medium, and Long Term)',
      status: 'recommended',
      category: 'Planning',
      rationale: 'Money without a timeline leads to catastrophic asset-liability mismatches. Short-term money (<3 years) belongs exclusively in capital-safe fixed income; only long-term money (>5 years) should face equity market volatility.',
      actionItems: [
        'Short-term goals (<2 years: Vacation, gadget, car down-payment) → Bank FDs, Arbitrage Funds, Treasury Bills.',
        'Medium-term goals (2-5 years: Higher education, wedding) → Short duration debt funds, Conservative Hybrid funds.',
        'Long-term goals (5+ years: Retirement, financial freedom) → Broad-market equity mutual funds, NPS, SGBs.'
      ],
      estimatedTarget: 'Documented financial goals with exact target dates'
    },

    // Step 5: Understand Asset Allocation
    {
      stepNumber: 5,
      title: 'Design an Asset Allocation Fitting Your Risk Profile',
      status: 'recommended',
      category: 'Asset Allocation',
      rationale: `Based on your stated "${riskTolerance}" risk tolerance and "${timeHorizon}" horizon, your portfolio must balance inflation-beating equity with capital-preserving debt and gold.`,
      actionItems: [
        riskTolerance === 'conservative'
          ? 'Recommended Allocation: 25% Equity Index Funds, 65% Fixed Income / G-Secs / FDs, 10% Gold/Silver.'
          : riskTolerance === 'aggressive'
          ? 'Recommended Allocation: 75% Equity (Large + Mid Cap), 15% Debt / G-Secs, 10% Gold (SGB/ETF).'
          : 'Recommended Allocation: 55% Equity, 35% Debt / PPF / NPS, 10% Gold.'
      ],
      estimatedTarget: `${riskTolerance === 'conservative' ? '25/65/10' : riskTolerance === 'aggressive' ? '75/15/10' : '55/35/10'} Equity/Debt/Gold split`
    },

    // Step 6: Product Comparison & Fee Optimization
    {
      stepNumber: 6,
      title: 'Compare Genuine Products, Fees, and Tax Implications',
      status: 'recommended',
      category: 'Due Diligence',
      rationale: 'A 1% distributor commission in regular mutual funds compounds to over 30% of your total wealth lost over 25 years. Always choose Direct-Growth plans and inspect expense ratios before buying.',
      actionItems: [
        'Always pick "Direct - Growth" option for Mutual Funds to eliminate middleman commissions.',
        'Review tax rules: Equity LTCG is taxed at 12.5% above ₹1.25 Lakh; Debt funds are taxed at income slab rate; SGB maturity is 100% tax-free.',
        'Verify digital gold spreads (2.5%-3.5%) vs Gold ETF expense ratios (0.10%-0.40%).'
      ],
      estimatedTarget: 'Zero intermediary commission leakage'
    },

    // Step 7: Navigate to Authorized Official Platforms
    {
      stepNumber: 7,
      title: 'Open Accounts on Direct Official & SEBI/RBI Platforms',
      status: 'action_required',
      category: 'Execution',
      rationale: 'Never hand cash or payment credentials to unsolicited advisors. Transact directly through recognized official utilities and SEBI-registered platforms.',
      actionItems: [
        'Mutual Funds: MFCentral (official joint platform of CAMS & KFintech) or direct AMC websites.',
        'Government Bonds: RBI Retail Direct (zero-cost direct G-Sec and T-Bill bidding).',
        'Retirement: eNPS Protean / PFRDA direct portal for NPS Tier 1.',
        'Stocks & ETFs: Any SEBI-registered discount broker with transparent low fees.'
      ],
      estimatedTarget: 'Direct verified account registrations'
    },

    // Step 8: Separate Portfolio Tracking from Exploration
    {
      stepNumber: 8,
      title: 'Track Verified Holdings Separately in FinTrack Portfolio',
      status: 'ongoing',
      category: 'Monitoring',
      rationale: 'Keep your research watchlist separate from actual capital commitments. Once you execute an investment on an authorized platform, record the transaction in FinTrack Investments for automated rebalancing and net-worth auditing.',
      actionItems: [
        'Save researched items to your FinTrack Explore Watchlist.',
        'Log executed purchases under My Investments to monitor asset allocation and annual returns.'
      ],
      estimatedTarget: 'Consolidated real-time net-worth dashboard'
    }
  ];

  return steps;
}

/**
 * Suggests tailored investment and protection categories with transparent scoring.
 * 
 * @param {Object} profile - User questionnaire inputs
 * @returns {Array<Object>} Ranked suggestions with fit rationale, benefits, risks, and limitations
 */
export function generateSmartSuggestions(profile = {}) {
  const {
    hasHighInterestDebt = false,
    emergencyMonths = 0,
    hasHealthInsurance = false,
    hasTermInsurance = false,
    hasDependents = false,
    timeHorizon = 'long',
    riskTolerance = 'moderate',
    monthlyInvestableAmount = 5000,
    primaryGoal = 'wealth_growth',
  } = profile;

  const suggestions = [];

  // 1. Emergency Fund / Liquid Fund
  if (emergencyMonths < 6) {
    suggestions.push({
      categoryId: 'emergency-savings',
      title: 'Instant-Redemption Liquid Mutual Funds & Sweep FDs',
      matchScore: emergencyMonths < 3 ? 98 : 88,
      priority: 'Urgent Priority',
      badge: 'Capital Preservation',
      whyAppears: `You currently have ${emergencyMonths || 0} months of living reserves saved. Securing 3 to 6 months of liquid expenses prevents forced liquidation of investments during emergencies.`,
      keyBenefits: [
        'Instant liquidity up to ₹50,000 within 5 minutes via IMPS 24/7.',
        'Low volatility with high-credit sovereign and commercial papers.',
        'Earns higher yields (~6.5% - 7%) than standard 2.75% bank savings.'
      ],
      importantRisks: [
        'Returns are market-linked to prevailing short-term interest rates.',
        'Gains are taxed at your income slab rate.'
      ],
      feesAndLimitations: 'Expense ratio typically 0.15% - 0.25%. Graded exit load only for first 7 days, 0% thereafter.',
      whenUnsuitable: 'Unsuitable for money you will not need for 5+ years, where equity compounding is superior.',
      officialPortal: 'https://www.amfiindia.com/',
      providerLabel: 'AMFI India / Leading AMCs'
    });
  }

  // 2. Health Insurance
  if (!hasHealthInsurance) {
    suggestions.push({
      categoryId: 'health-insurance',
      title: 'Comprehensive Health Insurance Floater (₹10L - ₹25L)',
      matchScore: 96,
      priority: 'Non-Negotiable Shield',
      badge: 'Financial Defense',
      whyAppears: 'Medical inflation runs above 12% in India. One serious hospitalization can erase an entire investment portfolio.',
      keyBenefits: [
        'Cashless in-patient hospitalization across thousands of network hospitals.',
        'Protects savings and preserves investment compounding.',
        'Section 80D tax deduction up to ₹25,000 for self/family.'
      ],
      importantRisks: [
        'Pre-existing disease waiting periods (typically 1 to 3 years).',
        'Watch for room rent caps and co-pay clauses in budget policies.'
      ],
      feesAndLimitations: 'Annual renewable premium; 18% GST applies. Does not accumulate cash value (pure risk cover).',
      whenUnsuitable: 'Unsuitable as an investment or savings tool. It is strictly a risk-transfer contract.',
      officialPortal: 'https://irdai.gov.in/',
      providerLabel: 'IRDAI Approved Health Insurers'
    });
  }

  // 3. Pure Term Insurance
  if (hasDependents && !hasTermInsurance) {
    suggestions.push({
      categoryId: 'lic-life-insurance',
      title: 'Pure Term Life Insurance (15x - 20x Annual Income)',
      matchScore: 94,
      priority: 'Family Protection',
      badge: 'Income Replacement',
      whyAppears: 'You indicated having financial dependents. If something happens to you, term insurance replaces your income.',
      keyBenefits: [
        'Massive financial cover (₹1 Crore+) for an affordable monthly premium (~₹800 - ₹1,200).',
        'Section 10(10D) tax-free payout to nominee upon claim.',
        'Section 45 of Insurance Act guarantees non-disputability after 3 years.'
      ],
      importantRisks: [
        'Zero maturity payout if you survive the policy term (this is why premiums are so low).',
        'Must disclose all pre-existing conditions and tobacco usage truthfully.'
      ],
      feesAndLimitations: 'Pure mortality charges + GST. Fixed premium for the entire 30-40 year policy tenure.',
      whenUnsuitable: 'Unsuitable if you have zero financial dependents and sufficient assets to cover funeral costs.',
      officialPortal: 'https://www.licindia.in/en/web/guest/products',
      providerLabel: 'LIC of India & IRDAI Insurers'
    });
  }

  // 4. Equity Index Mutual Funds (Nifty 50 / Broad Market)
  if (!hasHighInterestDebt && timeHorizon !== 'short' && riskTolerance !== 'conservative') {
    suggestions.push({
      categoryId: 'mutual-funds',
      title: 'Low-Cost Nifty 50 & Large-Cap Index Funds (Direct - Growth)',
      matchScore: primaryGoal === 'wealth_growth' ? 95 : 86,
      priority: 'Wealth Compounding',
      badge: 'Long-Term Growth',
      whyAppears: `You have an investment horizon of "${timeHorizon}" and "${riskTolerance}" risk tolerance with no toxic debt holding you back.`,
      keyBenefits: [
        'Automatic exposure to India’s top 50 revenue-generating conglomerates.',
        'Direct plans feature ultra-low expense ratios (0.05% - 0.20%).',
        'Automated monthly SIP enables rupee-cost averaging across market cycles.'
      ],
      importantRisks: [
        'Equity markets fluctuate; portfolio can see paper drawdowns of 15-30% in bear markets.',
        'Requires minimum 5 to 7 year holding discipline to maximize return probability.'
      ],
      feesAndLimitations: 'Zero exit load after 7-15 days. LTCG tax of 12.5% applies on gains exceeding ₹1.25 Lakh per financial year.',
      whenUnsuitable: 'Unsuitable if you need this money within the next 3 years for immediate living expenses.',
      officialPortal: 'https://www.amfiindia.com/',
      providerLabel: 'AMFI India / SEBI AMCs'
    });
  }

  // 5. Sovereign Gold Bonds & Gold ETFs
  if (!hasHighInterestDebt && timeHorizon === 'long') {
    suggestions.push({
      categoryId: 'gold-silver',
      title: 'Sovereign Gold Bonds (SGB) & Gold ETFs',
      matchScore: 84,
      priority: 'Portfolio Hedge',
      badge: 'Currency Hedge',
      whyAppears: 'Allocating 5% to 10% of a portfolio to gold provides negative correlation during equity market downturns.',
      keyBenefits: [
        'SGB offers 2.50% annual interest on face value, paid semi-annually.',
        'SGB capital gains are 100% TAX-FREE if held till 8-year maturity.',
        'Gold ETFs provide seamless intraday liquidity on NSE/BSE starting at ~₹65.'
      ],
      importantRisks: [
        'Gold does not produce operating cash flow; returns depend solely on global bullion prices.',
        'SGB has an 8-year tenure, though secondary market trading on exchanges is possible.'
      ],
      feesAndLimitations: 'Zero management fees on SGB. ETF expense ratio ~0.10%-0.45%. Digital gold has 3% GST and 2.5-3.5% buy/sell spread.',
      whenUnsuitable: 'Unsuitable as a 100% portfolio allocation; best kept as a 5-10% stabilizing anchor.',
      officialPortal: 'https://rbiretaildirect.org.in/',
      providerLabel: 'RBI Retail Direct & NSE India'
    });
  }

  // 6. National Pension System (NPS) / PPF
  if (primaryGoal === 'tax_saving' || primaryGoal === 'retirement' || timeHorizon === 'long') {
    suggestions.push({
      categoryId: 'retirement-pension',
      title: 'National Pension System (NPS Tier 1)',
      matchScore: 89,
      priority: 'Retirement Tax Shield',
      badge: 'Super Low Cost',
      whyAppears: 'NPS offers an exclusive ₹50,000 tax deduction under Section 80CCD(1B) beyond standard 80C limits, with world-class low fund fees.',
      keyBenefits: [
        'Lowest fund management charge globally (~0.03% to 0.09% p.a.).',
        'Extra ₹50,000 tax deduction for investors under Old Tax Regime.',
        'Auto-rebalancing between equity and government debt as you age.'
      ],
      importantRisks: [
        'Corpus is locked until age 60.',
        'Mandatory minimum 40% annuity conversion at retirement (annuity income is taxable).'
      ],
      feesAndLimitations: 'Account maintenance charges of ~₹200/year with Protean CRA. Up to 60% lump sum at 60 is tax-free.',
      whenUnsuitable: 'Unsuitable if you require liquidity for mid-career business, wedding, or real estate purchases before age 60.',
      officialPortal: 'https://enps.nsdl.com/',
      providerLabel: 'PFRDA / eNPS Protean'
    });
  }

  // Sort by matchScore descending
  return suggestions.sort((a, b) => b.matchScore - a.matchScore);
}
