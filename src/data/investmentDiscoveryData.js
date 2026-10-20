// src/data/investmentDiscoveryData.js
/**
 * FinTrack Investment & Protection Discovery Catalog
 * Curated for Indian retail investors starting from zero.
 * 
 * CRITICAL COMPLIANCE & ACCURACY RULES:
 * 1. Only verified official links, recognized exchanges, and authorized regulators (SEBI, RBI, IRDAI, PFRDA).
 * 2. Transparent disclosure of counterparty, market, spread, liquidity, and regulatory status.
 * 3. Digital gold (including Aura Gold) is strictly segregated from SEBI-regulated ETFs and RBI-issued SGBs.
 * 4. Insurance products (LIC, Health) are categorized as financial protection, not investment wealth creators.
 */

export const INVESTMENT_CATEGORIES = [
  {
    id: 'gold-silver',
    title: 'Gold & Silver',
    shortDesc: 'Precious metals for portfolio hedging, inflation defense, and cultural wealth.',
    fullDesc: 'Precious metals have traditionally served as a hedge against currency depreciation and macro-economic uncertainty. In India, you can invest via physical bullion, regulated exchange-traded products (Gold ETFs), Sovereign Gold Bonds (SGBs), or fintech digital gold micro-savings apps.',
    risk: 'Moderate Risk',
    riskLevel: 'moderate',
    categoryType: 'Commodities & Metals',
    horizon: 'Long Term',
    taxBenefit: false,
    minAmount: '₹10 (Digital) / ₹60 (ETF)',
    lockIn: 'None (ETF/Digital) to 8 Years (SGB)',
    accentColor: '#B68A3A',
    iconName: 'Gem',
    badge: 'Inflation Hedge',
    regulatoryNote: 'Regulated variants (SGB/ETFs) enjoy statutory investor protection; digital gold relies on partner custodial trust deeds.',
    tags: ['Hedge', 'Precious Metals', 'SGB', 'Digital Gold', 'Aura Gold', 'ETFs'],
    products: [
      {
        id: 'aura-gold',
        name: 'Aura Gold & Silver App',
        entityName: 'Moi Technology Private Limited',
        type: 'Digital Gold & Silver Micro-Savings',
        minInvestment: '₹10',
        custodyStorage: '24K 99.9% Pure Gold stored in insured institutional bank-grade vaults (BRINKS / Sequel Logistics). Partnered with established bullion ecosystem (Augmont).',
        spreadCharges: 'Buy/Sell spread typically 2.5% - 3.5% + 3% mandatory GST on purchase. Making & courier charges apply on physical coin delivery.',
        liquidity: 'Instant 24x7 buy/sell directly back to registered bank account or UPI.',
        riskFactors: [
          'Digital gold is NOT currently regulated by SEBI or RBI.',
          'Not covered by DICGC bank deposit insurance.',
          'Subject to counterparty and vault custodian risk.',
          'Physical delivery involves minting and delivery fee deduction.'
        ],
        verificationStatus: 'Verified Official Provider (Moi Technology Pvt Ltd)',
        officialUrl: 'https://auragold.in/',
        appStoreUrl: 'https://play.google.com/store/apps/details?id=com.aura.gold',
        lastUpdated: 'October 2026',
        source: 'Aura Gold Official Web Portal & Google Play Listing',
        pros: ['Start micro-savings from as low as ₹10', 'Round-up auto-invest features', 'Option to redeem for hallmarked physical gold/silver'],
        cons: ['3% GST loss on purchase', 'Spread fee on liquidation', 'Unregulated fintech asset class unlike SGB/ETFs']
      },
      {
        id: 'sovereign-gold-bonds',
        name: 'Sovereign Gold Bonds (SGB)',
        entityName: 'Reserve Bank of India (on behalf of Government of India)',
        type: 'Sovereign Debt linked to Gold Prices',
        minInvestment: '1 Gram of Gold (~₹7,000 - ₹8,500 depending on market price)',
        custodyStorage: 'Held digitally in RBI Depository or personal Demat account (CDSL/NSDL). Sovereign zero default risk.',
        spreadCharges: 'Zero buy/sell spread during primary RBI tranche issuance. Zero GST. Nominal brokerage if purchased on secondary exchange market.',
        liquidity: '8-year tenure with early redemption windows via RBI from 5th year; tradable on NSE/BSE secondary markets (subject to trading volume).',
        riskFactors: [
          'Underlying gold price fluctuates with international bullion rates.',
          'Secondary market trading volume can have liquidity discounts before maturity.'
        ],
        verificationStatus: 'Sovereign Guaranteed by Government of India',
        officialUrl: 'https://rbiretaildirect.org.in/',
        lastUpdated: 'October 2026',
        source: 'Reserve Bank of India (RBI Retail Direct)',
        pros: ['Additional 2.50% annual interest paid semi-annually', '100% Capital Gains Tax FREE if held till 8-year maturity', 'Zero storage or making charges'],
        cons: ['Fixed 8-year maturity', 'Primary issuances occur only during RBI-notified calendar windows']
      },
      {
        id: 'gold-etfs',
        name: 'Gold Exchange Traded Funds (Gold BeES)',
        entityName: 'Nippon India / HDFC / ICICI Prudential Mutual Fund (SEBI Regulated)',
        type: 'Open-ended Exchange Traded Mutual Fund Scheme',
        minInvestment: '1 Unit on NSE/BSE (~₹65 - ₹75)',
        custodyStorage: 'Physical 99.5% pure bullion backed 1:1 and vaulted with SEBI-approved custodians (Deutsche Bank / Axis Custody).',
        spreadCharges: 'Low expense ratio (0.10% to 0.45% p.a.). Standard demat brokerage applies. No 3% GST on trade.',
        liquidity: 'High liquidity during market hours (9:15 AM - 3:30 PM IST) on NSE & BSE.',
        riskFactors: [
          'Market risk linked to bullion movements.',
          'Taxed at investor slab rate or capital gains rules under modern mutual fund regulations.'
        ],
        verificationStatus: 'SEBI Registered Mutual Fund Scheme',
        officialUrl: 'https://www.nseindia.com/market-data/exchange-traded-funds-etf',
        lastUpdated: 'October 2026',
        source: 'National Stock Exchange of India (NSE India)',
        pros: ['Extremely low entry threshold (~₹65)', 'Instant liquidity on stock exchanges', 'High transparency with daily NAV publication'],
        cons: ['Demat account required', 'No interest yield like SGBs']
      }
    ]
  },
  {
    id: 'stocks',
    title: 'Stocks & Equity',
    shortDesc: 'Own shares in publicly listed Indian enterprises for long-term compounding.',
    fullDesc: 'Equity shares represent fractional ownership in businesses listed on the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE). Long-term equity investing historically outpaces consumer inflation, but involves price volatility and business cycle risk.',
    risk: 'High Risk',
    riskLevel: 'high',
    categoryType: 'Direct Securities',
    horizon: 'Long Term (5+ Years)',
    taxBenefit: false,
    minAmount: 'Price of 1 Share (~₹50 to ₹3,000+)',
    lockIn: 'None (Liquid during trading sessions)',
    accentColor: '#2563EB',
    iconName: 'TrendingUp',
    badge: 'Growth Engine',
    regulatoryNote: 'Governed by Securities and Exchange Board of India (SEBI). Transactions executed via SEBI-registered brokers.',
    tags: ['Equities', 'NSE', 'BSE', 'Wealth Creation', 'Dividends', 'SEBI'],
    products: [
      {
        id: 'nifty50-largecap',
        name: 'Nifty 50 Bluechip Equity Basket',
        entityName: 'Top 50 Publicly Traded Indian Conglomerates (NSE India)',
        type: 'Bluechip Large-Cap Equity',
        minInvestment: 'Flexible (Single share basis)',
        custodyStorage: 'Electronic depository accounts via CDSL & NSDL.',
        spreadCharges: 'STT (Securities Transaction Tax) 0.1%, exchange turnover charges, SEBI turnover fees, demat DP charges.',
        liquidity: 'T+1 settlement rolling cycle on Indian exchanges.',
        riskFactors: [
          'Equity markets can experience sharp drawdowns in bear markets.',
          'Returns are never guaranteed; depends on corporate earnings and macro conditions.'
        ],
        verificationStatus: 'Official Indian Stock Exchanges (NSE / BSE)',
        officialUrl: 'https://www.nseindia.com/',
        lastUpdated: 'October 2026',
        source: 'NSE India & BSE India Official Portals',
        pros: ['Established corporate governance', 'Regular dividend payouts', 'High institutional liquidity'],
        cons: ['Volatile in the short run', 'Requires fundamental research and emotional discipline']
      },
      {
        id: 'equity-investor-education',
        name: 'SEBI & NSE Investor Education & Varsity',
        entityName: 'SEBI Saa₹thi & Zerodha Varsity (Open Educational Resource)',
        type: 'Zero-Cost Certified Investor Education',
        minInvestment: '₹0 (Free Education)',
        custodyStorage: 'Not Applicable (Educational Platform)',
        spreadCharges: 'Zero cost.',
        liquidity: 'Accessible 24/7.',
        riskFactors: ['None (Educational learning).'],
        verificationStatus: 'Official SEBI Investor Education Platform',
        officialUrl: 'https://investor.sebi.gov.in/',
        secondaryUrl: 'https://zerodha.com/varsity/',
        lastUpdated: 'October 2026',
        source: 'SEBI Investor Awareness & Education Portal',
        pros: ['Learn financial statement analysis', 'Understand risk management and portfolio sizing', 'Free from stock tip spam or bias'],
        cons: ['Requires dedication and self-study']
      }
    ]
  },
  {
    id: 'ipos',
    title: 'IPOs (Initial Public Offerings)',
    shortDesc: 'Apply for fresh primary market listings of growing private companies.',
    fullDesc: 'An Initial Public Offering (IPO) is when an unlisted private company issues shares to the public for the first time on the NSE and BSE. Retail investors can apply seamlessly using UPI-based ASBA (Application Supported by Blocked Amount), meaning funds remain in your bank account until allotment is confirmed.',
    risk: 'High Risk',
    riskLevel: 'high',
    categoryType: 'Primary Market',
    horizon: 'Short to Long Term',
    taxBenefit: false,
    minAmount: '₹14,000 - ₹15,000 (Standard 1 Retail Lot)',
    lockIn: 'None after listing; funds blocked 3-5 days during bidding',
    accentColor: '#7C3AED',
    iconName: 'Building2',
    badge: 'Primary Offerings',
    regulatoryNote: 'SEBI strictly oversees Red Herring Prospectus (DRHP/RHP) filings. Application via official ASBA only.',
    tags: ['IPO', 'ASBA', 'UPI', 'Primary Market', 'Prospectus', 'NSE/BSE'],
    products: [
      {
        id: 'mainboard-ipo-platform',
        name: 'Mainboard IPO Bidding & Exchange Tracking',
        entityName: 'National Stock Exchange of India (NSE E-IPO Platform)',
        type: 'Primary Market Book Building Issue',
        minInvestment: '1 Retail Lot (usually ₹14,000 to ₹15,000)',
        custodyStorage: 'Allotted shares credited directly to your CDSL/NSDL Demat account.',
        spreadCharges: 'Zero bidding fee via net banking ASBA or authorized UPI broker apps.',
        liquidity: 'High post-listing; funds unblocked within 24-48 hours if unallotted.',
        riskFactors: [
          'High listing day volatility; shares can list at a discount to the issue price.',
          'Grey Market Premium (GMP) is unregulated, speculative, and NOT an official indicator.',
          'Allotment in oversubscribed issues is determined via randomized computer lottery.'
        ],
        verificationStatus: 'Official Exchange IPO Bidding Infrastructure',
        officialUrl: 'https://www.nseindia.com/market-data/all-upcoming-issues-ipo',
        secondaryUrl: 'https://www.bseindia.com/publicissue.html',
        lastUpdated: 'October 2026',
        source: 'NSE India & BSE India Primary Market Listings',
        pros: ['ASBA protects capital — money never leaves your bank until allotment', 'Chance to invest at issue price in high-growth companies', 'Transparent online allotment checking'],
        cons: ['Low allotment probability in hot issues', 'Valuation risk if promoters price aggressively']
      }
    ]
  },
  {
    id: 'mutual-funds',
    title: 'Mutual Funds & SIP',
    shortDesc: 'Professionally managed diversified baskets of equity, debt, and hybrid assets.',
    fullDesc: 'Mutual funds pool money from thousands of investors to invest in diversified portfolios managed by professional fund managers. Systematic Investment Plan (SIP) is a disciplined method to invest a fixed amount regularly (monthly or weekly), taking advantage of Rupee Cost Averaging without timing the market.',
    risk: 'Moderate to High Risk',
    riskLevel: 'moderate',
    categoryType: 'Pooled Investment Schemes',
    horizon: 'Medium to Long Term',
    taxBenefit: true,
    minAmount: '₹100 to ₹500/month',
    lockIn: 'None for open-ended funds; 3 years for ELSS Tax Savers',
    accentColor: '#0F766E',
    iconName: 'BadgePercent',
    badge: 'Core Diversifier',
    regulatoryNote: 'All Asset Management Companies (AMCs) and schemes are registered with SEBI and overseen by AMFI.',
    tags: ['SIP', 'Mutual Funds', 'Index Funds', 'ELSS', 'AMFI', 'Direct Plans'],
    products: [
      {
        id: 'nifty-index-fund',
        name: 'Nifty 50 Index Mutual Fund (Direct - Growth)',
        entityName: 'Leading SEBI AMCs (UTI, Navi, HDFC, Nippon, ICICI Pru)',
        type: 'Passive Low-Cost Index Mutual Fund',
        minInvestment: '₹100/month via SIP',
        custodyStorage: 'Holding statement via Mutual Fund RTA (CAMS / KFintech) or Demat.',
        spreadCharges: 'Direct Plan Expense Ratio: 0.05% - 0.20% p.a. Zero exit load after 7-15 days.',
        liquidity: 'Redeemable on any business day at prevailing 3:00 PM NAV. Payout in 1-2 business days.',
        riskFactors: [
          'Reflects the market movement of India’s top 50 companies.',
          'No downside protection during market bear phases.'
        ],
        verificationStatus: 'AMFI & SEBI Registered Scheme Type',
        officialUrl: 'https://www.amfiindia.com/',
        secondaryUrl: 'https://www.mfcentral.com/',
        lastUpdated: 'October 2026',
        source: 'Association of Mutual Funds in India (AMFI)',
        pros: ['Direct plans save up to 1% annually over regular plans', 'Eliminates active fund manager risk', 'Automated monthly SIP discipline'],
        cons: ['Subject to market volatility', 'Cannot beat the benchmark index (designed to mirror it)']
      },
      {
        id: 'elss-tax-saver',
        name: 'ELSS (Equity Linked Savings Scheme - 80C)',
        entityName: 'SEBI Registered Mutual Fund Category',
        type: 'Tax-Saving Diversified Equity Fund',
        minInvestment: '₹500/month',
        custodyStorage: 'Electronic folio units with CAMS/KFintech.',
        spreadCharges: 'Expense ratio 0.5% - 0.9% for Direct plans. Zero exit load post lock-in.',
        liquidity: 'Mandatory statutory 3-year lock-in per SIP installment.',
        riskFactors: [
          'Equity market fluctuations.',
          'Each monthly SIP installment has its own separate 3-year lock-in clock.'
        ],
        verificationStatus: 'Income Tax Act Sec 80C Approved Asset Class',
        officialUrl: 'https://www.amfiindia.com/investor-corner/knowledge-center/elss.html',
        lastUpdated: 'October 2026',
        source: 'AMFI India Knowledge Center',
        pros: ['Shortest lock-in among all 80C instruments (3 years vs 15 for PPF)', 'Potential for inflation-beating equity returns', 'Tax deduction up to ₹1.5 Lakh under Old Tax Regime'],
        cons: ['Locked for 3 years', 'LTCG tax of 12.5% applies on gains above ₹1.25 Lakh per year']
      }
    ]
  },
  {
    id: 'lic-life-insurance',
    title: 'LIC & Life Insurance',
    shortDesc: 'Financial safety net to replace income and protect your family from catastrophe.',
    fullDesc: 'Life insurance is fundamentally a risk-protection instrument, NOT an investment tool. Its primary purpose is to ensure that if the breadwinner passes away, dependents receive a tax-free lump sum to pay off debts, fund living expenses, and secure education. Pure term plans provide the highest cover for the lowest premium.',
    risk: 'Low Risk (Guaranteed Claim Under Policy Terms)',
    riskLevel: 'low',
    categoryType: 'Financial Protection',
    horizon: 'Long Term (10 to 40 Years)',
    taxBenefit: true,
    minAmount: '₹500 - ₹2,000/month for ₹1 Crore Cover',
    lockIn: 'Policy term duration (Premium payment terms vary)',
    accentColor: '#A83F55',
    iconName: 'ShieldCheck',
    badge: 'Essential Shield',
    regulatoryNote: 'Regulated by Insurance Regulatory and Development Authority of India (IRDAI). Section 45 ensures claim protection after 3 years.',
    tags: ['Life Insurance', 'Term Plan', 'LIC', 'IRDAI', 'Income Replacement', 'Section 80C'],
    products: [
      {
        id: 'pure-term-insurance',
        name: 'Pure Term Life Insurance (10x - 20x Annual Income)',
        entityName: 'Life Insurance Corporation of India (LIC Tech Term) & IRDAI Insurers',
        type: 'Pure Protection Term Insurance',
        minInvestment: '₹600 - ₹1,500/month for ₹1 Crore Sum Assured (Age 25-30 healthy non-smoker)',
        custodyStorage: 'E-Insurance Account (eIA via CAMSRep / NSDL / CIRL) & physical policy bond.',
        spreadCharges: 'Pure mortality charge + nominal admin expenses. 18% GST (currently under GST council review for reduction).',
        liquidity: 'No maturity value if life assured survives term (Pure cover). Critical illness riders available.',
        riskFactors: [
          'Policy lapses if premiums are missed.',
          'Full and truthful disclosure of pre-existing medical conditions, smoking, and family history is mandatory to guarantee claim approval.'
        ],
        verificationStatus: 'Official LIC Products Portal & IRDAI Regulated',
        officialUrl: 'https://www.licindia.in/en/web/guest/products',
        lastUpdated: 'October 2026',
        source: 'Life Insurance Corporation of India (LIC of India)',
        pros: ['Huge financial coverage (₹1 Crore+) for the cost of a couple of coffees a week', 'Section 10(10D) tax-free death benefit for nominees', 'Section 45 of Insurance Act protects policies older than 3 years from claim repudiation'],
        cons: ['Zero return if you outlive the term (it is protection, not an investment)', 'Medical tests required for high sum assured']
      },
      {
        id: 'lic-endowment-distinction',
        name: 'LIC Traditional Savings & Endowment Plans (Understanding the Math)',
        entityName: 'Life Insurance Corporation of India (Jeevan Labh / New Jeevan Anand)',
        type: 'Endowment / With-Profits Life Policy',
        minInvestment: '₹15,000 - ₹50,000/year',
        custodyStorage: 'Official LIC Policy Bond and eIA.',
        spreadCharges: 'Built-in distributor commissions, mortality and administration costs.',
        liquidity: 'Low liquidity. Surrender value in early years entails heavy penalties.',
        riskFactors: [
          'Historical internal rate of return (IRR) is typically 4.5% to 5.5% p.a., often trailing real inflation.',
          'High surrender penalties if discontinued before 2-3 years.'
        ],
        verificationStatus: 'Official LIC Product Catalogue',
        officialUrl: 'https://www.licindia.in/en/web/guest/products',
        lastUpdated: 'October 2026',
        source: 'LIC of India Official Products',
        pros: ['Sovereign guarantee under Section 37 of LIC Act, 1956', 'Forced savings habit', 'Guaranteed maturity additions where declared'],
        cons: ['Significantly lower life cover compared to term insurance', 'Returns rarely beat equity mutual funds or even PPF']
      }
    ]
  },
  {
    id: 'health-insurance',
    title: 'Health Insurance',
    shortDesc: 'Comprehensive medical expense defense against hospital bills and inflation.',
    fullDesc: 'Medical emergencies are the number one cause of family insolvency and debt in India. Health insurance provides cashless hospitalization and reimburses medical treatments across thousands of network hospitals, shielding your savings from depletion.',
    risk: 'Low Risk (Contractual Protection)',
    riskLevel: 'low',
    categoryType: 'Health Protection',
    horizon: 'Annual Renewable Contract',
    taxBenefit: true,
    minAmount: '₹8,000 - ₹18,000/year (₹10L Family Floater)',
    lockIn: 'Annual contract with lifetime renewability',
    accentColor: '#0D9488',
    iconName: 'ShieldAlert',
    badge: 'Medical Shield',
    regulatoryNote: 'Governed by IRDAI Health Insurance Regulations. Pre-existing disease waiting period capped at maximum 3 years.',
    tags: ['Health Cover', 'Mediclaim', 'Cashless Hospitalization', 'Family Floater', 'IRDAI', 'Section 80D'],
    products: [
      {
        id: 'comprehensive-family-floater',
        name: 'Comprehensive Family Floater Mediclaim (₹10L - ₹25L Cover)',
        entityName: 'IRDAI-Approved General & Standalone Health Insurers (Star, Care, HDFC ERGO, Niva Bupa)',
        type: 'Cashless In-Patient Hospitalization Cover',
        minInvestment: '₹8,000 - ₹16,000/year depending on eldest member age',
        custodyStorage: 'TPA / Insurer digital health card and policy schedule.',
        spreadCharges: '18% GST on premium. Direct claim processing via cashless network desks.',
        liquidity: 'Cashless claims at network hospitals; reimbursement within 15-30 days for non-network hospitals.',
        riskFactors: [
          'Initial 30-day waiting period (except accidental injury).',
          'Pre-existing disease (PED) waiting period of 1 to 3 years.',
          'Room rent sub-limits and proportionate deduction clauses in cheaper policies.'
        ],
        verificationStatus: 'Regulated by IRDAI Bima Bharosa',
        officialUrl: 'https://irdai.gov.in/',
        secondaryUrl: 'https://bimabharosa.irdai.gov.in/',
        lastUpdated: 'October 2026',
        source: 'IRDAI Consumer Protection Portal',
        pros: ['100% Cashless network treatment across 10,000+ hospitals', 'No room rent capping in modern comprehensive plans', 'Section 80D tax deduction up to ₹25,000 (₹50,000 for senior citizen parents)'],
        cons: ['Premiums escalate with age bands', 'Cosmetic and non-medical consumables often excluded']
      },
      {
        id: 'super-top-up',
        name: 'Super Top-Up Health Policy (Cost-Effective Multi-Lakh Shield)',
        entityName: 'IRDAI Registered Health Insurers',
        type: 'High-Deductible Aggregate Health Insurance',
        minInvestment: '₹2,500 - ₹4,500/year for ₹20L - ₹50L Cover',
        custodyStorage: 'Digital policy docket.',
        spreadCharges: 'Nominal premium due to deductible threshold (e.g. ₹5 Lakh deductible).',
        liquidity: 'Triggers when total cumulative hospital expenses in a policy year exceed the chosen deductible.',
        riskFactors: ['Will not pay for small claims below the deductible amount.'],
        verificationStatus: 'IRDAI Approved Product Structure',
        officialUrl: 'https://irdai.gov.in/',
        lastUpdated: 'October 2026',
        source: 'IRDAI Guidelines',
        pros: ['Extremely cheap way to get ₹50 Lakh+ total medical cover', 'Combines seamlessly with employer corporate group health insurance', 'Protects against catastrophic multi-organ or cancer treatments'],
        cons: ['Deductible must be satisfied before policy triggers']
      }
    ]
  },
  {
    id: 'fixed-deposits',
    title: 'Fixed & Recurring Deposits',
    shortDesc: 'Guaranteed capital preservation and predictable interest from scheduled banks.',
    fullDesc: 'Bank Fixed Deposits (FDs) and Recurring Deposits (RDs) offer absolute capital security and fixed contractual returns. Under the Deposit Insurance and Credit Guarantee Corporation (DICGC) Act, deposits up to ₹5,00,000 per depositor per bank (principal + interest) are fully insured by the Reserve Bank of India subsidiary.',
    risk: 'Low Risk',
    riskLevel: 'low',
    categoryType: 'Bank Savings',
    horizon: 'Short to Medium Term (7 Days to 10 Years)',
    taxBenefit: false,
    minAmount: '₹500 to ₹1,000',
    lockIn: 'Tenure chosen (Premature exit available with 0.5-1% penalty)',
    accentColor: '#64748B',
    iconName: 'Landmark',
    badge: 'Capital Safety',
    regulatoryNote: 'Governed by RBI Banking Regulation Act. Insured up to ₹5 Lakh per bank by DICGC.',
    tags: ['FD', 'RD', 'DICGC', 'Bank Deposit', 'Guaranteed Return', 'Senior Citizens'],
    products: [
      {
        id: 'scheduled-bank-fd',
        name: 'Scheduled Commercial Bank FD (SBI, HDFC, ICICI, PNB)',
        entityName: 'RBI Licensed Scheduled Commercial Banks',
        type: 'Term Deposit with Compounding Interest',
        minInvestment: '₹1,000',
        custodyStorage: 'Direct bank deposit account with RBI supervisory oversight.',
        spreadCharges: 'Zero upfront fees. Premature withdrawal penalty typically 0.50% - 1.00% lower interest.',
        liquidity: 'Instant liquidation via mobile banking or net banking (instant credit to savings).',
        riskFactors: [
          'Returns may trail real after-tax inflation.',
          'Interest is fully taxable at your income tax slab rate (TDS deducted if >₹40,000/yr or ₹50,000 for seniors).'
        ],
        verificationStatus: 'DICGC Insured up to ₹5,00,000',
        officialUrl: 'https://www.dicgc.org.in/',
        lastUpdated: 'October 2026',
        source: 'Deposit Insurance and Credit Guarantee Corporation (DICGC / RBI)',
        pros: ['Guaranteed principal and interest payout', 'Additional 0.50% interest for senior citizens (age 60+)', 'Loan / overdraft facility available against FD up to 90%'],
        cons: ['Tax inefficient for individuals in 30% slab', 'Real returns after inflation can be zero or negative']
      }
    ]
  },
  {
    id: 'government-securities',
    title: 'Government Securities & Savings Schemes',
    shortDesc: 'Zero-credit-risk sovereign instruments directly backed by the Republic of India.',
    fullDesc: 'Government securities (G-Secs, Treasury Bills, SDLs) and statutory small savings schemes (PPF, NSC, Sukanya Samriddhi) carry sovereign backing, meaning zero default risk. RBI Retail Direct allows retail individuals to participate directly in sovereign bond auctions with zero intermediary commissions.',
    risk: 'Low Risk (Zero Credit Risk)',
    riskLevel: 'low',
    categoryType: 'Sovereign Debt',
    horizon: 'Short to Long Term (91 Days to 40 Years)',
    taxBenefit: true,
    minAmount: '₹500 (PPF) / ₹10,000 (RBI Retail Direct)',
    lockIn: 'Varies: 91 days (T-Bills) to 15 years (PPF)',
    accentColor: '#475569',
    iconName: 'Coins',
    badge: 'Sovereign Backed',
    regulatoryNote: 'Issued under the authority of Government of India & administered directly by the Reserve Bank of India.',
    tags: ['G-Sec', 'T-Bills', 'RBI Retail Direct', 'PPF', 'NSC', 'Sovereign'],
    products: [
      {
        id: 'rbi-retail-direct',
        name: 'RBI Retail Direct G-Secs & Treasury Bills',
        entityName: 'Reserve Bank of India (RBI)',
        type: 'Direct Sovereign Debt Auction Account',
        minInvestment: '₹10,000 for G-Secs / T-Bills (91, 182, 364 days)',
        custodyStorage: 'Retail Direct Gilt Account (RDG Account) held directly with RBI.',
        spreadCharges: 'ZERO account opening fee, ZERO bidding fee, ZERO maintenance charges.',
        liquidity: 'Liquid in NDS-OM secondary market system through RBI portal.',
        riskFactors: [
          'Interest rate duration risk if you sell long-term bonds before maturity.',
          'Zero credit risk (sovereign guaranteed).'
        ],
        verificationStatus: 'Official Reserve Bank of India Portal',
        officialUrl: 'https://rbiretaildirect.org.in/',
        lastUpdated: 'October 2026',
        source: 'Reserve Bank of India Retail Direct Scheme',
        pros: ['Direct government safety with zero intermediary risk', 'Predictable coupon payouts every 6 months', 'Zero brokerage or custodian maintenance fees for retail investors'],
        cons: ['Fixed auction schedules', 'Secondary market liquidity for odd lots can be thin']
      },
      {
        id: 'ppf-scheme',
        name: 'Public Provident Fund (PPF)',
        entityName: 'Ministry of Finance, Government of India (Administered via Banks/Post Office)',
        type: 'Statutory 15-Year Small Savings Scheme',
        minInvestment: '₹500/year up to ₹1,50,000/year',
        custodyStorage: 'National Small Savings Fund (NSSF) ledger via authorized bank/post office.',
        spreadCharges: 'Zero charges.',
        liquidity: '15-year tenure. Partial withdrawals permitted from 7th financial year; loan against PPF from 3rd year.',
        riskFactors: ['Government revises interest rates quarterly based on sovereign bond yield benchmarks.'],
        verificationStatus: 'Government of India Sovereign Scheme',
        officialUrl: 'https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx',
        lastUpdated: 'October 2026',
        source: 'India Post & Ministry of Finance National Savings Institute',
        pros: ['Triple Exempt (EEE) tax status — Investment, Interest, and Maturity are 100% tax-free', 'Cannot be attached by any court decree for consumer debt liabilities', 'Compound interest calculated monthly and credited annually'],
        cons: ['15-year long lock-in', 'Maximum investment capped at ₹1,50,000 per financial year']
      }
    ]
  },
  {
    id: 'etfs-reits-invits',
    title: 'ETFs, REITs & InvITs',
    shortDesc: 'Fractional ownership of Grade-A commercial real estate and infrastructure assets.',
    fullDesc: 'Real Estate Investment Trusts (REITs) and Infrastructure Investment Trusts (InvITs) allow everyday retail investors to earn rental income and distributions from commercial tech parks, malls, power grids, and toll highways, without having to buy physical land or manage property tenants.',
    risk: 'Moderate Risk',
    riskLevel: 'moderate',
    categoryType: 'Yield & Listed Assets',
    horizon: 'Medium to Long Term (3+ Years)',
    taxBenefit: false,
    minAmount: '₹300 - ₹500 (1 Unit on Stock Exchange)',
    lockIn: 'None (Liquid during market trading hours)',
    accentColor: '#6366F1',
    iconName: 'Building2',
    badge: 'Rental Yield',
    regulatoryNote: 'SEBI mandates that REITs/InvITs distribute at least 90% of their net distributable cash flows to unit holders semi-annually or quarterly.',
    tags: ['REIT', 'InvIT', 'Commercial Real Estate', 'Rental Yield', 'SEBI', 'Infrastructure'],
    products: [
      {
        id: 'listed-reits-india',
        name: 'Listed Indian REITs (Embassy, Mindspace, Brookfield, Nexus)',
        entityName: 'SEBI-Registered Real Estate Investment Trusts',
        type: 'Publicly Traded Real Estate Trust',
        minInvestment: '1 Unit on NSE/BSE (~₹300 - ₹450)',
        custodyStorage: 'Standard Demat account with CDSL / NSDL.',
        spreadCharges: 'Standard demat equity brokerage. Management fees deducted internally from gross rental yields.',
        liquidity: 'Traded continuously like ordinary shares on NSE and BSE.',
        riskFactors: [
          'Commercial vacancy and tenant non-renewal risk.',
          'Sensitivity to rising interest rates (which can compress cap rates and real estate valuation).'
        ],
        verificationStatus: 'SEBI Regulated Real Estate Investment Trust',
        officialUrl: 'https://www.nseindia.com/market-data/real-estate-investment-trusts-reits-infrastructure-investment-trusts-invits',
        lastUpdated: 'October 2026',
        source: 'NSE India REITs & InvITs Market Section',
        pros: ['Regular quarterly cash distributions (typically 6% - 7.5% gross yield)', 'Exposure to Grade-A IT parks and commercial office spaces', 'High transparency with mandatory quarterly asset audits'],
        cons: ['Unit price can fluctuate on exchanges', 'Complex distribution tax classification (dividend vs interest vs return of capital)']
      }
    ]
  },
  {
    id: 'retirement-pension',
    title: 'Retirement & Pension',
    shortDesc: 'Systematic pension compounding with sovereign low fees and exclusive tax shields.',
    fullDesc: 'Retirement planning requires building a dedicated corpus that cannot be easily raided for short-term consumption. The National Pension System (NPS), regulated by PFRDA, offers the lowest fund management expense ratios in the world (~0.03% to 0.09%) with asset allocation choices across equity, corporate debt, and government bonds.',
    risk: 'Low to Moderate Risk',
    riskLevel: 'moderate',
    categoryType: 'Retirement Corpus',
    horizon: 'Long Term (Until Age 60)',
    taxBenefit: true,
    minAmount: '₹500 (Tier 1) / ₹1,000 (Tier 2)',
    lockIn: 'Locked until age 60 (Partial emergency withdrawals allowed for specific events)',
    accentColor: '#8B5E83',
    iconName: 'WalletCards',
    badge: 'Retirement Security',
    regulatoryNote: 'Regulated by the Pension Fund Regulatory and Development Authority (PFRDA) under the PFRDA Act, 2013.',
    tags: ['NPS', 'PFRDA', 'Section 80CCD', 'Pension', 'Retirement', 'Annuity'],
    products: [
      {
        id: 'nps-tier-1',
        name: 'National Pension System (NPS Tier 1)',
        entityName: 'Pension Fund Regulatory and Development Authority (PFRDA / Protean CRA)',
        type: 'Defined Contribution Pension Account',
        minInvestment: '₹500 minimum per contribution / ₹1,000 per financial year',
        custodyStorage: 'Central Recordkeeping Agency (Protean / KFintech CRA) and National Pension Trust.',
        spreadCharges: 'Fund Management Charge: 0.03% to 0.09% p.a. (Among the cheapest pension fees globally).',
        liquidity: 'Locked until age 60. At 60, up to 60% of corpus can be withdrawn 100% TAX-FREE; minimum 40% must purchase an annuity pension.',
        riskFactors: [
          'Strict lock-in limits liquidity before retirement age.',
          'Annuity pension income is taxable at prevailing slab rate in retirement.'
        ],
        verificationStatus: 'Statutory Pension Scheme under PFRDA',
        officialUrl: 'https://enps.nsdl.com/',
        secondaryUrl: 'https://www.pfrda.org.in/',
        lastUpdated: 'October 2026',
        source: 'PFRDA & eNPS Protean CRA Portal',
        pros: ['Exclusive extra ₹50,000 tax deduction under Section 80CCD(1B) beyond 80C limit', 'World-class fund management at rock-bottom fees', 'Auto-choice lifecycle funds rebalance from equity to debt automatically as you age'],
        cons: ['Mandatory 40% annuity conversion at retirement', 'Premature exit requires 80% to be locked into annuity']
      }
    ]
  },
  {
    id: 'emergency-savings',
    title: 'Emergency Savings & Runway',
    shortDesc: 'Liquid financial buffer covering 3 to 6 months of expenses before taking risk.',
    fullDesc: 'Before allocating even one single rupee into volatile stock markets or illiquid instruments, every individual must have an emergency reserve. This money protects you against sudden job loss, vehicle breakdowns, or family emergencies without forcing you to sell investments at a loss or take 40% interest credit card debt.',
    risk: 'Low Risk',
    riskLevel: 'low',
    categoryType: 'Liquid Buffer',
    horizon: 'Immediate Access (0 to 24 Hours)',
    taxBenefit: false,
    minAmount: '₹500',
    lockIn: 'Zero Lock-in (Instant Access)',
    accentColor: '#15803D',
    iconName: 'ShieldCheck',
    badge: 'First Priority',
    regulatoryNote: 'Kept in RBI-supervised scheduled banks or SEBI-regulated overnight/liquid mutual funds.',
    tags: ['Emergency Fund', 'Liquid Funds', 'Runway', 'Zero Risk', 'Instant Access', 'Financial Foundation'],
    products: [
      {
        id: 'liquid-mutual-funds',
        name: 'Instant-Redemption Liquid Mutual Funds',
        entityName: 'SEBI-Regulated Asset Management Companies',
        type: 'Short-Duration Money Market Fund (Upto 91 Day Papers)',
        minInvestment: '₹500',
        custodyStorage: 'MF Folio with SEBI approved custodian.',
        spreadCharges: 'Expense ratio ~0.15% - 0.25%. Graded exit load only for first 7 days, zero thereafter.',
        liquidity: 'Instant access facility up to ₹50,000 or 90% of folio value (credited to bank via IMPS in 5 minutes).',
        riskFactors: [
          'Extremely low risk; invests only in sovereign treasury bills and high-grade corporate commercial papers.',
          'Not covered by DICGC bank insurance.'
        ],
        verificationStatus: 'SEBI Registered Liquid Mutual Fund Category',
        officialUrl: 'https://www.amfiindia.com/',
        lastUpdated: 'October 2026',
        source: 'AMFI India Guidelines',
        pros: ['Instant ₹50,000 redemption anytime, even on Sundays and bank holidays', 'Better returns than standard 2.5-3% bank savings account', 'Keeps emergency money mentally separate from spending account'],
        cons: ['Taxed as per income tax slab rate under debt fund rules']
      },
      {
        id: 'sweep-in-bank-fd',
        name: 'Auto Sweep-In Bank Savings Deposit',
        entityName: 'Scheduled Commercial Banks (SBI Multi Option Deposit / HDFC / ICICI)',
        type: 'Hybrid Liquid Bank Deposit with Sweep Facility',
        minInvestment: 'Threshold typically ₹25,000 in savings account',
        custodyStorage: 'Scheduled bank account with DICGC insurance.',
        spreadCharges: 'Zero charges. Auto breaks reverse sweep when ATM/UPI transactions occur.',
        liquidity: 'Instant 24x7 liquidity via debit card, ATM, or UPI payment.',
        riskFactors: ['Interest rate subject to standard bank FD rate schedule.'],
        verificationStatus: 'RBI Supervised Scheduled Bank Deposit',
        officialUrl: 'https://www.rbi.org.in/',
        lastUpdated: 'October 2026',
        source: 'Reserve Bank of India Banking Codes',
        pros: ['Earns FD interest (~6.5% - 7%) while remaining 100% spendable on UPI', 'No penalty on auto-breaking fractional amounts', 'DICGC protection up to ₹5 Lakh'],
        cons: ['Requires initial balance threshold to activate auto-sweep']
      }
    ]
  },
  {
    id: 'other-investments',
    title: 'Other Verified Financial Products',
    shortDesc: 'Sovereign Green Bonds, Corporate Debt, and Regulated Online Bond Platforms.',
    fullDesc: 'Beyond conventional equities and fixed deposits, the Indian financial market offers niche instruments such as Sovereign Green Bonds (funding renewable infrastructure) and curated senior-secured corporate bonds accessible via SEBI-regulated Online Bond Platform Providers (OBPPs).',
    risk: 'Low to Moderate Risk',
    riskLevel: 'moderate',
    categoryType: 'Alternative Debt & Niche',
    horizon: 'Medium Term (1 to 5 Years)',
    taxBenefit: false,
    minAmount: '₹1,000 to ₹10,000',
    lockIn: 'Tenor specific (1 to 5 years)',
    accentColor: '#C26A35',
    iconName: 'Coins',
    badge: 'Curated Debt',
    regulatoryNote: 'SEBI regulated under SEBI (Issue and Listing of Non-Convertible Securities) Regulations, 2021.',
    tags: ['Green Bonds', 'Corporate Bonds', 'OBPP', 'SEBI', 'Fixed Income'],
    products: [
      {
        id: 'sovereign-green-bonds',
        name: 'Sovereign Green Bonds (SGrBs)',
        entityName: 'Government of India & Reserve Bank of India',
        type: 'Sovereign Clean-Energy Infrastructure Debt',
        minInvestment: '₹10,000 via RBI Retail Direct',
        custodyStorage: 'RBI Retail Direct Depository.',
        spreadCharges: 'Zero charges on primary issuance.',
        liquidity: 'Tradable on secondary markets via NDS-OM.',
        riskFactors: ['Interest rate duration sensitivity.'],
        verificationStatus: 'Government of India Sovereign Instrument',
        officialUrl: 'https://rbiretaildirect.org.in/',
        lastUpdated: 'October 2026',
        source: 'Reserve Bank of India Framework for Sovereign Green Bonds',
        pros: ['Backs public solar, wind, and green transit projects', 'Zero credit default risk (Sovereign guarantee)', 'Semi-annual coupon payout'],
        cons: ['Yield closely mirrors standard G-Secs with minimal spread']
      }
    ]
  }
];

export const FILTER_OPTIONS = [
  { id: 'all', label: 'All Categories' },
  { id: 'low-risk', label: 'Low Risk' },
  { id: 'moderate-risk', label: 'Moderate Risk' },
  { id: 'high-risk', label: 'High Risk' },
  { id: 'short-term', label: 'Short Term' },
  { id: 'long-term', label: 'Long Term' },
  { id: 'tax-saving', label: 'Tax Saving (80C/80CCD)' },
  { id: 'insurance', label: 'Insurance & Protection' }
];
