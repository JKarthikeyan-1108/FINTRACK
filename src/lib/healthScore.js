/**
 * FinTrack Financial Intelligence Engine
 * Computes comprehensive financial health score (0-100),
 * monthly spending velocity, and contextual AI optimization tips.
 */

export function calculateHealthScore({
  income = 0,
  expenses = 0,
  savings = 0,
  liquidBalance = 0,
  budgets = [],
  subscriptions = [],
  loans = [],
}) {
  const inc = Math.max(0, Number(income || 0));
  const exp = Math.max(0, Number(expenses || 0));
  const sav = Number(savings || (inc - exp));
  const bal = Math.max(0, Number(liquidBalance || 0));

  // 1. Savings Rate Score (0 - 25 pts)
  let savingsScore = 0;
  const savingsRate = inc > 0 ? (sav / inc) * 100 : (sav > 0 ? 30 : 0);
  if (savingsRate >= 35) savingsScore = 25;
  else if (savingsRate >= 25) savingsScore = 21;
  else if (savingsRate >= 15) savingsScore = 16;
  else if (savingsRate >= 5) savingsScore = 11;
  else if (savingsRate > 0) savingsScore = 6;
  else savingsScore = 2;

  // 2. Budget Discipline Score (0 - 25 pts)
  let budgetScore = 16; // default neutral if no budgets configured
  let totalBudgetLimit = 0;
  let totalBudgetSpent = 0;
  if (budgets && budgets.length > 0) {
    budgets.forEach(b => {
      totalBudgetLimit += Number(b.amount || 0);
      totalBudgetSpent += Number(b.spent || b.spent_amount || 0);
    });
    if (totalBudgetLimit > 0) {
      const budgetPct = (totalBudgetSpent / totalBudgetLimit) * 100;
      if (budgetPct <= 80) budgetScore = 25;
      else if (budgetPct <= 95) budgetScore = 21;
      else if (budgetPct <= 100) budgetScore = 17;
      else if (budgetPct <= 115) budgetScore = 10;
      else budgetScore = 4;
    }
  }

  // 3. Emergency Liquidity Runway (0 - 25 pts)
  let runwayMonths = exp > 0 ? bal / exp : (bal > 0 ? 6 : 0);
  let liquidityScore = 0;
  if (runwayMonths >= 6) liquidityScore = 25;
  else if (runwayMonths >= 4) liquidityScore = 20;
  else if (runwayMonths >= 2) liquidityScore = 15;
  else if (runwayMonths >= 1) liquidityScore = 10;
  else liquidityScore = 4;

  // 4. Debt & Fixed Commitments Burden (0 - 25 pts)
  let monthlyDebt = 0;
  if (loans && loans.length > 0) {
    loans.forEach(l => {
      monthlyDebt += Number(l.emi || l.monthly_payment || 0);
    });
  }
  if (subscriptions && subscriptions.length > 0) {
    subscriptions.forEach(s => {
      monthlyDebt += Number(s.amount || 0);
    });
  }
  const dti = inc > 0 ? (monthlyDebt / inc) * 100 : (monthlyDebt > 0 ? 40 : 5);
  let debtScore = 0;
  if (dti <= 15) debtScore = 25;
  else if (dti <= 28) debtScore = 20;
  else if (dti <= 40) debtScore = 14;
  else if (dti <= 50) debtScore = 8;
  else debtScore = 3;

  const totalScore = Math.min(100, Math.max(10, Math.round(savingsScore + budgetScore + liquidityScore + debtScore)));

  // Tier categorization
  let tier = 'Excellent';
  let tone = 'mint';
  let badgeClass = 'badge-pill-mint';
  if (totalScore >= 85) {
    tier = 'Prime Financial Health';
    tone = 'mint';
    badgeClass = 'badge-pill-mint';
  } else if (totalScore >= 70) {
    tier = 'Strong Financial Health';
    tone = 'blue';
    badgeClass = 'badge-pill-blue';
  } else if (totalScore >= 50) {
    tier = 'Moderate - Action Needed';
    tone = 'amber';
    badgeClass = 'badge-pill-amber';
  } else {
    tier = 'High Risk - Attention Needed';
    tone = 'pink';
    badgeClass = 'badge-pill-pink';
  }

  // 5. Monthly Spending Velocity & Pacing
  const now = new Date();
  const dayOfMonth = Math.max(1, now.getDate());
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyRunRate = exp / dayOfMonth;
  const projectedMonthlyExpense = dailyRunRate * daysInMonth;

  let velocityStatus = 'on_track';
  let velocityTitle = 'Spending On Target';
  let velocityTone = 'mint';
  let velocityDesc = `Paced at average ${dailyRunRate > 0 ? 'steady' : 'normal'} daily burn. Projected month-end outflow is within balance.`;

  if (inc > 0 && projectedMonthlyExpense > inc) {
    velocityStatus = 'accelerated';
    velocityTitle = 'Elevated Burn Rate Alert';
    velocityTone = 'pink';
    velocityDesc = `At the current run rate of ₹${Math.round(dailyRunRate).toLocaleString()}/day, projected month-end outflow exceeds monthly inflow.`;
  } else if (totalBudgetLimit > 0 && projectedMonthlyExpense > totalBudgetLimit) {
    velocityStatus = 'warning';
    velocityTitle = 'Budget Velocity Warning';
    velocityTone = 'amber';
    velocityDesc = `Spending pacing is projected to overshoot your active budget targets by month-end.`;
  } else if (savingsRate >= 20) {
    velocityStatus = 'optimal';
    velocityTitle = 'Optimal Wealth Accumulation';
    velocityTone = 'mint';
    velocityDesc = `Excellent pacing. You are conserving capital faster than anticipated this billing cycle.`;
  }

  // 6. Actionable AI Recommendations
  const tips = [];
  if (liquidityScore < 15) {
    tips.push({
      priority: 'high',
      title: 'Bolster Emergency Cushion',
      detail: `Your liquid reserves cover roughly ${runwayMonths.toFixed(1)} months of expenses. Aim for at least 3-6 months in high-yield liquid accounts.`,
    });
  }
  if (savingsScore < 15) {
    tips.push({
      priority: 'medium',
      title: 'Elevate Monthly Savings Rate',
      detail: `Current savings rate is ${Math.max(0, Math.round(savingsRate))}%. Consider setting up automated transfers on paydays to hit a 20%+ target.`,
    });
  }
  if (budgets.length === 0) {
    tips.push({
      priority: 'medium',
      title: 'Establish Category Budgets',
      detail: 'Setting 2-3 spending limits for dining, shopping, or entertainment can immediately boost your financial discipline score.',
    });
  } else if (budgetScore < 16) {
    tips.push({
      priority: 'high',
      title: 'Enforce Budget Ceilings',
      detail: 'One or more category budgets are near or over capacity. Review recent transactions and trim discretionary spending.',
    });
  }
  if (debtScore < 15) {
    tips.push({
      priority: 'high',
      title: 'Prioritize High-Interest Obligations',
      detail: 'Fixed debt and subscriptions are consuming a notable portion of income. Accelerate loan amortization where possible.',
    });
  }
  if (tips.length === 0) {
    tips.push({
      priority: 'low',
      title: 'Consider Index & Mutual Fund SIPs',
      detail: 'Your financial foundation is rock solid. Channel surplus monthly liquidity into long-term wealth compounding.',
    });
  }

  return {
    score: totalScore,
    tier,
    tone,
    badgeClass,
    breakdown: {
      savings: { score: savingsScore, max: 25, label: 'Savings Rate', rate: `${Math.round(savingsRate)}%` },
      budget: { score: budgetScore, max: 25, label: 'Budget Adherence', spent: totalBudgetSpent, limit: totalBudgetLimit },
      liquidity: { score: liquidityScore, max: 25, label: 'Emergency Runway', months: runwayMonths.toFixed(1) },
      debt: { score: debtScore, max: 25, label: 'Debt & Commitments', dti: `${Math.round(dti)}%` },
    },
    velocity: {
      status: velocityStatus,
      title: velocityTitle,
      tone: velocityTone,
      description: velocityDesc,
      dailyRunRate,
      projectedMonthlyExpense,
      daysElapsed: dayOfMonth,
      daysTotal: daysInMonth,
    },
    tips,
  };
}
