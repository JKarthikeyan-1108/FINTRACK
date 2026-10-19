/**
 * FinTrack AI Financial Copilot
 * Context-aware intelligent assistant that inspects client financial state
 * (transactions, accounts, budgets, loans, investments) to generate deep, actionable insights.
 */

import { money } from './format';

export function analyzeFinancialHealth({
  transactions = [],
  accounts = [],
  budgets = [],
  loans = [],
  investments = [],
  subscriptions = [],
} = {}) {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Month transactions
  const monthTx = transactions.filter(t => t.date && String(t.date).startsWith(currentMonthPrefix));
  const incomeTx = monthTx.filter(t => t.type === 'income');
  const expenseTx = monthTx.filter(t => t.type === 'expense');

  const totalIncome = incomeTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Total Liquid Cash across accounts
  const liquidCash = accounts
    .filter(a => a.type === 'bank' || a.type === 'cash' || a.type === 'checking' || a.type === 'savings')
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  // Total Outstanding Debt
  const totalDebt = loans.reduce((sum, l) => sum + Number(l.remaining_principal || l.principal_amount || 0), 0);
  const monthlyEmi = loans.reduce((sum, l) => sum + Number(l.emi_amount || 0), 0);

  // Total Investments Value
  const totalInvestments = investments.reduce((sum, i) => sum + Number(i.current_value || i.invested_amount || 0), 0);

  // Category breakdown for expenses
  const categorySpend = {};
  for (const t of expenseTx) {
    const cat = t.category_name || t.category || 'General';
    categorySpend[cat] = (categorySpend[cat] || 0) + Number(t.amount || 0);
  }
  const sortedCategories = Object.entries(categorySpend)
    .map(([name, amount]) => ({ name, amount, pct: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  // Merchant spending breakdown
  const merchantSpend = {};
  for (const t of expenseTx) {
    const title = (t.title || 'Unknown').trim();
    merchantSpend[title] = (merchantSpend[title] || 0) + Number(t.amount || 0);
  }
  const topMerchants = Object.entries(merchantSpend)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Emergency Fund Buffer
  const monthlyBurn = totalExpense > 0 ? totalExpense : (liquidCash > 0 ? liquidCash / 6 : 25000);
  const emergencyFundMonths = monthlyBurn > 0 ? Number((liquidCash / monthlyBurn).toFixed(1)) : 0;

  // 50/30/20 Rule Analysis
  // Needs: Rent, Groceries, Utilities, Healthcare, Debt EMI
  // Wants: Dining, Entertainment, Shopping, Travel
  // Savings: Investments, Net Savings
  let needsSpend = monthlyEmi;
  let wantsSpend = 0;

  const needsKeywords = ['rent', 'grocer', 'utilit', 'bill', 'medic', 'health', 'fuel', 'petrol', 'transport', 'educat'];
  for (const [catName, amt] of Object.entries(categorySpend)) {
    const lower = catName.toLowerCase();
    if (needsKeywords.some(kw => lower.includes(kw))) {
      needsSpend += amt;
    } else {
      wantsSpend += amt;
    }
  }

  const needsPct = totalIncome > 0 ? Math.round((needsSpend / totalIncome) * 100) : 50;
  const wantsPct = totalIncome > 0 ? Math.round((wantsSpend / totalIncome) * 100) : 30;
  const savingsPct = totalIncome > 0 ? Math.max(0, savingsRate) : 20;

  // Recurring Subscriptions Burn
  const monthlySubBurn = subscriptions
    .filter(s => s.is_active !== false)
    .reduce((sum, s) => {
      const amt = Number(s.amount || 0);
      if (s.period === 'yearly') return sum + amt / 12;
      if (s.period === 'weekly') return sum + amt * 4.33;
      return sum + amt;
    }, 0);

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    liquidCash,
    totalDebt,
    monthlyEmi,
    totalInvestments,
    sortedCategories,
    topMerchants,
    emergencyFundMonths,
    needsPct,
    wantsPct,
    savingsPct,
    monthlySubBurn: Math.round(monthlySubBurn),
    currentMonthPrefix,
  };
}

/**
 * Intelligent response generator based on user intent and client financial context
 */
export function generateCopilotResponse(query, context) {
  const q = String(query).toLowerCase().trim();
  const c = context || {};

  // 1. Top Spending / Where did my money go?
  if (q.includes('spend the most') || q.includes('top spend') || q.includes('where did') || q.includes('highest expense')) {
    if (!c.sortedCategories || c.sortedCategories.length === 0) {
      return `You haven't recorded any expenses yet this month! Once you log transactions, I will analyze your top categories and merchants.`;
    }
    const topCat = c.sortedCategories[0];
    const merchantList = c.topMerchants && c.topMerchants.length > 0
      ? `\n\n**Top Payees:**\n` + c.topMerchants.slice(0, 3).map(m => `• **${m.name}**: ${money(m.amount)}`).join('\n')
      : '';
    return `Your largest spending category this month is **${topCat.name}**, accounting for **${money(topCat.amount)}** (${topCat.pct}% of all expenses).${merchantList}`;
  }

  // 2. 50/30/20 Rule & Budget Allocation
  if (q.includes('50/30/20') || q.includes('rule') || q.includes('allocation') || q.includes('how is my budget')) {
    const healthRemark = c.savingsPct >= 20
      ? '🟢 **Excellent balance!** You are meeting or exceeding the 20% savings threshold.'
      : '🟡 **Tip:** Your savings rate is below the ideal 20%. Consider curbing non-essential Wants to boost your investment pipeline.';
    return `Here is your current **50/30/20 Budget Breakdown** for this month:

• **Needs (Target 50%):** **${c.needsPct}%** (${money(c.totalExpense * (c.needsPct / 100))})
• **Wants (Target 30%):** **${c.wantsPct}%** (${money(c.totalExpense * (c.wantsPct / 100))})
• **Savings & Investments (Target 20%):** **${c.savingsPct}%** (${money(c.netSavings)})

${healthRemark}`;
  }

  // 3. Emergency Fund & Safety Net
  if (q.includes('emergency') || q.includes('safety net') || q.includes('buffer') || q.includes('liquid')) {
    const status = c.emergencyFundMonths >= 6
      ? `🛡️ **Institutional Grade**: You have **${c.emergencyFundMonths} months** of living expenses in liquid cash (${money(c.liquidCash)}). You are fully protected against macroeconomic shocks.`
      : c.emergencyFundMonths >= 3
      ? `⚖️ **Moderate Buffer**: You have **${c.emergencyFundMonths} months** of expenses saved. Strive to build this up to 6 months (${money(c.totalExpense * 6)}).`
      : `⚠️ **Vulnerability Alert**: Your liquid cash covers only **${c.emergencyFundMonths} months** of expenses. Prioritize routing your next savings into a liquid high-yield account.`;
    return `**Emergency Fund Assessment:**\n${status}`;
  }

  // 4. Debt Payoff & Loans (Snowball / Avalanche)
  if (q.includes('debt') || q.includes('loan') || q.includes('payoff') || q.includes('snowball') || q.includes('avalanche') || q.includes('emi')) {
    if (!c.totalDebt || c.totalDebt === 0) {
      return `🎉 **Debt-Free!** You have zero recorded loans or debt liabilities in FinTrack. Great financial foundation!`;
    }
    return `You currently have **${money(c.totalDebt)}** in total outstanding debt with a monthly EMI commitment of **${money(c.monthlyEmi)}**.

**Recommended Payoff Strategy (Debt Avalanche):**
1. **Target Highest APR First:** Direct all discretionary surplus toward the loan with the highest interest rate while paying minimums on others to minimize lifetime interest drag.
2. **Prepayment Impact:** An extra 10% monthly prepayment on principal can compress a 5-year loan by up to 14 months!`;
  }

  // 5. Savings Rate & Net Cashflow
  if (q.includes('savings rate') || q.includes('net cash') || q.includes('how much did i save') || q.includes('rate')) {
    return `For this month, you earned **${money(c.totalIncome)}** and spent **${money(c.totalExpense)}**, resulting in net savings of **${money(c.netSavings)}**.

Your savings rate is **${c.savingsRate}%**. Institutional financial planning benchmarks recommend maintaining at least a 25% savings rate.`;
  }

  // 6. Subscriptions & Recurring Outflows
  if (q.includes('subscription') || q.includes('recurring') || q.includes('cancel') || q.includes('bills')) {
    return `Your recurring subscription burn is **${money(c.monthlySubBurn)}/month** (${money(c.monthlySubBurn * 12)} annually).

💡 **Proactive Tip:** Review your active memberships in the **Subscriptions** tab. Pausing even one unused streaming or SaaS tool saves ~${money(6000)} per year.`;
  }

  // Default intelligent overview
  return `Here is a real-time summary of your finances:

• **Income:** ${money(c.totalIncome)} | **Expenses:** ${money(c.totalExpense)}
• **Net Savings:** ${money(c.netSavings)} (${c.savingsRate}% rate)
• **Liquid Cash Reserve:** ${money(c.liquidCash)} (${c.emergencyFundMonths} mos buffer)
• **Investments:** ${money(c.totalInvestments)} | **Debt:** ${money(c.totalDebt)}

Try asking:
- *"Where did I spend the most?"*
- *"Analyze my 50/30/20 budget"*
- *"How can I pay off my debt faster?"*
- *"What is my emergency fund buffer?"*`;
}
