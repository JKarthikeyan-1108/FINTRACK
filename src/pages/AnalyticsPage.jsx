import React, { useEffect, useState } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { txnAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Page, PageHeader, Card, SectionTitle, Button, Chip, ProgressBar } from '../components/ui/CashewUI';
import { money } from '../lib/format';
import { calculateHealthScore } from '../lib/healthScore';
import { generateFinancialStatement } from '../lib/pdfReport';
import { SUPPORTED_CURRENCIES, getExchangeRate, convertCurrency, formatCurrencyFX } from '../lib/currency';
import toast from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fxAmount, setFxAmount] = useState('1000');
  const [fxFrom, setFxFrom] = useState(user?.currency || 'INR');
  const [fxTo, setFxTo] = useState('USD');

  useEffect(() => {
    Promise.all([
      txnAPI.getAll({ limit: 9999 }),
      categoryAPI.getAll()
    ])
      .then(([txRes, catRes]) => {
        setTransactions(txRes.data.data || []);
        setCategories(catRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load analytics data'))
      .finally(() => setLoading(false));
  }, []);

  // 1. Process 12-Month Trends
  const monthlyData = {};
  const currentYear = new Date().getFullYear();
  
  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    monthlyData[key] = { label, income: 0, expense: 0 };
  }

  transactions.forEach(tx => {
    const key = tx.date.substring(0, 7); // YYYY-MM
    if (monthlyData[key]) {
      if (tx.type === 'income') monthlyData[key].income += Number(tx.amount);
      if (tx.type === 'expense') monthlyData[key].expense += Number(tx.amount);
    }
  });

  const monthKeys = Object.keys(monthlyData);
  const labels = monthKeys.map(k => monthlyData[k].label);
  const incomes = monthKeys.map(k => monthlyData[k].income);
  const expenses = monthKeys.map(k => monthlyData[k].expense);
  const savingsRates = monthKeys.map(k => {
    const inc = monthlyData[k].income;
    const exp = monthlyData[k].expense;
    return inc > 0 ? ((inc - exp) / inc) * 100 : 0;
  });

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 241, 242, 0.08)' : 'rgba(112, 38, 50, 0.08)';
  const textColor = isDark ? '#D0BFC7' : '#74636A';

  const barChartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomes,
        backgroundColor: isDark ? '#4ADE80' : '#15803D',
        borderRadius: 6,
      },
      {
        label: 'Expense',
        data: expenses,
        backgroundColor: isDark ? '#FDA4AF' : '#B42318',
        borderRadius: 6,
      },
    ],
  };

  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Savings Rate (%)',
        data: savingsRates,
        borderColor: isDark ? '#F2B7C3' : '#702632',
        backgroundColor: isDark ? 'rgba(242, 183, 195, 0.12)' : 'rgba(112, 38, 50, 0.08)',
        tension: 0.4,
        borderWidth: 2.5,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: isDark ? '#F2B7C3' : '#702632',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  // 2. Process Current Month Category Breakdown
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const currentMonthTx = transactions.filter(t => t.date.startsWith(currentMonthPrefix) && t.type === 'expense');
  
  const categoryTotals = {};
  currentMonthTx.forEach(tx => {
    const catName = tx.category_name || 'Uncategorized';
    categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(tx.amount);
  });

  const catLabels = Object.keys(categoryTotals);
  const catData = Object.values(categoryTotals);
  
  const chartSeriesLight = ['#702632', '#A83F55', '#D9778C', '#E9A3B0', '#8B7DB8', '#B68A3A', '#2563EB', '#0F766E'];
  const chartSeriesDark = ['#F2B7C3', '#E18A9D', '#C96A83', '#9D6D8A', '#B8A6F6', '#B68A3A', '#93C5FD', '#14B8A6'];
  const pieColors = isDark ? chartSeriesDark : chartSeriesLight;
  const pieChartData = {
    labels: catLabels.length ? catLabels : ['No Data'],
    datasets: [
      {
        data: catData.length ? catData : [1],
        backgroundColor: catData.length ? pieColors.slice(0, catData.length) : [isDark ? '#30212B' : '#E9DDE1'],
        borderWidth: 0,
      },
    ],
  };

  const totalIncome = incomes.reduce((a, b) => a + b, 0);
  const totalExpense = expenses.reduce((a, b) => a + b, 0);
  const totalSaved = totalIncome - totalExpense;
  const avgSavingsRate = totalIncome > 0 ? ((totalSaved / totalIncome) * 100).toFixed(1) : 0;

  const currentMonthTxAll = transactions.filter(t => t.date.startsWith(currentMonthPrefix));
  const currentMonthIncome = currentMonthTxAll.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
  const currentMonthExpense = currentMonthTxAll.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
  const health = calculateHealthScore({
    income: currentMonthIncome || (totalIncome / 12),
    expenses: currentMonthExpense || (totalExpense / 12),
    savings: (currentMonthIncome - currentMonthExpense),
    liquidBalance: totalSaved > 0 ? totalSaved : 50000,
    budgets: [],
  });

  function handleExportCSV() {
    if (transactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }
    const headers = ['Date,Title,Amount,Type,Category,Note'];
    const rows = transactions.map(t => 
      `${t.date},"${t.title.replace(/"/g, '""')}",${t.amount},${t.type},"${(t.category_name || '').replace(/"/g, '""')}","${(t.note || '').replace(/"/g, '""')}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FINTRACK_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Generated CSV Report successfully!');
  }

  if (loading) {
    return (
      <Page>
        <PageHeader eyebrow="Intelligence & Trends" title="Analytics" />
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
          <div className="spinner" />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Intelligence & Trends"
        title="Analytics"
        subtitle="Longitudinal cash flow analysis, savings velocity, and category distribution."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              onClick={() => {
                generateFinancialStatement({
                  user,
                  periodLabel: '12-Month Annualized Financial Audit',
                  overview: { income: totalIncome, expenses: totalExpense, savings: totalSaved },
                  transactions,
                });
                toast.success('Generated official financial audit statement');
              }}
            >
              <FileText size={15} /> PDF Statement
            </Button>
            <Button variant="soft" onClick={handleExportCSV}>
              <Download size={15} /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <div className="card-stagger">
          <MetricCard
            label="12-Month Inflow"
            value={money(totalIncome)}
            helper="Annualized income"
            tone="mint"
            icon={<TrendingUp />}
            trend="up"
            trendValue="+14.2%"
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="12-Month Outflow"
            value={money(totalExpense)}
            helper="Annualized expenses"
            tone="pink"
            icon={<TrendingDown />}
            trend="down"
            trendValue="-2.8%"
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Average Savings Rate"
            value={`${avgSavingsRate}%`}
            helper="Income retained"
            tone={Number(avgSavingsRate) >= 20 ? 'mint' : 'amber'}
            icon={<Activity />}
            trend="up"
            trendValue={Number(avgSavingsRate) >= 20 ? 'Target Achieved' : 'Below 20% benchmark'}
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Net Retained Wealth"
            value={money(totalSaved)}
            helper="12-month net capital"
            tone={totalSaved >= 0 ? 'blue' : 'amber'}
            icon={<FileText />}
          />
        </div>
      </div>

      {/* Financial Health Scorecard & Pillar Breakdown */}
      <div className="data-card card-stagger" style={{ marginBottom: 20 }}>
        <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
          <div className="data-card-title">
            <ShieldCheck size={18} color="#10b981" />
            <span>FinTrack Health Index & Autonomous Diagnostics</span>
          </div>
          <span className={`badge-pill ${health.badgeClass}`}>
            Overall Score: {health.score}/100 • {health.tier}
          </span>
        </div>
        <div className="data-card-body" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 20 }}>
            {/* Pillar 1: Savings Rate */}
            <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Savings Discipline</span>
                <span className="badge-pill badge-pill-mint">{health.breakdown.savings.rate}</span>
              </div>
              <ProgressBar value={(health.breakdown.savings.score / 25) * 100} tone="mint" />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Score: {health.breakdown.savings.score}/25 points
              </div>
            </div>

            {/* Pillar 2: Liquidity Runway */}
            <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Emergency Runway</span>
                <span className="badge-pill badge-pill-blue">{health.breakdown.liquidity.months} Mo</span>
              </div>
              <ProgressBar value={(health.breakdown.liquidity.score / 25) * 100} tone="blue" />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Score: {health.breakdown.liquidity.score}/25 points
              </div>
            </div>

            {/* Pillar 3: Budget Adherence */}
            <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Budget Control</span>
                <span className="badge-pill badge-pill-purple">{health.breakdown.budget.score}/25</span>
              </div>
              <ProgressBar value={(health.breakdown.budget.score / 25) * 100} tone="purple" />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Spending ceilings & allocation
              </div>
            </div>

            {/* Pillar 4: Debt & Obligations */}
            <div style={{ background: 'var(--surface-strong)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>Debt & Commitments</span>
                <span className="badge-pill badge-pill-amber">{health.breakdown.debt.dti} DTI</span>
              </div>
              <ProgressBar value={(health.breakdown.debt.score / 25) * 100} tone="amber" />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Score: {health.breakdown.debt.score}/25 points
              </div>
            </div>
          </div>

          {/* AI Prescriptive Guidance */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Sparkles size={15} color="#8b5cf6" />
              <strong style={{ fontSize: '0.86rem', color: 'var(--text)' }}>AI Financial Prescriptions</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {health.tips.map((tip, idx) => (
                <div key={idx} style={{ background: 'var(--surface-strong)', padding: '10px 14px', borderRadius: 8, fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>• {tip.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{tip.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="data-card card-stagger" style={{ marginBottom: 20 }}>
        <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
          <span className="data-card-title"><Activity size={16} /> 12-Month Cashflow Trajectory</span>
          <span className="badge-pill badge-pill-neutral">Income vs Expense</span>
        </div>
        <div className="data-card-body" style={{ padding: '20px' }}>
          <div style={{ height: 320 }}>
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                      boxWidth: 8,
                      boxHeight: 8,
                      usePointStyle: true,
                      pointStyle: 'circle',
                      color: textColor,
                      font: { family: 'inherit', size: 12, weight: 600 }
                    }
                  },
                  tooltip: {
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                      label: ctx => `  ${ctx.dataset.label}: ${money(ctx.parsed.y)}`
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { size: 11, weight: 500 } }
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: {
                      color: textColor,
                      font: { size: 11, weight: 500 },
                      callback: val => money(val, true)
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, paddingBottom: 20 }}>
        <div className="data-card card-stagger">
          <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
            <span className="data-card-title"><TrendingUp size={16} /> Monthly Savings Velocity</span>
            <span className="badge-pill badge-pill-blue">Target: 20%+</span>
          </div>
          <div className="data-card-body" style={{ padding: '20px' }}>
            <div style={{ height: 260 }}>
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: { padding: 10, cornerRadius: 8 }
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: textColor, font: { size: 11 } }
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      grid: { color: gridColor },
                      ticks: {
                        color: textColor,
                        font: { size: 11 },
                        callback: val => `${val}%`
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="data-card card-stagger">
          <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
            <span className="data-card-title"><PieIcon size={16} /> Monthly Expense Allocation</span>
            <span className="badge-pill badge-pill-neutral">By Category</span>
          </div>
          <div className="data-card-body" style={{ padding: '20px' }}>
            <div style={{ height: 260, position: 'relative' }}>
              <Doughnut
                data={pieChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '68%',
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: { color: textColor, font: { size: 11, weight: 500 } }
                    },
                    tooltip: { padding: 10, cornerRadius: 8 }
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Multi-Currency FX Engine */}
      <div className="data-card card-stagger" style={{ marginTop: 20 }}>
        <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
          <div className="data-card-title">
            <Globe size={18} color="#0ea5e9" />
            <span>Global Multi-Currency FX Matrix</span>
          </div>
          <span className="badge-pill badge-pill-mint">Live Reference Rates</span>
        </div>
        <div className="data-card-body" style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Quick Converter Widget */}
            <div style={{ background: 'var(--surface-strong)', padding: '16px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ArrowRightLeft size={16} color="#0ea5e9" /> Instant Currency Calculator
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>AMOUNT</label>
                  <input
                    type="number"
                    value={fxAmount}
                    onChange={(e) => setFxAmount(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      color: 'var(--text)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
                <div style={{ width: 90 }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>FROM</label>
                  <select
                    value={fxFrom}
                    onChange={(e) => setFxFrom(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 6px',
                      color: 'var(--text)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                  </select>
                </div>
                <div style={{ width: 90 }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>TO</label>
                  <select
                    value={fxTo}
                    onChange={(e) => setFxTo(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 6px',
                      color: 'var(--text)',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Converted Equivalent:</span>
                <strong style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 900 }}>
                  {formatCurrencyFX(convertCurrency(Number(fxAmount || 0), fxFrom, fxTo), fxTo)}
                </strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
                1 {fxFrom} = {getExchangeRate(fxFrom, fxTo).toFixed(4)} {fxTo}
              </div>
            </div>

            {/* Exchange Rate Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
              {SUPPORTED_CURRENCIES.filter(c => c.code !== (user?.currency || 'INR')).map(c => {
                const userCur = user?.currency || 'INR';
                const rate = getExchangeRate(c.code, userCur);
                return (
                  <div key={c.code} style={{ background: 'var(--surface-strong)', padding: '12px', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '1.1rem' }}>{c.flag}</span>
                      <strong style={{ fontSize: '0.86rem', color: 'var(--text)' }}>1 {c.code}</strong>
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>
                      {money(rate)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {c.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
