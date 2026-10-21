import { useState } from 'react';
import {
  Calculator,
  Percent,
  TrendingUp,
  Landmark,
  PiggyBank,
  PieChart,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  ShieldCheck,
  Award,
  Receipt,
  Flame,
} from 'lucide-react';
import {
  Page,
  PageHeader,
  TextInput,
} from '../components/ui/CashewUI';
import { money } from '../lib/format';
import { triggerHaptic } from '../lib/haptics';
import {
  calcEMI,
  simpleInterest,
  compoundAmount,
  sipFutureValue,
  monthlySavingsRequired,
  runMonteCarloSimulation,
} from '../lib/finance';
import {
  compareTaxRegimes,
  analyzeTaxLossHarvesting,
} from '../lib/taxOptimization';

const TABS = [
  { id: 'emi', label: 'Loan EMI', icon: Landmark, desc: 'Amortization & monthly debt obligations' },
  { id: 'sip', label: 'SIP / Wealth', icon: TrendingUp, desc: 'Systematic mutual fund wealth generation' },
  { id: 'tax', label: 'AI Tax & Deductions', icon: ShieldCheck, desc: 'Old vs New Tax Regime comparison (FY 2024-25+), 80C/80D/NPS shields & tax-loss harvesting' },
  { id: 'montecarlo', label: 'Monte Carlo Wealth Sim', icon: Sparkles, desc: 'Probabilistic multi-year wealth path under volatile markets' },
  { id: 'compound', label: 'Compound Interest', icon: Percent, desc: 'Exponential growth with periodic compounding' },
  { id: 'simple', label: 'Simple Interest', icon: Calculator, desc: 'Flat rate debt or fixed return calculations' },
  { id: 'savings', label: 'Savings Goal', icon: PiggyBank, desc: 'Monthly savings required to meet milestone' },
  { id: 'budget', label: '50/30/20 Budget', icon: PieChart, desc: 'Standard balanced personal budget allocation' },
];

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState('emi');

  // 1. EMI state
  const [emiPrincipal, setEmiPrincipal] = useState('500000');
  const [emiRate, setEmiRate] = useState('8.5');
  const [emiTenureYears, setEmiTenureYears] = useState('5');

  // 2. SIP state
  const [sipMonthly, setSipMonthly] = useState('5000');
  const [sipRate, setSipRate] = useState('12');
  const [sipYears, setSipYears] = useState('10');

  // 3. Compound Interest state
  const [ciPrincipal, setCiPrincipal] = useState('100000');
  const [ciRate, setCiRate] = useState('7.5');
  const [ciYears, setCiYears] = useState('5');
  const [ciFreq, setCiFreq] = useState('4'); // quarterly

  // 4. Simple Interest state
  const [siPrincipal, setSiPrincipal] = useState('50000');
  const [siRate, setSiRate] = useState('6');
  const [siYears, setSiYears] = useState('3');

  // 5. Savings Goal state
  const [goalTarget, setGoalTarget] = useState('200000');
  const [goalSaved, setGoalSaved] = useState('50000');
  const [goalMonths, setGoalMonths] = useState('12');

  // 6. Monthly Budget state (50/30/20)
  const [monthlyIncome, setMonthlyIncome] = useState('75000');

  // 7. Monte Carlo Wealth Simulator state
  const [mcInitial, setMcInitial] = useState('500000');
  const [mcMonthly, setMcMonthly] = useState('15000');
  const [mcYears, setMcYears] = useState('10');
  const [mcReturn, setMcReturn] = useState('12');
  const [mcVol, setMcVol] = useState('15');
  const [mcInflation, setMcInflation] = useState('6');

  // 8. Tax Optimization state
  const [taxGrossIncome, setTaxGrossIncome] = useState('1200000');
  const [taxIsSalaried, setTaxIsSalaried] = useState(true);
  const [tax80C, setTax80C] = useState('150000');
  const [tax80D, setTax80D] = useState('25000');
  const [tax80CCD, setTax80CCD] = useState('50000');
  const [taxSec24, setTaxSec24] = useState('0');
  const [taxHra, setTaxHra] = useState('0');
  const [taxOther, setTaxOther] = useState('0');
  const [simCapitalGain, setSimCapitalGain] = useState('180000');
  const [simHarvestLoss, setSimHarvestLoss] = useState('40000');

  // Calculations
  // Monte Carlo
  const mc = runMonteCarloSimulation({
    initialInvestment: Number(mcInitial || 0),
    monthlyContribution: Number(mcMonthly || 0),
    years: Number(mcYears || 10),
    expectedReturn: Number(mcReturn || 12),
    volatility: Number(mcVol || 15),
    inflation: Number(mcInflation || 6),
    simulationsCount: 150,
  });
  // EMI
  const emiMonths = Math.max(1, Math.round(Number(emiTenureYears || 0) * 12));
  const emiVal = calcEMI(emiPrincipal, emiRate, emiMonths);
  const emiTotalPayable = Math.round(emiVal * emiMonths * 100) / 100;
  const emiTotalInterest = Math.max(0, Math.round((emiTotalPayable - Number(emiPrincipal || 0)) * 100) / 100);
  const emiPrincipalRatio = emiTotalPayable > 0 ? (Number(emiPrincipal || 0) / emiTotalPayable) * 100 : 50;

  // SIP
  const sipTotalMonths = Math.max(1, Math.round(Number(sipYears || 0) * 12));
  const sipInvested = Math.round(Number(sipMonthly || 0) * sipTotalMonths * 100) / 100;
  const sipMaturity = sipFutureValue(sipMonthly, sipRate, sipTotalMonths);
  const sipWealthGain = Math.max(0, Math.round((sipMaturity - sipInvested) * 100) / 100);
  const sipInvestedRatio = sipMaturity > 0 ? (sipInvested / sipMaturity) * 100 : 50;

  // Compound Interest
  const ciMaturity = compoundAmount(ciPrincipal, ciRate, ciYears, ciFreq);
  const ciInterest = Math.max(0, Math.round((ciMaturity - Number(ciPrincipal || 0)) * 100) / 100);
  const ciPrincipalRatio = ciMaturity > 0 ? (Number(ciPrincipal || 0) / ciMaturity) * 100 : 50;

  // Simple Interest
  const siInterest = simpleInterest(siPrincipal, siRate, siYears);
  const siTotal = Math.round((Number(siPrincipal || 0) + siInterest) * 100) / 100;
  const siPrincipalRatio = siTotal > 0 ? (Number(siPrincipal || 0) / siTotal) * 100 : 50;

  // Savings Goal
  const goalMonthlyNeed = monthlySavingsRequired(goalTarget, goalSaved, goalMonths);
  const goalRemaining = Math.max(0, Number(goalTarget || 0) - Number(goalSaved || 0));
  const goalSavedPct = Number(goalTarget || 0) > 0 ? Math.min(100, Math.round((Number(goalSaved || 0) / Number(goalTarget || 0)) * 100)) : 0;

  // Budget 50/30/20
  const incomeNum = Math.max(0, Number(monthlyIncome || 0));
  const needs = Math.round(incomeNum * 0.5);
  const wants = Math.round(incomeNum * 0.3);
  const savings = Math.round(incomeNum * 0.2);

  // 8. Tax Optimization calculations
  const taxComparison = compareTaxRegimes(
    Number(taxGrossIncome || 0),
    {
      sec80C: Number(tax80C || 0),
      sec80D: Number(tax80D || 0),
      sec80CCD: Number(tax80CCD || 0),
      homeLoanSec24: Number(taxSec24 || 0),
      hraExemption: Number(taxHra || 0),
      otherDeductions: Number(taxOther || 0),
    },
    taxIsSalaried
  );

  const taxLossHarvestSim = analyzeTaxLossHarvesting([
    { name: 'Simulated Gain Position', invested_amount: 100000, current_value: 100000 + Number(simCapitalGain || 0) },
    { name: 'Simulated Loss Position', invested_amount: 100000, current_value: 100000 - Number(simHarvestLoss || 0) },
  ]);

  const activeTabMeta = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <Page>
      <PageHeader
        eyebrow="Calculators & Engines"
        title="Financial Calculators"
        subtitle="High-precision financial engines for loans, wealth accumulation, and budget planning"
        action={
          <span className="badge-pill badge-pill-mint" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <Sparkles size={14} /> High-Precision Formulas
          </span>
        }
      />

      {/* Tabs Toolbar */}
      <div
        className="filter-toolbar"
        style={{
          padding: '6px',
          background: 'var(--surface-strong)',
          borderRadius: 14,
          border: '1px solid var(--border)',
          marginBottom: 20,
          gap: 6,
          overflowX: 'auto',
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab(id);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 16px',
                borderRadius: 10,
                border: active ? '1px solid var(--border-focus)' : '1px solid transparent',
                background: active ? 'var(--btn-primary-bg, var(--brand-primary))' : 'transparent',
                color: active ? 'var(--btn-primary-color, #ffffff)' : 'var(--text-muted)',
                fontWeight: active ? 700 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Subtitle description for the active calculator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        <Info size={14} color="var(--brand-primary)" />
        <span>{activeTabMeta.desc}</span>
      </div>

      <div key={activeTab} className="tab-transition-container">
        {/* 1. Loan EMI Calculator */}
        {activeTab === 'emi' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Inputs Card */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Landmark size={17} color="var(--brand-primary)" /> Loan Parameters
              </div>
              <span className="badge-pill badge-pill-neutral">Fixed Rate</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <TextInput
                  label="Loan Amount (₹)"
                  type="number"
                  value={emiPrincipal}
                  onChange={e => setEmiPrincipal(e.target.value)}
                  placeholder="e.g. 500000"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[100000, 300000, 500000, 1000000, 2500000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEmiPrincipal(String(val))}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      ₹{val / 100000}L
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <TextInput
                  label="Annual Interest Rate (%)"
                  type="number"
                  step="0.1"
                  value={emiRate}
                  onChange={e => setEmiRate(e.target.value)}
                  placeholder="e.g. 8.5"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {['7.5', '8.5', '9.5', '11.0', '13.5'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEmiRate(r)}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <TextInput
                  label="Loan Tenure (Years)"
                  type="number"
                  step="0.5"
                  value={emiTenureYears}
                  onChange={e => setEmiTenureYears(e.target.value)}
                  placeholder="e.g. 5"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {['1', '3', '5', '7', '10', '15', '20'].map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setEmiTenureYears(y)}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      {y}Y
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Breakdown Card */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <CheckCircle2 size={17} color="var(--status-positive)" /> Amortization Summary
              </div>
              <span className="badge-pill badge-pill-mint">{emiMonths} Months</span>
            </div>
            <div className="data-card-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Equated Monthly Installment (EMI)
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--status-positive)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {money(emiVal)}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: 2 }}>
                  Payable each month for {emiTenureYears} years
                </div>
              </div>

              {/* Progress split bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: 'var(--status-positive)' }}>Principal: {Math.round(emiPrincipalRatio)}%</span>
                  <span style={{ color: 'var(--status-negative)' }}>Interest: {Math.round(100 - emiPrincipalRatio)}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-danger-subtle, rgba(180, 35, 24, 0.25))', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${emiPrincipalRatio}%`, background: 'var(--status-positive)', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Principal Loan
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {money(emiPrincipal)}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Interest
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: '#f43f5e', fontVariantNumeric: 'tabular-nums' }}>
                    {money(emiTotalInterest)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: '14px 18px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderRadius: 10,
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Total Amount Payable</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Principal + All Accrued Interest</div>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                  {money(emiTotalPayable)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SIP Calculator */}
      {activeTab === 'sip' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <TrendingUp size={17} color="#0ea5e9" /> SIP Investment Parameters
              </div>
              <span className="badge-pill badge-pill-blue">Compounded Monthly</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <TextInput
                  label="Monthly Investment (₹)"
                  type="number"
                  value={sipMonthly}
                  onChange={e => setSipMonthly(e.target.value)}
                  placeholder="e.g. 5000"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[1000, 2500, 5000, 10000, 25000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSipMonthly(String(val))}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      ₹{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <TextInput
                  label="Expected Annual Return (%)"
                  type="number"
                  step="0.5"
                  value={sipRate}
                  onChange={e => setSipRate(e.target.value)}
                  placeholder="e.g. 12"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {['8', '10', '12', '14', '15', '18'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSipRate(r)}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <TextInput
                  label="Time Horizon (Years)"
                  type="number"
                  value={sipYears}
                  onChange={e => setSipYears(e.target.value)}
                  placeholder="e.g. 10"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {['3', '5', '10', '15', '20', '25', '30'].map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setSipYears(y)}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      {y}Y
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Sparkles size={17} color="#0ea5e9" /> Projected Wealth Accumulation
              </div>
              <span className="badge-pill badge-pill-mint">{sipTotalMonths} Installments</span>
            </div>
            <div className="data-card-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Projected Maturity Portfolio
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0ea5e9', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {money(sipMaturity)}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: 2 }}>
                  Based on ₹{Number(sipMonthly).toLocaleString('en-IN')}/mo at {sipRate}% p.a.
                </div>
              </div>

              {/* Progress split bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: '#0ea5e9' }}>Invested: {Math.round(sipInvestedRatio)}%</span>
                  <span style={{ color: '#10b981' }}>Returns: {Math.round(100 - sipInvestedRatio)}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(16, 185, 129, 0.25)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${sipInvestedRatio}%`, background: '#0ea5e9', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Invested
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {money(sipInvested)}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Estimated Gains
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                    +{money(sipWealthGain)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: '0.76rem', color: 'var(--text-soft)', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Mutual fund investments are subject to market risks. Calculations assume monthly compounding without capital gains taxation.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2b. Monte Carlo Wealth Simulator */}
      {activeTab === 'montecarlo' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          {/* Inputs Column */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Sparkles size={17} color="#8b5cf6" /> Simulation Assumptions & Drivers
              </div>
              <span className="badge-pill badge-pill-purple">150 Paths</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <TextInput
                  label="Initial Portfolio Capital (₹)"
                  type="number"
                  value={mcInitial}
                  onChange={e => setMcInitial(e.target.value)}
                  placeholder="e.g. 500000"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[100000, 250000, 500000, 1000000, 2500000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMcInitial(String(val))}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      ₹{val >= 100000 ? `${val / 100000}L` : `${val / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <TextInput
                  label="Monthly Contribution / SIP (₹)"
                  type="number"
                  value={mcMonthly}
                  onChange={e => setMcMonthly(e.target.value)}
                  placeholder="e.g. 15000"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[5000, 10000, 15000, 25000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMcMonthly(String(val))}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      ₹{val >= 1000 ? `${val / 1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <TextInput
                    label="Horizon (Years)"
                    type="number"
                    value={mcYears}
                    onChange={e => setMcYears(e.target.value)}
                    placeholder="10"
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {['5', '10', '15', '20'].map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setMcYears(y)}
                        className="badge-pill badge-pill-neutral"
                        style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                      >
                        {y}Y
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <TextInput
                    label="Expected Return (%)"
                    type="number"
                    step="0.5"
                    value={mcReturn}
                    onChange={e => setMcReturn(e.target.value)}
                    placeholder="12"
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {['10', '12', '14', '16'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setMcReturn(r)}
                        className="badge-pill badge-pill-neutral"
                        style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <TextInput
                  label="Market Volatility (σ %)"
                  type="number"
                  step="1"
                  value={mcVol}
                  onChange={e => setMcVol(e.target.value)}
                  placeholder="15"
                />
                <TextInput
                  label="Annual Inflation (%)"
                  type="number"
                  step="0.5"
                  value={mcInflation}
                  onChange={e => setMcInflation(e.target.value)}
                  placeholder="6"
                />
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Runs geometric Brownian motion paths accounting for volatility drag, market drawdowns, and real purchasing power erosion.
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <TrendingUp size={17} color="#10b981" />
                <span>Probabilistic Wealth Trajectory</span>
              </div>
              <span className="badge-pill badge-pill-mint">Year {mcYears} Projection</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Hero: Median Outcome */}
              <div
                style={{
                  background: 'var(--surface-strong)',
                  border: '1px solid var(--border)',
                  padding: '18px',
                  borderRadius: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Median Projected Wealth (50th Percentile)
                  </span>
                  <span className="badge-pill badge-pill-mint">Most Likely</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--mint)', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                  {money(mc.medianFinal)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Real purchasing power in today's money: <strong style={{ color: 'var(--text)' }}>{money(mc.realPurchasingPower)}</strong> (-{mc.inflationErosionPct}% inflation decay)
                </div>
              </div>

              {/* Percentile Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '12px 14px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Bull Run (90th %)
                    </span>
                    <span className="badge-pill badge-pill-purple" style={{ fontSize: '0.65rem' }}>Top 10%</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8b5cf6', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {money(mc.bullFinal)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Ideal market cycle
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '12px 14px', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Bear Floor (10th %)
                    </span>
                    <span className="badge-pill badge-pill-amber" style={{ fontSize: '0.65rem' }}>Worst 10%</span>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {money(mc.bearFinal)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Recession & crash floor
                  </div>
                </div>
              </div>

              {/* Capital & Multiplier Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--surface-strong)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Capital Invested
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {money(mc.totalInvested)}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-strong)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Expected Wealth Multiple
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 2, color: '#0ea5e9', fontVariantNumeric: 'tabular-nums' }}>
                    {(mc.medianFinal / (mc.totalInvested || 1)).toFixed(1)}x Multiple
                  </div>
                </div>
              </div>

              {/* Progression Milestones */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Multi-Year Milestone Progression
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                  {mc.yearlyPercentiles.filter((p, i) => i > 0 && (i === 1 || i === 3 || i === 5 || i === Number(mcYears) || i === Math.round(Number(mcYears)/2))).map(p => (
                    <div key={p.year} style={{ background: 'var(--surface-strong)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text)' }}>{p.label}</div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#10b981', marginTop: 2 }}>{money(p.median, true)}</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{money(p.bear, true)} – {money(p.bull, true)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Compound Interest Calculator */}
      {activeTab === 'compound' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Percent size={17} color="#8b5cf6" /> Fixed Deposit / Lump Sum Inputs
              </div>
              <span className="badge-pill badge-pill-purple">Compound Engine</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TextInput
                label="Initial Principal (₹)"
                type="number"
                value={ciPrincipal}
                onChange={e => setCiPrincipal(e.target.value)}
                placeholder="e.g. 100000"
              />
              <TextInput
                label="Annual Interest Rate (%)"
                type="number"
                step="0.1"
                value={ciRate}
                onChange={e => setCiRate(e.target.value)}
                placeholder="e.g. 7.5"
              />
              <TextInput
                label="Duration (Years)"
                type="number"
                step="0.5"
                value={ciYears}
                onChange={e => setCiYears(e.target.value)}
                placeholder="e.g. 5"
              />
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Compounding Frequency
                </label>
                <select
                  value={ciFreq}
                  onChange={e => setCiFreq(e.target.value)}
                  className="filter-select"
                  style={{ width: '100%' }}
                >
                  <option value="1">Annually (1 / year)</option>
                  <option value="2">Semi-Annually (2 / year)</option>
                  <option value="4">Quarterly (4 / year - Standard FD)</option>
                  <option value="12">Monthly (12 / year)</option>
                  <option value="365">Daily (365 / year)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Sparkles size={17} color="#8b5cf6" /> Compound Growth Result
              </div>
              <span className="badge-pill badge-pill-purple">{ciYears} Years</span>
            </div>
            <div className="data-card-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Maturity Value
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#8b5cf6', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {money(ciMaturity)}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: 2 }}>
                  Compounded {ciFreq === '4' ? 'quarterly' : ciFreq === '12' ? 'monthly' : ciFreq === '365' ? 'daily' : 'annually'} at {ciRate}%
                </div>
              </div>

              {/* Progress split bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Principal: {Math.round(ciPrincipalRatio)}%</span>
                  <span style={{ color: '#8b5cf6' }}>Interest: {Math.round(100 - ciPrincipalRatio)}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(139, 92, 246, 0.25)', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${ciPrincipalRatio}%`, background: 'var(--border-strong)', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Initial Deposit
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {money(ciPrincipal)}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Interest Earned
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: '#8b5cf6', fontVariantNumeric: 'tabular-nums' }}>
                    +{money(ciInterest)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Simple Interest Calculator */}
      {activeTab === 'simple' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Calculator size={17} color="#f59e0b" /> Simple Interest Parameters
              </div>
              <span className="badge-pill badge-pill-amber">Flat Rate</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TextInput
                label="Principal Amount (₹)"
                type="number"
                value={siPrincipal}
                onChange={e => setSiPrincipal(e.target.value)}
                placeholder="e.g. 50000"
              />
              <TextInput
                label="Annual Rate (%)"
                type="number"
                step="0.1"
                value={siRate}
                onChange={e => setSiRate(e.target.value)}
                placeholder="e.g. 6.0"
              />
              <TextInput
                label="Time Period (Years)"
                type="number"
                step="0.5"
                value={siYears}
                onChange={e => setSiYears(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
          </div>

          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <CheckCircle2 size={17} color="#f59e0b" /> Flat Interest Summary
              </div>
              <span className="badge-pill badge-pill-amber">{siYears} Years</span>
            </div>
            <div className="data-card-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Recoverable / Payable
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f59e0b', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {money(siTotal)}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: 2 }}>
                  Flat formula: (P × R × T) / 100
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Principal
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {money(siPrincipal)}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Simple Interest
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                    +{money(siInterest)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Savings Goal Calculator */}
      {activeTab === 'savings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <PiggyBank size={17} color="#10b981" /> Target Savings Parameters
              </div>
              <span className="badge-pill badge-pill-mint">Milestone Planner</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <TextInput
                label="Goal Target Amount (₹)"
                type="number"
                value={goalTarget}
                onChange={e => setGoalTarget(e.target.value)}
                placeholder="e.g. 200000"
              />
              <TextInput
                label="Already Saved (₹)"
                type="number"
                value={goalSaved}
                onChange={e => setGoalSaved(e.target.value)}
                placeholder="e.g. 50000"
              />
              <TextInput
                label="Months Remaining to Deadline"
                type="number"
                value={goalMonths}
                onChange={e => setGoalMonths(e.target.value)}
                placeholder="e.g. 12"
              />
            </div>
          </div>

          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Sparkles size={17} color="#10b981" /> Required Savings Trajectory
              </div>
              <span className="badge-pill badge-pill-mint">{goalMonths} Months</span>
            </div>
            <div className="data-card-body">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Monthly Savings Needed
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#10b981', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {money(goalMonthlyNeed)}
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}> / mo</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', marginTop: 2 }}>
                  Set aside monthly to meet target by deadline
                </div>
              </div>

              {/* Progress split bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 600, marginBottom: 6 }}>
                  <span style={{ color: '#10b981' }}>Current Progress: {goalSavedPct}%</span>
                  <span style={{ color: 'var(--text-muted)' }}>Deficit: {100 - goalSavedPct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-strong)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${goalSavedPct}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Remaining to Save
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {money(goalRemaining)}
                  </div>
                </div>
                <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Total Goal Target
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                    {money(goalTarget)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. 50/30/20 Budget Calculator */}
      {activeTab === 'budget' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <PieChart size={17} color="#0ea5e9" /> Monthly Income Input
              </div>
              <span className="badge-pill badge-pill-blue">Golden Ratio Rule</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <TextInput
                  label="Monthly Net Take-Home Pay (₹)"
                  type="number"
                  value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)}
                  placeholder="e.g. 75000"
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[30000, 50000, 75000, 100000, 150000, 250000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMonthlyIncome(String(val))}
                      className="badge-pill badge-pill-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      ₹{val / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, background: 'var(--surface-strong)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                The <strong>50/30/20 budget framework</strong> allocates after-tax income into:
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  <li><strong>50% Needs:</strong> Rent, groceries, utilities, debt minimums</li>
                  <li><strong>30% Wants:</strong> Dining out, vacations, hobbies, subscriptions</li>
                  <li><strong>20% Savings:</strong> Emergency funds, SIPs, extra debt prepayment</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Sparkles size={17} color="#10b981" /> Balanced Envelope Allocation
              </div>
              <span className="badge-pill badge-pill-mint">100% Distributed</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Needs card */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '14px 18px',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge-pill badge-pill-mint">50%</span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>Essential Needs</strong>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                    {money(needs)}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Rent, utilities, groceries, healthcare, transit, basic phone and loan EMIs.
                </div>
              </div>

              {/* Wants card */}
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  padding: '14px 18px',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge-pill badge-pill-amber">30%</span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>Discretionary Wants</strong>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
                    {money(wants)}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Dining, OTT entertainment, shopping, weekend trips, and lifestyle upgrades.
                </div>
              </div>

              {/* Savings card */}
              <div
                style={{
                  background: 'rgba(14, 165, 233, 0.08)',
                  border: '1px solid rgba(14, 165, 233, 0.25)',
                  padding: '14px 18px',
                  borderRadius: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge-pill badge-pill-blue">20%</span>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>Savings & Wealth</strong>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0ea5e9', fontVariantNumeric: 'tabular-nums' }}>
                    {money(savings)}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Mutual fund SIPs, emergency funds, PPF, index investing, and rapid debt payoff.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* 8. AI Tax & Deductions Engine */}
        {activeTab === 'tax' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {/* Left Inputs Column */}
            <div className="data-card card-stagger">
              <div className="data-card-header" style={{ background: 'var(--surface-strong)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={18} color="#10b981" />
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>Income & Tax Profile</strong>
                </div>
                <span className="badge-pill badge-pill-mint" style={{ fontSize: '0.72rem' }}>
                  FY 2024-25 / 2025-26
                </span>
              </div>

              <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <TextInput
                    label="Annual Gross Salary / CTC (₹)"
                    type="number"
                    value={taxGrossIncome}
                    onChange={e => setTaxGrossIncome(e.target.value)}
                    placeholder="e.g. 1200000"
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {[750000, 1000000, 1200000, 1500000, 2000000, 3000000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTaxGrossIncome(String(val))}
                        className="badge-pill badge-pill-neutral"
                        style={{ cursor: 'pointer', border: '1px solid var(--border)' }}
                      >
                        ₹{(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                    Employment Status
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setTaxIsSalaried(true)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: taxIsSalaried ? '1px solid #10b981' : '1px solid var(--border)',
                        background: taxIsSalaried ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface)',
                        color: taxIsSalaried ? '#10b981' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Salaried Employee
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxIsSalaried(false)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: !taxIsSalaried ? '1px solid #10b981' : '1px solid var(--border)',
                        background: !taxIsSalaried ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface)',
                        color: !taxIsSalaried ? '#10b981' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Self-Employed / Freelancer
                    </button>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {taxIsSalaried ? 'Eligible for ₹75,000 Standard Deduction (New Regime) or ₹50,000 (Old Regime).' : 'Standard deduction not applicable for non-salaried business income.'}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Receipt size={15} color="#0ea5e9" />
                    <span>Itemized Deductions (Applicable for Old Regime)</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <TextInput
                        label="Section 80C (PPF, EPF, ELSS Mutual Funds, Life Ins) [Max ₹1.5L]"
                        type="number"
                        value={tax80C}
                        onChange={e => setTax80C(e.target.value)}
                        placeholder="e.g. 150000"
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {['0', '75000', '150000'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setTax80C(val)}
                            className="badge-pill badge-pill-neutral"
                            style={{ cursor: 'pointer', border: '1px solid var(--border)', fontSize: '0.72rem' }}
                          >
                            ₹{Number(val) / 1000}k
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <TextInput
                        label="Section 80D (Health Insurance for Self & Parents) [Max ₹75k]"
                        type="number"
                        value={tax80D}
                        onChange={e => setTax80D(e.target.value)}
                        placeholder="e.g. 25000"
                      />
                    </div>

                    <div>
                      <TextInput
                        label="Section 80CCD(1B) NPS Exclusive Tier-1 [Max ₹50k]"
                        type="number"
                        value={tax80CCD}
                        onChange={e => setTax80CCD(e.target.value)}
                        placeholder="e.g. 50000"
                      />
                    </div>

                    <div>
                      <TextInput
                        label="Section 24 Home Loan Interest (Self-Occupied) [Max ₹2L]"
                        type="number"
                        value={taxSec24}
                        onChange={e => setTaxSec24(e.target.value)}
                        placeholder="e.g. 150000"
                      />
                    </div>

                    <div>
                      <TextInput
                        label="HRA Exemption / Rent Paid (Sec 10(13A)) (₹)"
                        type="number"
                        value={taxHra}
                        onChange={e => setTaxHra(e.target.value)}
                        placeholder="e.g. 120000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Results & Optimization Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Winner Recommendation Banner */}
              <div
                className="data-card card-stagger"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  padding: '20px 24px',
                  borderRadius: 14,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Award size={22} color={taxComparison.recommendedRegime === 'new' ? 'var(--mint)' : 'var(--blue)'} />
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text)' }}>
                      {taxComparison.recommendedRegime === 'new' ? 'New Tax Regime Wins' : 'Old Tax Regime Wins'}
                    </strong>
                  </div>
                  <span className={`badge-pill ${taxComparison.recommendedRegime === 'new' ? 'badge-pill-mint' : 'badge-pill-blue'}`} style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 800 }}>
                    👑 Saves {money(taxComparison.taxSavings)} / year
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {taxComparison.recommendedRegime === 'new'
                    ? `Choosing the New Tax Regime reduces your tax liability by ${money(taxComparison.taxSavings)} annually (${money(Math.round(taxComparison.taxSavings / 12))}/mo) with lower slab rates and a ₹75,000 standard deduction.`
                    : `Your total deductions (${money(taxComparison.oldRegime.totalDeductions)}) exceed the threshold, making the Old Regime more beneficial by ${money(taxComparison.taxSavings)} annually.`}
                </p>
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {/* New Regime Card */}
                <div
                  className="data-card"
                  style={{
                    border: taxComparison.recommendedRegime === 'new' ? '2px solid #10b981' : '1px solid var(--border)',
                    background: 'var(--surface-strong)',
                  }}
                >
                  <div className="data-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>New Regime (Default)</strong>
                    {taxComparison.recommendedRegime === 'new' && (
                      <span className="badge-pill badge-pill-mint" style={{ fontSize: '0.72rem' }}>Recommended</span>
                    )}
                  </div>
                  <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Annual Tax:</span>
                      <strong style={{ fontSize: '1.15rem', color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                        {money(taxComparison.newRegime.totalTax)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Monthly TDS Outflow:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                        {money(taxComparison.newRegime.monthlyTax)}/mo
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Take-Home Pay:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0ea5e9' }}>
                        {money(taxComparison.newRegime.takeHomeMonthly)}/mo
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Effective Tax Rate:</span>
                      <span className="badge-pill badge-pill-neutral" style={{ fontSize: '0.75rem' }}>
                        {taxComparison.newRegime.effectiveRate}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Std. Deduction:</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
                        {money(taxComparison.newRegime.standardDeduction)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Old Regime Card */}
                <div
                  className="data-card"
                  style={{
                    border: taxComparison.recommendedRegime === 'old' ? '2px solid #3b82f6' : '1px solid var(--border)',
                    background: 'var(--surface-strong)',
                  }}
                >
                  <div className="data-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Old Regime (Itemized)</strong>
                    {taxComparison.recommendedRegime === 'old' && (
                      <span className="badge-pill badge-pill-blue" style={{ fontSize: '0.72rem' }}>Recommended</span>
                    )}
                  </div>
                  <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Annual Tax:</span>
                      <strong style={{ fontSize: '1.15rem', color: '#3b82f6', fontVariantNumeric: 'tabular-nums' }}>
                        {money(taxComparison.oldRegime.totalTax)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Monthly TDS Outflow:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                        {money(taxComparison.oldRegime.monthlyTax)}/mo
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Take-Home Pay:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0ea5e9' }}>
                        {money(taxComparison.oldRegime.takeHomeMonthly)}/mo
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Effective Tax Rate:</span>
                      <span className="badge-pill badge-pill-neutral" style={{ fontSize: '0.75rem' }}>
                        {taxComparison.oldRegime.effectiveRate}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Deductions Claimed:</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
                        {money(taxComparison.oldRegime.totalDeductions)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Strategic Tax Recommendations */}
              <div className="data-card" style={{ background: 'var(--surface-strong)' }}>
                <div className="data-card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#10b981" />
                  <strong>AI Copilot Tax Optimization Recommendations</strong>
                </div>
                <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {taxComparison.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                          {rec.title}
                        </span>
                        {rec.potentialSaving > 0 && (
                          <span className="badge-pill badge-pill-mint" style={{ fontSize: '0.74rem' }}>
                            Save up to {money(rec.potentialSaving)}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {rec.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capital Gains & Tax-Loss Harvesting Simulator */}
              <div className="data-card" style={{ background: 'var(--surface-strong)' }}>
                <div className="data-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flame size={16} color="#f59e0b" />
                    <strong>Capital Gains & Tax-Loss Harvesting Simulator</strong>
                  </div>
                  <span className="badge-pill badge-pill-amber" style={{ fontSize: '0.72rem' }}>
                    Budget 2024 (12.5% LTCG / 20% STCG)
                  </span>
                </div>
                <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <TextInput
                      label="Realized Equity Capital Gain (₹)"
                      type="number"
                      value={simCapitalGain}
                      onChange={e => setSimCapitalGain(e.target.value)}
                      placeholder="e.g. 180000"
                    />
                    <TextInput
                      label="Unrealized Loss to Harvest (₹)"
                      type="number"
                      value={simHarvestLoss}
                      onChange={e => setSimHarvestLoss(e.target.value)}
                      placeholder="e.g. 40000"
                    />
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text)' }}>
                        Tax Shield from Harvesting Losses
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Offsetting capital losses against gains before March 31 locks tax credits.
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b' }}>
                        {money(taxLossHarvestSim.totalHarvestableTaxSaving)}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Estimated Tax Saved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
