/**
 * FinTrack Institutional Portfolio Rebalancing Matrix
 * Analyzes multi-asset allocations (Equity, Debt, Gold, Cash, Real Estate),
 * evaluates allocation drift against target model portfolios, and generates
 * execution-grade rebalancing trades.
 */

import { toMoney } from './finance';

export const MODEL_PORTFOLIOS = {
  balanced: {
    id: 'balanced',
    name: 'Classic Balanced (60/30/10)',
    desc: 'Moderate risk, long-term wealth compounding with volatility buffer.',
    weights: { equity: 60, debt: 30, gold: 5, cash: 5, real_estate: 0 },
  },
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive Growth (80/15/5)',
    desc: 'High equity orientation for long investment horizons (>7 years).',
    weights: { equity: 80, debt: 10, gold: 5, cash: 5, real_estate: 0 },
  },
  conservative: {
    id: 'conservative',
    name: 'Capital Preservation (30/55/15)',
    desc: 'Low volatility, income generation, and high liquidity buffer.',
    weights: { equity: 30, debt: 50, gold: 10, cash: 10, real_estate: 0 },
  },
  all_weather: {
    id: 'all_weather',
    name: 'All-Weather Resilience (40/40/15/5)',
    desc: 'Institutional risk-parity portfolio designed to withstand all economic cycles.',
    weights: { equity: 40, debt: 40, gold: 15, cash: 5, real_estate: 0 },
  },
};

export const ASSET_CLASS_META = {
  equity: { label: 'Equity & Stocks', tone: 'pink', color: '#ec4899', icon: 'TrendingUp' },
  debt: { label: 'Debt & Fixed Income', tone: 'blue', color: '#0ea5e9', icon: 'Landmark' },
  gold: { label: 'Gold & Precious Metals', tone: 'amber', color: '#f59e0b', icon: 'Gem' },
  cash: { label: 'Liquid Cash & Reserves', tone: 'mint', color: '#10b981', icon: 'Banknote' },
  real_estate: { label: 'Real Estate & REITs', tone: 'purple', color: '#8b5cf6', icon: 'Building2' },
};

export function mapInvestmentToAssetClass(inv) {
  const cat = String(inv.category || '').toLowerCase();
  if (cat.includes('stock') || cat.includes('mutual') || cat.includes('equity') || cat.includes('elss')) return 'equity';
  if (cat.includes('gold') || cat.includes('sgb') || cat.includes('silver')) return 'gold';
  if (cat.includes('fixed') || cat.includes('debt') || cat.includes('ppf') || cat.includes('nps') || cat.includes('fd') || cat.includes('bond')) return 'debt';
  if (cat.includes('real') || cat.includes('reit') || cat.includes('property')) return 'real_estate';
  if (cat.includes('cash') || cat.includes('bank') || cat.includes('liquid')) return 'cash';
  return 'equity';
}

export function calculatePortfolioRebalance({
  investments = [],
  cashReserve = 0,
  targetWeights = MODEL_PORTFOLIOS.balanced.weights,
  freshCapital = 0,
} = {}) {
  // 1. Aggregate current holdings by asset class
  const currentHoldings = {
    equity: 0,
    debt: 0,
    gold: 0,
    cash: Number(cashReserve || 0),
    real_estate: 0,
  };

  for (const inv of investments) {
    const assetClass = mapInvestmentToAssetClass(inv);
    const val = Number(inv.current_value || inv.invested_amount || 0);
    currentHoldings[assetClass] = (currentHoldings[assetClass] || 0) + val;
  }

  const currentTotal = Object.values(currentHoldings).reduce((s, v) => s + v, 0);
  const targetTotal = currentTotal + Number(freshCapital || 0);

  // 2. Compute actual weights, target amounts, and drift
  const classes = ['equity', 'debt', 'gold', 'cash', 'real_estate'];
  const breakdown = [];
  const rebalanceActions = [];
  let totalDriftAbsolute = 0;

  for (const key of classes) {
    const curVal = currentHoldings[key] || 0;
    const curPct = currentTotal > 0 ? Number(((curVal / currentTotal) * 100).toFixed(1)) : 0;
    const tgtWeight = Number(targetWeights[key] || 0);
    const tgtVal = Math.round((targetTotal * tgtWeight) / 100);
    const diffVal = tgtVal - curVal;
    const driftPct = Number((curPct - tgtWeight).toFixed(1));

    totalDriftAbsolute += Math.abs(driftPct);

    breakdown.push({
      key,
      label: ASSET_CLASS_META[key].label,
      tone: ASSET_CLASS_META[key].tone,
      color: ASSET_CLASS_META[key].color,
      currentVal: Math.round(curVal),
      currentPct: curPct,
      targetPct: tgtWeight,
      targetVal: tgtVal,
      diffVal: diffVal,
      driftPct: driftPct,
      hasDrift: Math.abs(driftPct) >= 5, // Significant drift threshold
    });

    if (Math.abs(diffVal) >= 1000) {
      if (diffVal > 0) {
        rebalanceActions.push({
          action: 'BUY',
          key,
          label: ASSET_CLASS_META[key].label,
          amount: Math.round(diffVal),
          reason: `Underweight by ${Math.abs(driftPct)}% against target`,
          color: '#10b981',
        });
      } else {
        rebalanceActions.push({
          action: 'TRIM',
          key,
          label: ASSET_CLASS_META[key].label,
          amount: Math.round(Math.abs(diffVal)),
          reason: `Overweight by ${Math.abs(driftPct)}% against target`,
          color: '#ef4444',
        });
      }
    }
  }

  // Sort actions: TRIMS first (free up capital), then BUYS
  rebalanceActions.sort((a, b) => (a.action === 'TRIM' ? -1 : 1));

  return {
    currentTotal: Math.round(currentTotal),
    targetTotal: Math.round(targetTotal),
    freshCapital: Number(freshCapital || 0),
    breakdown,
    rebalanceActions,
    hasSevereDrift: totalDriftAbsolute >= 15,
    rebalanceIndex: Math.max(0, 100 - Math.round(totalDriftAbsolute)),
  };
}
