import { useState } from 'react';
import {
  Calculator,
  Percent,
  TrendingUp,
  Landmark,
  PiggyBank,
  PieChart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Card,
  Page,
  PageHeader,
  TextInput,
} from '../components/ui/CashewUI';
import { money } from '../lib/format';
import {
  calcEMI,
  simpleInterest,
  compoundAmount,
  sipFutureValue,
  monthlySavingsRequired,
} from '../lib/finance';

const TABS = [
  { id: 'emi', label: 'Loan EMI', icon: Landmark },
  { id: 'sip', label: 'SIP / Mutual Fund', icon: TrendingUp },
  { id: 'compound', label: 'Compound Interest', icon: Percent },
  { id: 'simple', label: 'Simple Interest', icon: Calculator },
  { id: 'savings', label: 'Savings Goal', icon: PiggyBank },
  { id: 'budget', label: '50/30/20 Budget', icon: PieChart },
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

  // Calculations
  // EMI
  const emiMonths = Math.max(1, Math.round(Number(emiTenureYears || 0) * 12));
  const emiVal = calcEMI(emiPrincipal, emiRate, emiMonths);
  const emiTotalPayable = Math.round(emiVal * emiMonths * 100) / 100;
  const emiTotalInterest = Math.max(0, Math.round((emiTotalPayable - Number(emiPrincipal || 0)) * 100) / 100);

  // SIP
  const sipTotalMonths = Math.max(1, Math.round(Number(sipYears || 0) * 12));
  const sipInvested = Math.round(Number(sipMonthly || 0) * sipTotalMonths * 100) / 100;
  const sipMaturity = sipFutureValue(sipMonthly, sipRate, sipTotalMonths);
  const sipWealthGain = Math.max(0, Math.round((sipMaturity - sipInvested) * 100) / 100);

  // Compound Interest
  const ciMaturity = compoundAmount(ciPrincipal, ciRate, ciYears, ciFreq);
  const ciInterest = Math.max(0, Math.round((ciMaturity - Number(ciPrincipal || 0)) * 100) / 100);

  // Simple Interest
  const siInterest = simpleInterest(siPrincipal, siRate, siYears);
  const siTotal = Math.round((Number(siPrincipal || 0) + siInterest) * 100) / 100;

  // Savings Goal
  const goalMonthlyNeed = monthlySavingsRequired(goalTarget, goalSaved, goalMonths);
  const goalRemaining = Math.max(0, Number(goalTarget || 0) - Number(goalSaved || 0));

  // Budget 50/30/20
  const incomeNum = Math.max(0, Number(monthlyIncome || 0));
  const needs = Math.round(incomeNum * 0.5);
  const wants = Math.round(incomeNum * 0.3);
  const savings = Math.round(incomeNum * 0.2);

  return (
    <Page>
      <PageHeader
        title="Financial Calculators"
        subtitle="Empower your decisions with precise financial planning tools"
        action={
          <span style={{ fontSize: 13, color: '#66706a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color="#1b7a4a" /> Decimal-safe & Verified
          </span>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 20,
                border: active ? '1px solid #1b7a4a' : '1px solid #d2ded5',
                background: active ? '#1b7a4a' : '#fff',
                color: active ? '#fff' : '#2b332f',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* 1. Loan EMI Calculator */}
      {activeTab === 'emi' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card title="Loan Inputs">
            <TextInput
              label="Loan Amount (₹)"
              type="number"
              value={emiPrincipal}
              onChange={e => setEmiPrincipal(e.target.value)}
              placeholder="e.g. 500000"
            />
            <TextInput
              label="Annual Interest Rate (%)"
              type="number"
              step="0.1"
              value={emiRate}
              onChange={e => setEmiRate(e.target.value)}
              placeholder="e.g. 8.5"
            />
            <TextInput
              label="Tenure (Years)"
              type="number"
              step="0.5"
              value={emiTenureYears}
              onChange={e => setEmiTenureYears(e.target.value)}
              placeholder="e.g. 5"
            />
          </Card>

          <Card title="Loan Breakdown">
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: '#66706a', marginBottom: 4 }}>Monthly EMI</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1b7a4a' }}>{money(emiVal)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Principal Amount</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{money(emiPrincipal)}</div>
              </div>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Total Interest</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: '#b23b3b' }}>{money(emiTotalInterest)}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#eef7ef', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2b332f' }}>Total Amount Payable</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#1b7a4a' }}>{money(emiTotalPayable)}</span>
            </div>
          </Card>
        </div>
      )}

      {/* 2. SIP Calculator */}
      {activeTab === 'sip' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card title="SIP Investment Inputs">
            <TextInput
              label="Monthly Investment (₹)"
              type="number"
              value={sipMonthly}
              onChange={e => setSipMonthly(e.target.value)}
              placeholder="e.g. 5000"
            />
            <TextInput
              label="Expected Annual Return (%)"
              type="number"
              step="0.5"
              value={sipRate}
              onChange={e => setSipRate(e.target.value)}
              placeholder="e.g. 12"
            />
            <TextInput
              label="Time Horizon (Years)"
              type="number"
              value={sipYears}
              onChange={e => setSipYears(e.target.value)}
              placeholder="e.g. 10"
            />
          </Card>

          <Card title="Projected Wealth Creation">
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: '#66706a', marginBottom: 4 }}>Expected Maturity Amount</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1b7a4a' }}>{money(sipMaturity)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Total Invested</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{money(sipInvested)}</div>
              </div>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Estimated Gains</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: '#1b7a4a' }}>{money(sipWealthGain)}</div>
              </div>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: '#66706a', lineHeight: 1.5 }}>
              * Monthly compounding assumed. Actual returns from equity mutual funds may vary according to market performance.
            </div>
          </Card>
        </div>
      )}

      {/* 3. Compound Interest Calculator */}
      {activeTab === 'compound' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card title="Deposit Parameters">
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
              label="Period (Years)"
              type="number"
              step="0.5"
              value={ciYears}
              onChange={e => setCiYears(e.target.value)}
              placeholder="e.g. 5"
            />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#444d47', marginBottom: 6 }}>
                Compounding Frequency
              </label>
              <select
                value={ciFreq}
                onChange={e => setCiFreq(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #d2ded5',
                  fontSize: 14,
                  outline: 'none',
                  background: '#fff',
                }}
              >
                <option value="1">Annually (1/yr)</option>
                <option value="2">Semi-Annually (2/yr)</option>
                <option value="4">Quarterly (4/yr)</option>
                <option value="12">Monthly (12/yr)</option>
                <option value="365">Daily (365/yr)</option>
              </select>
            </div>
          </Card>

          <Card title="Compound Growth Result">
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: '#66706a', marginBottom: 4 }}>Total Maturity Value</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1b7a4a' }}>{money(ciMaturity)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Initial Principal</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{money(ciPrincipal)}</div>
              </div>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Interest Earned</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: '#1b7a4a' }}>{money(ciInterest)}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. Simple Interest Calculator */}
      {activeTab === 'simple' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card title="Loan / Deposit Parameters">
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
          </Card>

          <Card title="Simple Interest Summary">
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: '#66706a', marginBottom: 4 }}>Total Amount Payable/Receivable</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1b7a4a' }}>{money(siTotal)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Principal</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{money(siPrincipal)}</div>
              </div>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Simple Interest</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: '#1b7a4a' }}>{money(siInterest)}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 5. Savings Goal Calculator */}
      {activeTab === 'savings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card title="Target Savings Details">
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
              label="Months to Reach Goal"
              type="number"
              value={goalMonths}
              onChange={e => setGoalMonths(e.target.value)}
              placeholder="e.g. 12"
            />
          </Card>

          <Card title="Required Savings Plan">
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 13, color: '#66706a', marginBottom: 4 }}>Monthly Savings Needed</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1b7a4a' }}>{money(goalMonthlyNeed)}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Remaining to Save</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{money(goalRemaining)}</div>
              </div>
              <div style={{ background: '#f4f8f5', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#66706a', textTransform: 'uppercase', fontWeight: 600 }}>Target Duration</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{goalMonths} months</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 6. 50/30/20 Budget Calculator */}
      {activeTab === 'budget' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card title="Income Input">
            <TextInput
              label="Monthly Take-Home Income (₹)"
              type="number"
              value={monthlyIncome}
              onChange={e => setMonthlyIncome(e.target.value)}
              placeholder="e.g. 75000"
            />
            <div style={{ fontSize: 12, color: '#66706a', marginTop: 8, lineHeight: 1.5 }}>
              The 50/30/20 rule is a golden budgeting benchmark that divides your after-tax income into Needs (50%), Wants (30%), and Savings/Debt Repayment (20%).
            </div>
          </Card>

          <Card title="Recommended Allocation">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#eef7ef', padding: 14, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1b7a4a' }}>50% — Essential Needs</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#1b7a4a' }}>{money(needs)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#444d47', marginTop: 4 }}>Rent, utilities, groceries, healthcare, insurance & minimum loan EMIs.</div>
              </div>

              <div style={{ background: '#fef7ed', padding: 14, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#d97706' }}>30% — Discretionary Wants</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{money(wants)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#78350f', marginTop: 4 }}>Dining out, subscriptions, shopping, hobbies, vacations & entertainment.</div>
              </div>

              <div style={{ background: '#eff6ff', padding: 14, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>20% — Savings & Investments</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#2563eb' }}>{money(savings)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#1e3a8a', marginTop: 4 }}>Emergency fund, SIPs, retirement funds, stocks, and extra debt prepayment.</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}
