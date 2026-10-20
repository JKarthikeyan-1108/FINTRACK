import { useEffect, useRef, useState, useMemo } from 'react';
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
  Scale,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Compass,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { investAPI, dashAPI } from '../services/api';
import { calculatePortfolioRebalance, MODEL_PORTFOLIOS, ASSET_CLASS_META } from '../lib/portfolioRebalance';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [myInvests, setMyInvests] = useState([]);
  const [openCat, setOpenCat] = useState(null);
  const [tab, setTab] = useState('suggestions');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [dash, setDash] = useState(null);
  const [riskPref, setRiskPref] = useState('medium');
  const [horizonPref, setHorizonPref] = useState('medium');
  const [selectedModel, setSelectedModel] = useState('balanced');
  const [freshInflow, setFreshInflow] = useState('0');

  useEffect(() => {
    investAPI.getAll().then(({ data }) => setMyInvests(data.data || [])).catch(() => {});
    dashAPI.overview().then(({ data }) => setDash(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.prefillProduct) {
      const p = location.state.prefillProduct;
      const catMap = {
        'gold-silver': 'gold',
        'stocks': 'stocks',
        'ipos': 'stocks',
        'mutual-funds': 'mutual_fund',
        'lic-life-insurance': 'insurance',
        'health-insurance': 'insurance',
        'fixed-deposits': 'fixed_income',
        'government-securities': 'fixed_income',
        'etfs-reits-invits': 'real_estate',
        'retirement-pension': 'fixed_income',
        'emergency-savings': 'fixed_income',
        'other-investments': 'fixed_income',
      };
      setForm({
        name: p.name || '',
        category: catMap[p.categoryId] || 'mutual_fund',
        invested_amount: '',
        current_value: '',
        sip_amount: p.type?.toLowerCase().includes('sip') ? '1000' : '',
        notes: `Researched via FinTrack Explore & Suggest. Provider: ${p.entityName || ''}. Type: ${p.type || ''}.`,
      });
      setModal(true);
      toast.success(`Pre-filled "${p.name}". Enter your deployed capital to track!`, { icon: '💼' });
    }
  }, [location.state]);

  const rebalanceData = useMemo(() => {
    return calculatePortfolioRebalance({
      investments: myInvests,
      cashReserve: dash ? Math.max(0, dash.net_worth - dash.portfolio) : 0,
      targetWeights: MODEL_PORTFOLIOS[selectedModel]?.weights,
      freshCapital: Number(freshInflow || 0),
    });
  }, [myInvests, dash, selectedModel, freshInflow]);

  const totalInvested = myInvests.reduce((sum, inv) => sum + Number(inv.invested_amount), 0);
  const totalCurrent = myInvests.reduce((sum, inv) => sum + Number(inv.current_value), 0);
  const totalGain = totalCurrent - totalInvested;
  const displayTotal = totalCurrent;
  const countUpVal = useCountUp(displayTotal);
  const returnPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const groups = CATS.map(cat => ({
    ...cat,
    total: myInvests.filter(inv => inv.category === cat.id).reduce((sum, inv) => sum + Number(inv.current_value), 0),
  })).filter(group => group.total > 0);

  const pieData = groups.length ? {
    labels: groups.map(group => group.name),
    datasets: [{ data: groups.map(group => group.total), backgroundColor: ['#6fb36e', '#4b82b8', '#d65f87', '#c58a21', '#8a68c3', '#58a79f'], borderWidth: 0 }],
  } : null;

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
        eyebrow="Wealth & Assets"
        title="My Investments"
        subtitle="Track asset allocation, user-entered valuations, and long-term capital compounding."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button variant="soft" onClick={() => navigate('/explore')}>
              <Compass size={16} /> Explore & Suggest
            </Button>
            <Button variant="primary" onClick={() => setModal(true)}>
              <Plus size={16} /> Add Asset
            </Button>
          </div>
        }
      />

      <div className="data-card" style={{ marginBottom: 20 }}>
        <div className="data-card-body" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Total Portfolio Valuation
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                <strong style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {money(countUpVal)}
                </strong>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  across {myInvests.length} holdings
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`badge-pill ${returnPct >= 0 ? 'badge-pill-mint' : 'badge-pill-pink'}`} style={{ fontSize: '0.84rem', padding: '4px 10px' }}>
                {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}% All-Time Return
              </span>
              <span className="badge-pill badge-pill-neutral" style={{ fontSize: '0.84rem', padding: '4px 10px' }}>
                {groups.length} Asset Classes
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Invested Principal</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2, color: 'var(--text)' }}>
                {money(totalInvested)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unrealized Gain</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2, color: totalGain >= 0 ? '#10b981' : '#f43f5e' }}>
                {totalGain >= 0 ? '+' : ''}{money(totalGain)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Monthly SIP</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2, color: '#0284c7' }}>
                {money(myInvests.reduce((sum, i) => sum + Number(i.sip_amount || 0), 0))}/mo
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <div className="card-stagger">
          <MetricCard
            label="Portfolio Value"
            value={money(displayTotal)}
            helper="User-entered valuation"
            tone="mint"
            icon={<WalletCards />}
            trend="up"
            trendValue={returnPct >= 0 ? `+${returnPct.toFixed(1)}%` : `${returnPct.toFixed(1)}%`}
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Invested Principal"
            value={money(totalInvested)}
            helper="Capital deployed"
            tone="blue"
            icon={<Banknote />}
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Total Return"
            value={money(Math.abs(totalGain))}
            helper={totalGain >= 0 ? 'Net profit accrued' : 'Net loss'}
            tone={totalGain >= 0 ? 'amber' : 'pink'}
            icon={<TrendingUp />}
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Holdings Count"
            value={String(myInvests.length)}
            helper="Diversified positions"
            tone="purple"
            icon={<Coins />}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: 'suggestions', label: 'Suggestions', icon: <Lightbulb /> },
              { value: 'rebalance', label: 'Rebalance Matrix', icon: <Scale /> },
              { value: 'plans', label: 'Plans', icon: <Landmark /> },
              { value: 'portfolio', label: 'Portfolio', icon: <WalletCards /> },
            ]}
          />

          <div key={tab} className="tab-transition-container">
          {tab === 'rebalance' && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Model Portfolio Selector */}
              <div className="data-card card-stagger">
                <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
                  <div className="data-card-title">
                    <Scale size={18} color="#8b5cf6" />
                    <span>Target Model Allocation Architecture</span>
                  </div>
                  <span className="badge-pill badge-pill-purple">Institutional Matrix</span>
                </div>
                <div className="data-card-body" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    {Object.values(MODEL_PORTFOLIOS).map(model => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedModel(model.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          textAlign: 'left',
                          cursor: 'pointer',
                          border: selectedModel === model.id ? '2px solid #8b5cf6' : '1px solid var(--border)',
                          background: selectedModel === model.id ? 'rgba(139, 92, 246, 0.12)' : 'var(--surface)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.86rem', color: selectedModel === model.id ? '#8b5cf6' : 'var(--text)' }}>
                            {model.name}
                          </strong>
                          {selectedModel === model.id && <span className="badge-pill badge-pill-purple" style={{ fontSize: '0.62rem' }}>Selected</span>}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                          {model.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Fresh Capital Inflow Simulator */}
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>Fresh Capital Inflow (Rebalance without Selling)</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inject new liquidity to bring underweight asset classes to par without triggering capital gains taxes.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
                      <input
                        type="number"
                        className="input"
                        style={{ width: 140, padding: '6px 12px', fontSize: '0.9rem', fontWeight: 700 }}
                        placeholder="0"
                        value={freshInflow}
                        onChange={e => setFreshInflow(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Score & Drift Alert */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                <div className="data-card card-stagger">
                  <div className="data-card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Allocation Alignment Index
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: rebalanceData.rebalanceIndex >= 80 ? '#10b981' : '#f59e0b', marginTop: 4 }}>
                        {rebalanceData.rebalanceIndex} / 100
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {rebalanceData.rebalanceIndex >= 85 ? 'Optimally balanced' : 'Drift detected across asset classes'}
                      </div>
                    </div>
                    <span className={`badge-pill ${rebalanceData.rebalanceIndex >= 80 ? 'badge-pill-mint' : 'badge-pill-amber'}`}>
                      {rebalanceData.rebalanceIndex >= 80 ? 'Healthy' : 'Rebalance Recommended'}
                    </span>
                  </div>
                </div>

                <div className="data-card card-stagger">
                  <div className="data-card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Target Portfolio Value
                      </div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                        {money(rebalanceData.targetTotal)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Current Holdings: {money(rebalanceData.currentTotal)}{freshInflow > 0 ? ` (+${money(freshInflow)} fresh)` : ''}
                      </div>
                    </div>
                    <span className="badge-pill badge-pill-blue">AUM</span>
                  </div>
                </div>
              </div>

              {/* Asset Allocation Breakdown Matrix */}
              <div className="data-card card-stagger">
                <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
                  <div className="data-card-title">
                    <Sliders size={18} color="#0ea5e9" />
                    <span>Asset Class Drift & Target Weights</span>
                  </div>
                  <span className="badge-pill badge-pill-blue">5 Classes</span>
                </div>
                <div className="data-card-body" style={{ padding: 0 }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-strong)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <th style={{ padding: '12px 18px' }}>Asset Class</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>Current Value</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actual %</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>Target %</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>Drift</th>
                          <th style={{ padding: '12px 18px', textAlign: 'right' }}>Target Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rebalanceData.breakdown.map(item => (
                          <tr key={item.key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 18px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                <strong style={{ color: 'var(--text)' }}>{item.label}</strong>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>
                              {money(item.currentVal)}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>
                              {item.currentPct}%
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#8b5cf6' }}>
                              {item.targetPct}%
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <span className={`badge-pill ${item.driftPct > 3 ? 'badge-pill-pink' : item.driftPct < -3 ? 'badge-pill-blue' : 'badge-pill-mint'}`} style={{ fontSize: '0.72rem' }}>
                                {item.driftPct > 0 ? `+${item.driftPct}%` : `${item.driftPct}%`}
                              </span>
                            </td>
                            <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--text)' }}>
                              {money(item.targetVal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Execution Order Book / Rebalancing Trades */}
              <div className="data-card card-stagger">
                <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
                  <div className="data-card-title">
                    <CheckCircle2 size={18} color="#10b981" />
                    <span>Recommended Execution Trades</span>
                  </div>
                  <span className="badge-pill badge-pill-mint">{rebalanceData.rebalanceActions.length} Actions</span>
                </div>
                <div className="data-card-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rebalanceData.rebalanceActions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>Portfolio is Perfectly Balanced</div>
                      <div style={{ fontSize: '0.78rem', marginTop: 4 }}>All asset classes are within acceptable variance tolerances of the {MODEL_PORTFOLIOS[selectedModel].name} model.</div>
                    </div>
                  ) : (
                    rebalanceData.rebalanceActions.map((action, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: 10,
                          background: action.action === 'TRIM' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)',
                          border: action.action === 'TRIM' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span
                            className={`badge-pill ${action.action === 'TRIM' ? 'badge-pill-pink' : 'badge-pill-mint'}`}
                            style={{ fontWeight: 800, fontSize: '0.74rem', padding: '4px 10px' }}
                          >
                            {action.action}
                          </span>
                          <div>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>{action.label}</strong>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{action.reason}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '1.2rem', fontWeight: 900, color: action.color, fontVariantNumeric: 'tabular-nums' }}>
                            {action.action === 'BUY' ? '+' : '-'}{money(action.amount)}
                          </strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

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
        </div>

        <aside>
          <Card>
            <div className="section-title" style={{ marginTop: 0 }}><span>Allocation</span></div>
            {pieData ? (
              <>
                <div style={{ height: 210, position: 'relative' }}>
                  <Doughnut data={pieData} options={{ responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false } } }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {pieData.labels.map((label, index) => <Chip key={label} tone={index % 2 ? 'blue' : 'mint'}>{label}</Chip>)}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#64748b' }}>Allocation appears after you add holdings with a current value.</p>
            )}
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>Values are user-entered. FinTrack does not fetch live market prices.</p>
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
