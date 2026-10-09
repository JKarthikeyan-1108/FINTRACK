import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  BadgePercent,
  Banknote,
  Building2,
  ChevronRight,
  Coins,
  Gem,
  Landmark,
  Plus,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  Lightbulb,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { investAPI, dashAPI } from '../services/api';
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  EmptyState,
  FAB,
  MetricCard,
  Page,
  PageHeader,
  SegmentedControl,
  SelectInput,
  TextInput,
} from '../components/ui/CashewUI';
import { money } from '../lib/format';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const CATS = [
  { id: 'insurance', name: 'Insurance', desc: 'LIC, health, term cover', risk: 'Low', tone: 'mint', Icon: ShieldCheck },
  { id: 'gold', name: 'Gold', desc: 'SGB, ETF, digital gold', risk: 'Medium', tone: 'amber', Icon: Gem },
  { id: 'stocks', name: 'Stocks', desc: 'Direct equity and ETFs', risk: 'High', tone: 'pink', Icon: TrendingUp },
  { id: 'mutual_fund', name: 'Mutual Funds', desc: 'ELSS, index, hybrid funds', risk: 'Medium', tone: 'purple', Icon: BadgePercent },
  { id: 'fixed_income', name: 'Fixed Income', desc: 'PPF, NPS, FD, bonds', risk: 'Low', tone: 'blue', Icon: Landmark },
  { id: 'real_estate', name: 'Real Estate', desc: 'REITs and property', risk: 'Medium', tone: 'amber', Icon: Building2 },
];

const PLANS = {
  insurance: [
    { name: 'Term insurance base', org: 'Protection first', ret: 'Risk cover', min: 'Income x 10', tax: '80C', note: 'Keep protection separate from investing and avoid underinsurance.' },
    { name: 'Health floater', org: 'Family cover', ret: 'Cashless', min: '5L+', tax: '80D', note: 'Prioritize claim network, room rent rules, and waiting periods.' },
  ],
  gold: [
    { name: 'Sovereign Gold Bond', org: 'RBI', ret: 'Gold + 2.5%', min: '1 gram', tax: 'Tax-free maturity', note: 'Best for long-term gold allocation if liquidity is not urgent.' },
    { name: 'Gold ETF', org: 'Listed funds', ret: 'Gold-linked', min: '1 unit', tax: 'Capital gains', note: 'Useful for flexible gold allocation through a demat account.' },
  ],
  stocks: [
    { name: 'Nifty basket', org: 'Large cap core', ret: 'Market-linked', min: 'Small lots', tax: 'Equity tax', note: 'Use a diversified core before taking concentrated bets.' },
    { name: 'Direct equity', org: 'NSE/BSE', ret: 'High variance', min: 'Any', tax: 'Equity tax', note: 'Track position sizing, thesis, and review dates.' },
  ],
  mutual_fund: [
    { name: 'Nifty 50 index fund', org: 'Core equity', ret: 'Index-linked', min: 'SIP', tax: 'Equity tax', note: 'Simple, low-cost default for long-term equity exposure.' },
    { name: 'ELSS fund', org: 'Tax saver', ret: 'Equity-linked', min: 'SIP', tax: '80C', note: 'Use only when the three-year lock-in matches your tax plan.' },
  ],
  fixed_income: [
    { name: 'PPF', org: 'Government backed', ret: 'Fixed rate', min: '500/yr', tax: 'EEE', note: 'Good for conservative long-term allocation and tax efficiency.' },
    { name: 'NPS Tier 1', org: 'Retirement', ret: 'Mixed asset', min: '500/yr', tax: '80CCD', note: 'Long lock-in, but strong retirement and tax planning utility.' },
  ],
  real_estate: [
    { name: 'Listed REITs', org: 'Commercial property', ret: 'Yield + price', min: '1 unit', tax: 'Distribution rules', note: 'A liquid way to add real-estate exposure without a large property purchase.' },
  ],
};

const GROWTH_DATA = {
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [{
    data: [310000, 340000, 325000, 380000, 420000, 450000, 487000],
    borderColor: '#315f3b',
    borderWidth: 3,
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    backgroundColor: 'rgba(111,179,110,.18)',
  }],
};

const blankForm = () => ({ name: '', category: 'mutual_fund', invested_amount: '', current_value: '', sip_amount: '', notes: '' });

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef();

  useEffect(() => {
    const start = performance.now();
    const step = time => {
      const progress = Math.min((time - start) / duration, 1);
      setValue(Math.floor(Number(target || 0) * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

export default function InvestmentsPage() {
  const [myInvests, setMyInvests] = useState([]);
  const [openCat, setOpenCat] = useState(null);
  const [tab, setTab] = useState('suggestions');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [dash, setDash] = useState(null);
  const [riskPref, setRiskPref] = useState('medium');
  const [horizonPref, setHorizonPref] = useState('medium');

  useEffect(() => {
    investAPI.getAll().then(({ data }) => setMyInvests(data.data || [])).catch(() => {});
    dashAPI.overview().then(({ data }) => setDash(data)).catch(() => {});
  }, []);

  const totalInvested = myInvests.reduce((sum, inv) => sum + Number(inv.invested_amount), 0);
  const totalCurrent = myInvests.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const totalGain = totalCurrent - totalInvested;
  const displayTotal = totalCurrent || 487000;
  const countUpVal = useCountUp(displayTotal);
  const returnPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 28.2;

  const groups = CATS.map(cat => ({
    ...cat,
    total: myInvests.filter(inv => inv.category === cat.id).reduce((sum, inv) => sum + Number(inv.current_value), 0),
  })).filter(group => group.total > 0);

  const pieData = groups.length ? {
    labels: groups.map(group => group.name),
    datasets: [{ data: groups.map(group => group.total), backgroundColor: ['#6fb36e', '#4b82b8', '#d65f87', '#c58a21', '#8a68c3', '#58a79f'], borderWidth: 0 }],
  } : {
    labels: ['Mutual Funds', 'Stocks', 'Gold', 'Fixed Income'],
    datasets: [{ data: [40, 25, 15, 20], backgroundColor: ['#8a68c3', '#d65f87', '#c58a21', '#4b82b8'], borderWidth: 0 }],
  };

  async function addInvestment() {
    if (!form.name) {
      toast.error('Investment name is required');
      return;
    }

    try {
      const { data } = await investAPI.create(form);
      setMyInvests(prev => [data.data, ...prev]);
      setModal(false);
      setForm(blankForm());
      toast.success('Investment added');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add investment');
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Portfolio"
        title="Investments"
        subtitle="A lighter view of portfolio value, allocation, and starter plans."
        action={<Button onClick={() => setModal(true)}><Plus size={18} /> Add</Button>}
      />

      <Card tone="mint" className="hero-balance" style={{ marginBottom: 14 }}>
        <div className="budget-card-header">
          <div>
            <span className="hero-balance-label">Total portfolio value</span>
            <strong>{money(countUpVal)}</strong>
            <small>{returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}% estimated return</small>
          </div>
          <div className="metric-icon" style={{ width: 50, height: 50 }}>
            <TrendingUp size={26} />
          </div>
        </div>
        <div className="chart-box" style={{ height: 92, marginTop: 0 }}>
          <Line data={GROWTH_DATA} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }} />
        </div>
        <div className="hero-balance-grid">
          <div className="mini-stat">
            <span>Invested</span>
            <strong>{money(totalInvested || 380000)}</strong>
          </div>
          <div className="mini-stat">
            <span>Gain</span>
            <strong className={totalGain >= 0 ? 'amount-income' : 'amount-expense'}>{money(Math.abs(totalGain) || 107000)}</strong>
          </div>
        </div>
      </Card>

      <div className="metric-grid" style={{ marginBottom: 14 }}>
        <MetricCard label="Portfolio" value={money(displayTotal)} helper="Current value" tone="mint" icon={<WalletCards />} />
        <MetricCard label="Invested" value={money(totalInvested || 380000)} helper="Principal" tone="blue" icon={<Banknote />} />
        <MetricCard label="Gain" value={money(Math.abs(totalGain) || 107000)} helper="Unrealized" tone={totalGain >= 0 ? 'amber' : 'pink'} icon={<TrendingUp />} />
        <MetricCard label="Assets" value={String(myInvests.length || 4)} helper="Tracked types" tone="purple" icon={<Coins />} />
      </div>

      <div className="dashboard-grid">
        <div>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: 'suggestions', label: 'Suggestions', icon: <Lightbulb /> },
              { value: 'plans', label: 'Plans', icon: <Landmark /> },
              { value: 'portfolio', label: 'Portfolio', icon: <WalletCards /> },
            ]}
          />

          {tab === 'suggestions' && (
            <div style={{ marginTop: 14 }}>
              <Card tone="amber" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <AlertTriangle style={{ color: '#c58a21', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: 13, color: '#c58a21' }}>Educational Suggestion Only</strong>
                    <p style={{ fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>
                      These suggestions are generated based on simple rules to help you discover options. 
                      This is not financial advice. Please do your own research before investing.
                    </p>
                  </div>
                </div>
              </Card>

              {dash && (
                <Card style={{ marginBottom: 14 }}>
                  <div className="section-title" style={{ marginTop: 0 }}><span>Financial Capacity</span></div>
                  <div className="metric-grid">
                    <MetricCard label="Monthly Savings" value={money(dash.savings)} helper="Available to invest" tone={dash.savings > 0 ? 'mint' : 'pink'} />
                    <MetricCard label="Liquid Cash" value={money(dash.net_worth - dash.portfolio)} helper="In accounts" tone="blue" />
                  </div>
                  
                  <div className="section-title"><span>Preferences</span></div>
                  <div className="field-row">
                    <SelectInput label="Risk Tolerance" value={riskPref} onChange={e => setRiskPref(e.target.value)}>
                      <option value="low">Low (Capital Protection)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Aggressive Growth)</option>
                    </SelectInput>
                    <SelectInput label="Time Horizon" value={horizonPref} onChange={e => setHorizonPref(e.target.value)}>
                      <option value="short">Short (&lt; 3 years)</option>
                      <option value="medium">Medium (3-7 years)</option>
                      <option value="long">Long (7+ years)</option>
                    </SelectInput>
                  </div>
                </Card>
              )}

              <div className="section-title"><span>Recommended Options</span></div>
              <div className="budget-list">
                {(() => {
                  if (!dash) return <p>Loading suggestions...</p>;
                  
                  const suggestions = [];
                  const liquid = dash.net_worth - dash.portfolio;
                  
                  // Rule 1: Emergency Fund
                  if (liquid < dash.expenses * 3) {
                    suggestions.push({
                      type: 'Priority',
                      title: 'Emergency Fund',
                      desc: `You have ${money(liquid)} in liquid cash. Aim for at least 3-6 months of expenses (${money(dash.expenses * 3)} - ${money(dash.expenses * 6)}) in a high-yield savings account or liquid mutual fund before making risky investments.`,
                      tone: 'pink',
                      link: 'https://www.investopedia.com/terms/e/emergency_fund.asp',
                    });
                  }

                  // Rule 2: Based on Horizon and Risk
                  if (horizonPref === 'short') {
                    suggestions.push({
                      type: 'Fixed Income',
                      title: 'Fixed Deposits (FDs) / Liquid Funds',
                      desc: 'For short-term goals (< 3 years), capital preservation is key. Avoid equities. Consider Bank FDs, Recurring Deposits (RD), or Liquid Mutual Funds.',
                      tone: 'blue',
                      link: 'https://www.amfiindia.com/investor-corner/knowledge-center/liquid-funds.html',
                    });
                  } else if (horizonPref === 'medium') {
                    if (riskPref === 'low') {
                      suggestions.push({
                        type: 'Fixed Income',
                        title: 'Corporate Bonds / Post Office Schemes',
                        desc: 'Offers better yields than bank FDs with relatively low risk. Consider Post Office Time Deposits, NSC, or high-rated Corporate Bond Funds.',
                        tone: 'blue',
                        link: 'https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx',
                      });
                    } else {
                      suggestions.push({
                        type: 'Balanced',
                        title: 'Hybrid / Balanced Advantage Funds',
                        desc: 'A mix of equity and debt that automatically adjusts based on market conditions. Great for medium-term horizons to reduce volatility.',
                        tone: 'purple',
                        link: 'https://www.amfiindia.com/investor-corner/knowledge-center/hybrid-funds.html',
                      });
                    }
                  } else if (horizonPref === 'long') {
                    if (riskPref === 'high') {
                      suggestions.push({
                        type: 'Equities',
                        title: 'Direct Stocks / Small-Cap Funds',
                        desc: 'For high risk and long horizons (7+ years), allocating to Small-Cap Mutual Funds or direct stock portfolios can maximize wealth creation, despite high short-term volatility.',
                        tone: 'pink',
                        link: 'https://www.investopedia.com/terms/e/equityfund.asp',
                      });
                    } else if (riskPref === 'medium') {
                      suggestions.push({
                        type: 'Equities',
                        title: 'Index Funds / Large-Cap Funds',
                        desc: 'A low-cost Nifty 50 or Sensex Index Fund is ideal for long-term wealth creation. It reliably tracks the market and beats most active funds over 10+ years.',
                        tone: 'mint',
                        link: 'https://www.amfiindia.com/investor-corner/knowledge-center/index-funds.html',
                      });
                    } else {
                      suggestions.push({
                        type: 'Conservative',
                        title: 'Public Provident Fund (PPF)',
                        desc: 'An excellent tax-free (EEE) long-term investment option backed by the Government of India. Comes with a 15-year lock-in.',
                        tone: 'amber',
                        link: 'https://www.indiapost.gov.in/Financial/Pages/Content/Post-Office-Saving-Schemes.aspx',
                      });
                    }
                  }

                  // Rule 3: Excess Savings suggestion
                  if (dash.savings > 0) {
                    suggestions.push({
                      type: 'Strategy',
                      title: 'Systematic Investment Plan (SIP)',
                      desc: `You have ${money(dash.savings)} in monthly savings. Consider starting an automated SIP with 20-30% of this amount to take advantage of rupee-cost averaging.`,
                      tone: 'mint',
                      link: 'https://www.amfiindia.com/investor-corner/knowledge-center/sip.html',
                    });
                  }

                  return suggestions.map((sug, idx) => (
                    <Card key={idx} tone="plain">
                      <div className="budget-row-title">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Chip tone={sug.tone}>{sug.type}</Chip>
                          <strong>{sug.title}</strong>
                        </div>
                      </div>
                      <p style={{ marginTop: 10, fontSize: 13, lineHeight: 1.5 }}>{sug.desc}</p>
                      <a 
                        href={sug.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 12, color: 'var(--blue)', fontWeight: 800, textDecoration: 'none' }}
                      >
                        View Official Details <ExternalLink size={12} />
                      </a>
                    </Card>
                  ));
                })()}
              </div>
            </div>
          )}

          {tab === 'plans' && (
            <div className="budget-list" style={{ marginTop: 14 }}>
              {CATS.map(cat => {
                const Icon = cat.Icon;
                const plans = PLANS[cat.id] || [];
                const isOpen = openCat === cat.id;

                return (
                  <Card key={cat.id} tone={isOpen ? cat.tone : 'plain'} onClick={() => setOpenCat(isOpen ? null : cat.id)}>
                    <div className="transaction-row" style={{ borderBottom: 0, padding: 0 }}>
                      <div className="transaction-icon">
                        <Icon size={21} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="transaction-title">{cat.name}</div>
                        <div className="transaction-meta">{cat.desc}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <Chip tone={cat.tone}>{cat.risk} risk</Chip>
                          <Chip>{plans.length} plans</Chip>
                        </div>
                      </div>
                      <ChevronRight size={20} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .18s ease' }} />
                    </div>
                    {isOpen && (
                      <div className="budget-list" style={{ marginTop: 14 }}>
                        {plans.map(plan => (
                          <Card key={plan.name} tone="plain" style={{ boxShadow: 'none' }} onClick={event => event.stopPropagation()}>
                            <div className="budget-row-title">
                              <strong>{plan.name}</strong>
                              <b>{plan.ret}</b>
                            </div>
                            <div className="budget-row-meta">
                              <span>{plan.org}</span>
                              <span>{plan.min}</span>
                            </div>
                            <p style={{ marginTop: 10 }}>{plan.note}</p>
                            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                              <Chip tone={cat.tone}>{plan.tax}</Chip>
                              <Chip>{cat.risk} risk</Chip>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {tab === 'portfolio' && (
            <div style={{ marginTop: 14 }}>
              {myInvests.length === 0 ? (
                <EmptyState
                  icon={<WalletCards />}
                  title="No investments yet"
                  text="Add mutual funds, stocks, gold, fixed income, or other portfolio assets."
                  action={<Button onClick={() => setModal(true)}><Plus size={18} /> Add investment</Button>}
                />
              ) : (
                <div className="budget-list">
                  {myInvests.map(inv => {
                    const gain = Number(inv.current_value) - Number(inv.invested_amount);
                    const ret = Number(inv.invested_amount) > 0 ? (gain / Number(inv.invested_amount)) * 100 : 0;
                    const cat = CATS.find(item => item.id === inv.category) || CATS[0];
                    const Icon = cat.Icon;

                    return (
                      <Card key={inv.id}>
                        <div className="transaction-row" style={{ borderBottom: 0, padding: 0 }}>
                          <div className="transaction-icon">
                            <Icon size={21} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="transaction-title">{inv.name}</div>
                            <div className="transaction-meta">{cat.name}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className={`transaction-amount ${gain >= 0 ? 'amount-income' : 'amount-expense'}`}>{money(inv.current_value)}</div>
                            <div className="transaction-meta">{gain >= 0 ? '+' : ''}{ret.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="budget-row-meta" style={{ marginTop: 10 }}>
                          <span>Invested {money(inv.invested_amount)}</span>
                          <span className={gain >= 0 ? 'amount-income' : 'amount-expense'}>{gain >= 0 ? '+' : ''}{money(gain)}</span>
                        </div>
                        {Number(inv.sip_amount) > 0 && <Chip tone="mint">SIP {money(inv.sip_amount)}/month</Chip>}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <aside>
          <Card>
            <div className="section-title" style={{ marginTop: 0 }}><span>Allocation</span></div>
            <div style={{ height: 210, position: 'relative' }}>
              <Doughnut data={pieData} options={{ responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {pieData.labels.map((label, index) => <Chip key={label} tone={index % 2 ? 'blue' : 'mint'}>{label}</Chip>)}
            </div>
          </Card>
        </aside>
      </div>

      <FAB icon={<Plus size={24} />} label="Add investment" onClick={() => setModal(true)} />

      {modal && (
        <BottomSheet title="Add Investment" onClose={() => setModal(false)}>
          <TextInput label="Investment name" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Nifty 50 SIP, SGB, stock" />
          <SelectInput label="Category" value={form.category} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))}>
            {CATS.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </SelectInput>
          <div className="field-row">
            <TextInput label="Invested" type="number" value={form.invested_amount} onChange={event => setForm(prev => ({ ...prev, invested_amount: event.target.value }))} placeholder="0" />
            <TextInput label="Current value" type="number" value={form.current_value} onChange={event => setForm(prev => ({ ...prev, current_value: event.target.value }))} placeholder="0" />
          </div>
          <TextInput label="Monthly SIP" type="number" value={form.sip_amount} onChange={event => setForm(prev => ({ ...prev, sip_amount: event.target.value }))} placeholder="Optional" />
          <TextInput label="Notes" value={form.notes} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} placeholder="Optional" />
          <Button className="ui-button-full" onClick={addInvestment}>Add to portfolio</Button>
        </BottomSheet>
      )}
    </Page>
  );
}
