import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import toast from 'react-hot-toast';
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Banknote,
  ChartPie,
  Flame,
  Flag,
  Plus,
  ReceiptText,
  Target,
  TrendingUp,
  WalletCards,
  Wallet,
  Home,
  Activity,
  ShieldCheck,
  Zap,
  Download,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useFinTrackPlatform from '../hooks/useFinTrackPlatform';
import { dashAPI, budgetAPI, goalAPI } from '../services/api';
import {
  Button,
  Card,
  EmptyState,
  MetricCard,
  Page,
  PageHeader,
  ProgressBar,
  RingMeter,
  SectionTitle,
} from '../components/ui/CashewUI';
import { dateLong, dateShort, money } from '../lib/format';
import { calculateHealthScore } from '../lib/healthScore';
import { generateFinancialStatement } from '../lib/pdfReport';

Chart.register(...registerables);

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function useCountUp(target, duration = 850) {
  const [value, setValue] = useState(0);
  const raf = useRef();

  useEffect(() => {
    const start = performance.now();
    const step = time => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(Number(target || 0) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

export default function HomePage() {
  const { isMobile } = useFinTrackPlatform();
  const { user, tokenStatus, secsLeft, fmtCountdown, refreshToken } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashAPI.overview(), dashAPI.trends(), budgetAPI.getAll(), goalAPI.getAll()])
      .then(([overviewRes, trendsRes, budgetsRes, goalsRes]) => {
        setOverview(overviewRes.data);
        setTrends(trendsRes.data.data || []);
        setBudgets(budgetsRes.data.data || []);
        setGoals(goalsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const netWorth = useCountUp(overview?.net_worth || 0);
  const savingsRate = Number(overview?.savings_rate || 0);
  const recent = overview?.recent_transactions || [];
  const accounts = overview?.accounts || [];

  const health = calculateHealthScore({
    income: overview?.income,
    expenses: overview?.expenses,
    savings: overview?.savings,
    liquidBalance: overview?.net_worth,
    budgets,
    subscriptions: overview?.subscriptions || [],
  });

  const handleDownloadStatement = () => {
    try {
      generateFinancialStatement({
        user,
        periodLabel: `${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Statement`,
        overview,
        accounts,
        transactions: overview?.recent_transactions || [],
        budgets,
      });
      toast.success('Generated financial statement');
    } catch {
      toast.error('Failed to generate statement');
    }
  };

  const labels = trends.map(row => {
    if (!row?.month) return '';
    const [year, month] = row.month.split('-');
    return new Date(year, (month || 1) - 1).toLocaleString('en-IN', { month: 'short' });
  });

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const posColor = isDark ? '#4ADE80' : '#15803D';
  const posBg = isDark ? 'rgba(74, 222, 128, 0.12)' : 'rgba(21, 128, 61, 0.08)';
  const negColor = isDark ? '#FDA4AF' : '#B42318';
  const negBg = isDark ? 'rgba(253, 164, 175, 0.12)' : 'rgba(180, 35, 24, 0.08)';
  const gridColor = isDark ? 'rgba(255, 241, 242, 0.08)' : 'rgba(112, 38, 50, 0.08)';
  const textColor = isDark ? '#D0BFC7' : '#74636A';

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: trends.map(row => row.income),
        borderColor: posColor,
        backgroundColor: posBg,
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: posColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Expenses',
        data: trends.map(row => row.expenses),
        borderColor: negColor,
        backgroundColor: negBg,
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: negColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          color: textColor,
          font: { family: 'inherit', size: 11, weight: 600 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(36, 27, 35, 0.94)' : 'rgba(31, 23, 32, 0.94)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: isDark ? 'rgba(255, 241, 242, 0.15)' : 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        cornerRadius: 8,
        usePointStyle: true,
        callbacks: {
          label: ctx => `  ${ctx.dataset.label}: ${money(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 11, weight: 500 } },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 11, weight: 500 }, callback: value => money(value, true) },
      },
    },
  };

  if (loading) {
    return (
      <Page>
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 420 }}>
          <div className="spinner" />
        </div>
      </Page>
    );
  }

  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, lastDay - today.getDate() + 1);
  const totalBudgets = budgets.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const totalSpent = Number(overview?.expenses || 0);
  const remainingBudget = Math.max(0, totalBudgets - totalSpent);
  const safeToSpendDaily = totalBudgets > 0 
    ? Math.round(remainingBudget / daysRemaining) 
    : Math.round(Math.max(0, Number(overview?.income || 0) - totalSpent) / daysRemaining);
  const budgetPercent = totalBudgets > 0 ? Math.min(100, Math.round((totalSpent / totalBudgets) * 100)) : 0;

  // MOBILE LAYOUT (< 1024px / Capacitor APK: Hero Card + Account Pills + Quick Action Strip + Grouped Feed)
  if (isMobile) {
    return (
      <Page>
        {/* Mobile Header Greeting */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'User'}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', marginTop: 2, letterSpacing: '-0.02em' }}>
            Daily Command
          </h1>
        </div>

        {/* 1. Safe-to-Spend Daily Allowance Hero Card */}
        <div className="mobile-safe-spend-hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--brand-primary)' }}>
                Safe-to-Spend Today
              </span>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {money(safeToSpendDaily)}
              </div>
            </div>
            <span className="badge-pill badge-pill-mint" style={{ fontSize: '0.72rem', padding: '4px 10px', fontWeight: 800 }}>
              {daysRemaining}d left
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            {totalBudgets > 0
              ? `${money(remainingBudget)} unspent of ${money(totalBudgets)} monthly target`
              : `${money(overview?.net_worth || 0)} current liquid net worth`}
          </div>
          <ProgressBar value={budgetPercent} tone={budgetPercent > 90 ? 'pink' : budgetPercent > 70 ? 'amber' : 'mint'} />
        </div>

        {/* 2. Horizontal Swipeable Account Pills */}
        {accounts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 2px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Accounts & Liquidity
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                Net: {money(netWorth)}
              </span>
            </div>
            <div className="mobile-accounts-scroll">
              {accounts.map(acc => (
                <div key={acc.id} className="mobile-account-pill">
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {acc.name}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {money(acc.balance)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-soft)', marginTop: 2, textTransform: 'capitalize' }}>
                    {acc.type || 'Account'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. 3-Button Quick Action Strip */}
        <div className="mobile-quick-actions-strip">
          <button
            type="button"
            className="mobile-quick-action-btn"
            onClick={() => navigate('/transactions?action=new')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-soft)', color: 'var(--brand-primary)', display: 'grid', placeItems: 'center' }}>
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <span>Add Expense</span>
          </button>

          <button
            type="button"
            className="mobile-quick-action-btn"
            onClick={() => navigate('/transactions?action=scan')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(14, 165, 233, 0.12)', color: '#0284c7', display: 'grid', placeItems: 'center' }}>
              <ReceiptText size={18} />
            </div>
            <span>Scan Receipt</span>
          </button>

          <button
            type="button"
            className="mobile-quick-action-btn"
            onClick={() => navigate('/split')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'grid', placeItems: 'center' }}>
              <Compass size={18} />
            </div>
            <span>Split Bill</span>
          </button>
        </div>

        {/* 4. Compact Financial Health Pill */}
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-body" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'var(--surface-strong)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  fontSize: '1rem',
                  color: health.score >= 80 ? 'var(--status-positive)' : 'var(--status-warning)',
                }}>
                  {health.score}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
                    FinTrack Health Index
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {health.tier} • Runway: {health.breakdown.liquidity.months} mo
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/analytics')}
                style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Insights &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* 5. Mobile Recent Transactions Feed (2-Line Cards) */}
        <div className="data-card" style={{ marginBottom: 16 }}>
          <div className="data-card-header" style={{ padding: '12px 16px' }}>
            <div className="data-card-title">
              <ReceiptText size={16} color="var(--brand-primary)" />
              <span style={{ fontSize: '0.86rem' }}>Recent Ledger Feed</span>
            </div>
            <button
              type="button"
              className="data-card-action"
              onClick={() => navigate('/transactions')}
              style={{ fontSize: '0.76rem' }}
            >
              All ({recent.length}) &rarr;
            </button>
          </div>
          <div className="data-card-body" style={{ padding: '4px 14px 12px' }}>
            {recent.length > 0 ? (
              recent.slice(0, 5).map(txn => (
                <div
                  key={txn.id}
                  className="modern-row"
                  onClick={() => navigate('/transactions')}
                  style={{ padding: '10px 0', cursor: 'pointer' }}
                >
                  <div className="modern-row-avatar" style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: txn.type === 'income' ? 'rgba(21, 128, 61, 0.12)' : 'rgba(180, 35, 24, 0.12)',
                    color: txn.type === 'income' ? 'var(--status-positive)' : 'var(--status-negative)',
                  }}>
                    {txn.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                  </div>
                  <div className="modern-row-info">
                    <div className="modern-row-title" style={{ fontSize: '0.84rem' }}>{txn.title}</div>
                    <div className="modern-row-meta" style={{ fontSize: '0.7rem' }}>
                      <span>{dateShort(txn.date)}</span>
                      <span>•</span>
                      <span>{txn.category_name || 'General'}</span>
                    </div>
                  </div>
                  <div className={`modern-row-amount ${txn.type === 'income' ? 'amount-positive' : 'amount-negative'}`} style={{ fontSize: '0.88rem' }}>
                    {txn.type === 'income' ? '+' : '-'}{money(txn.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No recent entries. Tap + to record your first transaction.
              </div>
            )}
          </div>
        </div>

        {/* 6. Active Budgets Progress */}
        {budgets.length > 0 && (
          <div className="data-card">
            <div className="data-card-header" style={{ padding: '12px 16px' }}>
              <div className="data-card-title">
                <ChartPie size={16} color="var(--brand-primary)" />
                <span style={{ fontSize: '0.86rem' }}>Active Budget Ceilings</span>
              </div>
              <button
                type="button"
                className="data-card-action"
                onClick={() => navigate('/budgets')}
                style={{ fontSize: '0.76rem' }}
              >
                Manage &rarr;
              </button>
            </div>
            <div className="data-card-body" style={{ padding: '12px 16px' }}>
              {budgets.slice(0, 3).map(b => {
                const spent = Number(b.spent || b.spent_amount || 0);
                const limit = Number(b.amount || 1);
                const pct = Math.min(100, Math.round((spent / limit) * 100));
                const isOver = spent > limit;
                return (
                  <div key={b.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                        {b.emoji || '🏷️'} {b.name}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: isOver ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>
                        {money(spent)} / {money(limit)}
                      </span>
                    </div>
                    <ProgressBar value={pct} tone={isOver ? 'pink' : pct > 80 ? 'amber' : 'mint'} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Page>
    );
  }

  // DESKTOP LAYOUT (>= 1024px: 4-Column KPI row + Cashflow Trends Area Chart + 2-Column Responsive Dashboard)
  return (
    <Page>
      <PageHeader
        eyebrow={dateLong(new Date())}
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'User'}`}
        subtitle="Real-time financial intelligence across your cashflow, budgets, investments, and debt."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="quick-action-pill"
              onClick={handleDownloadStatement}
              style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', cursor: 'pointer' }}
            >
              <Download size={14} color="#8b5cf6" />
              <span>PDF Statement</span>
            </button>
            <Button variant="primary" onClick={() => navigate('/transactions')}>
              <Plus size={16} /> New Transaction
            </Button>
          </div>
        }
      />

      {tokenStatus && tokenStatus !== 'valid' && typeof fmtCountdown === 'function' && (
        <Card tone={tokenStatus === 'critical' ? 'pink' : 'amber'} style={{ marginBottom: 18, cursor: 'pointer' }} onClick={refreshToken}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: tokenStatus === 'critical' ? '#ef4444' : '#f59e0b' }}>
                {tokenStatus === 'critical' ? 'Session Expiring Immediately' : 'Session Refresh Available'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                JWT expires in {fmtCountdown(secsLeft)}. Click here to silently renew your secure token.
              </div>
            </div>
            <span className="badge-pill badge-pill-amber">Refresh Now</span>
          </div>
        </Card>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="metric-grid">
        <div className="card-stagger">
          <MetricCard
            label="Total Net Worth"
            value={money(netWorth)}
            helper="Liquid + Portfolio Assets"
            icon={<Wallet />}
            tone="blue"
            trend="up"
            trendValue="+12.4%"
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Monthly Inflow"
            value={money(overview?.income)}
            helper="Earned this month"
            icon={<TrendingUp />}
            tone="mint"
            trend="up"
            trendValue="+5.8%"
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Monthly Outflow"
            value={money(overview?.expenses)}
            helper="Spent this month"
            icon={<ArrowDownRight />}
            tone="pink"
            trend={Number(overview?.expenses) > Number(overview?.income) ? 'down' : 'up'}
            trendValue="Spend"
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Monthly Net Saved"
            value={money(overview?.savings)}
            helper={`${savingsRate}% savings rate`}
            icon={<Flag />}
            tone="purple"
            trend={Number(overview?.savings) >= 0 ? 'up' : 'down'}
            trendValue={`${savingsRate}%`}
          />
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="quick-actions-bar">
        <button type="button" className="quick-action-pill card-stagger" onClick={() => navigate('/transactions')}>
          <span className="quick-action-pill-icon" style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}>+</span>
          <span>Add Transaction</span>
        </button>
        <button type="button" className="quick-action-pill card-stagger" onClick={() => navigate('/budgets')}>
          <span className="quick-action-pill-icon" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0284c7' }}><ChartPie size={13} /></span>
          <span>Budgets ({budgets.length})</span>
        </button>
        <button type="button" className="quick-action-pill card-stagger" onClick={() => navigate('/goals')}>
          <span className="quick-action-pill-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}><Target size={13} /></span>
          <span>Savings Goals ({goals.length})</span>
        </button>
        <button type="button" className="quick-action-pill card-stagger" onClick={() => navigate('/investments')}>
          <span className="quick-action-pill-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}><TrendingUp size={13} /></span>
          <span>Investments</span>
        </button>
        <button type="button" className="quick-action-pill card-stagger" onClick={() => navigate('/loans')}>
          <span className="quick-action-pill-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}><Banknote size={13} /></span>
          <span>Loans & EMI</span>
        </button>
        <button type="button" className="quick-action-pill card-stagger" onClick={() => navigate('/calculators')}>
          <span className="quick-action-pill-icon" style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}>₹</span>
          <span>Calculators Suite</span>
        </button>
      </div>

      {/* AI Financial Health Score & Velocity Intelligence Hub */}
      <div
        className="data-card card-stagger"
        style={{
          marginBottom: 20,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="data-card-body" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            {/* Health Score Pillar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'var(--surface-strong)',
                  border: '2px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: health.score >= 80 ? 'var(--status-positive)' : health.score >= 60 ? 'var(--status-info)' : 'var(--status-warning)', lineHeight: 1 }}>
                  {health.score}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
                  Score
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="var(--status-positive)" />
                  <strong style={{ fontSize: '0.96rem', color: 'var(--text)' }}>FinTrack Health Index</strong>
                  <span className={`badge-pill ${health.badgeClass}`} style={{ fontSize: '0.7rem' }}>{health.tier}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Savings: <strong>{health.breakdown.savings.rate}</strong> • Runway: <strong>{health.breakdown.liquidity.months} mo</strong> • Budgets: <strong>{health.breakdown.budget.score}/25</strong>
                </div>
              </div>
            </div>

            {/* Velocity / Run-rate Indicator */}
            <div style={{ flex: 1, minWidth: 280, borderLeft: '1px solid var(--border-subtle)', paddingLeft: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Zap size={14} color={health.velocity.tone === 'pink' ? 'var(--status-negative)' : health.velocity.tone === 'amber' ? 'var(--status-warning)' : 'var(--status-positive)'} />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)' }}>
                  {health.velocity.title}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  (Day {health.velocity.daysElapsed} of {health.velocity.daysTotal})
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {health.tips[0]?.detail || health.velocity.description}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => navigate('/analytics')}
                className="data-card-action"
                style={{ fontSize: '0.8rem', padding: '6px 12px', background: 'var(--surface-strong)', borderRadius: 8, border: '1px solid var(--border)' }}
              >
                Deep Insights &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Left / Main Column */}
        <div className="dashboard-column">
          {/* Cashflow Trends Area Chart */}
          <div className="data-card card-stagger">
            <div className="data-card-header">
              <div className="data-card-title">
                <TrendingUp size={18} style={{ color: 'var(--status-positive)' }} />
                <span>Cash Flow Trends</span>
              </div>
              <button type="button" className="data-card-action" onClick={() => navigate('/analytics')}>
                Deep Analytics &rarr;
              </button>
            </div>
            <div className="data-card-body" style={{ padding: '16px 20px 24px' }}>
              <div style={{ height: 260, position: 'relative' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Recent Activity Ledger */}
          <div className="data-card card-stagger">
            <div className="data-card-header">
              <div className="data-card-title">
                <ReceiptText size={18} style={{ color: '#0284c7' }} />
                <span>Recent Ledger Transactions</span>
              </div>
              <button type="button" className="data-card-action" onClick={() => navigate('/transactions')}>
                View all ({recent.length}) &rarr;
              </button>
            </div>
            <div className="data-card-body" style={{ padding: '8px 20px 14px' }}>
              {recent.length > 0 ? (
                recent.slice(0, 6).map(txn => (
                  <div key={txn.id} className="modern-row">
                    <div className="modern-row-avatar" style={{
                      background: txn.type === 'income' ? 'var(--mint-subtle, rgba(21, 128, 61, 0.12))' : 'var(--bg-danger-subtle, rgba(180, 35, 24, 0.12))',
                      color: txn.type === 'income' ? 'var(--status-positive)' : 'var(--status-negative)',
                    }}>
                      {txn.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div className="modern-row-info">
                      <div className="modern-row-title">{txn.title}</div>
                      <div className="modern-row-meta">
                        <span>{dateShort(txn.date)}</span>
                        <span>•</span>
                        <span className="badge-pill badge-pill-neutral" style={{ padding: '1px 6px', fontSize: '0.7rem' }}>
                          {txn.category_name || 'General'}
                        </span>
                        {txn.account_name && (
                          <>
                            <span>•</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-soft)' }}>{txn.account_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`modern-row-amount ${txn.type === 'income' ? 'amount-positive' : 'amount-negative'}`}>
                      {txn.type === 'income' ? '+' : '-'}{money(txn.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon={<ReceiptText />} title="No transactions recorded" text="Log your first income or expense to activate cash flow intelligence." />
              )}
            </div>
          </div>

          {/* Active Budgets Card */}
          <div className="data-card card-stagger">
            <div className="data-card-header">
              <div className="data-card-title">
                <ChartPie size={18} style={{ color: '#f59e0b' }} />
                <span>Active Budgets</span>
              </div>
              <button type="button" className="data-card-action" onClick={() => navigate('/budgets')}>
                Manage Budgets &rarr;
              </button>
            </div>
            <div className="data-card-body">
              {budgets.length > 0 ? (
                budgets.slice(0, 4).map(b => {
                  const spent = Number(b.spent || b.spent_amount || 0);
                  const limit = Number(b.amount || 1);
                  const pct = Math.min(100, Math.round((spent / limit) * 100));
                  const isOver = spent > limit;
                  return (
                    <div key={b.id} style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.2rem' }}>{b.emoji || '🏷️'}</span>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{b.name}</strong>
                          {isOver && <span className="badge-pill badge-pill-pink">Over Budget</span>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isOver ? '#ef4444' : 'var(--text)' }}>
                            {money(spent)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> of {money(limit)}</span>
                        </div>
                      </div>
                      <ProgressBar value={pct} tone={isOver ? 'pink' : pct > 80 ? 'amber' : 'mint'} />
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                  No active budgets created yet. Set monthly spending targets to prevent overspending.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right / Sidebar Column */}
        <div className="dashboard-column">
          {/* Connected Accounts */}
          {accounts.length > 0 && (
            <div className="data-card card-stagger">
              <div className="data-card-header">
                <div className="data-card-title">
                  <WalletCards size={18} style={{ color: '#0284c7' }} />
                  <span>Accounts & Liquidity</span>
                </div>
                <span className="badge-pill badge-pill-neutral">{accounts.length} Active</span>
              </div>
              <div className="data-card-body" style={{ padding: '8px 20px 14px' }}>
                {accounts.map(acc => (
                  <div key={acc.id} className="modern-row">
                    <div className="modern-row-avatar" style={{ fontSize: '1rem', background: 'var(--surface-strong)' }}>
                      💳
                    </div>
                    <div className="modern-row-info">
                      <div className="modern-row-title">{acc.name}</div>
                      <div className="modern-row-meta" style={{ textTransform: 'capitalize' }}>
                        {acc.type || 'Standard Account'}
                      </div>
                    </div>
                    <div className="modern-row-amount amount-positive">
                      {money(acc.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Savings Goals Snapshot */}
          <div className="data-card card-stagger">
            <div className="data-card-header">
              <div className="data-card-title">
                <Target size={18} style={{ color: '#8b5cf6' }} />
                <span>Savings Goals</span>
              </div>
              <button type="button" className="data-card-action" onClick={() => navigate('/goals')}>
                All Goals &rarr;
              </button>
            </div>
            <div className="data-card-body">
              {goals.length > 0 ? (
                goals.slice(0, 3).map(g => {
                  const saved = Number(g.saved_amount || g.current_amount || 0);
                  const target = Number(g.target_amount || 1);
                  const pct = Math.min(100, Math.round((saved / target) * 100));
                  return (
                    <div key={g.id} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.2rem' }}>{g.emoji || '🎯'}</span>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{g.name}</strong>
                        </div>
                        <span className="badge-pill badge-pill-purple">{pct}%</span>
                      </div>
                      <ProgressBar value={pct} tone="purple" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <span>Saved: {money(saved)}</span>
                        <span>Target: {money(target)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>
                  No savings goals defined yet. Plan for emergencies, vacations, or down-payments.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Bills & Subscriptions */}
          <div className="data-card card-stagger">
            <div className="data-card-header">
              <div className="data-card-title">
                <Banknote size={18} style={{ color: '#f43f5e' }} />
                <span>Upcoming Subscriptions</span>
              </div>
              <button type="button" className="data-card-action" onClick={() => navigate('/subscriptions')}>
                Manage &rarr;
              </button>
            </div>
            <div className="data-card-body" style={{ padding: '8px 20px 14px' }}>
              {(overview?.subscriptions || []).length > 0 ? (
                (overview?.subscriptions || []).slice(0, 4).map(sub => (
                  <div key={sub.id} className="modern-row">
                    <div className="modern-row-avatar" style={{ fontSize: '1.1rem', background: 'rgba(244, 63, 94, 0.08)' }}>
                      {sub.icon || '📅'}
                    </div>
                    <div className="modern-row-info">
                      <div className="modern-row-title">{sub.name}</div>
                      <div className="modern-row-meta">
                        <span className="badge-pill badge-pill-pink" style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                          Due: {sub.next_due || 'Soon'}
                        </span>
                      </div>
                    </div>
                    <div className="modern-row-amount amount-negative">
                      -{money(sub.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>
                  No upcoming subscription renewals found.
                </div>
              )}
            </div>
          </div>

          {/* Investments Snapshot */}
          <div className="data-card">
            <div className="data-card-header">
              <div className="data-card-title">
                <TrendingUp size={18} style={{ color: 'var(--status-positive)' }} />
                <span>Portfolio Snapshot</span>
              </div>
              <button type="button" className="data-card-action" onClick={() => navigate('/investments')}>
                Portfolio &rarr;
              </button>
            </div>
            <div className="data-card-body">
              {(overview?.investments || []).length > 0 ? (
                (overview?.investments || []).slice(0, 3).map(inv => {
                  const invested = Number(inv.invested_amount || 0);
                  const current = Number(inv.current_value || 0);
                  const gain = current - invested;
                  const gainPct = invested > 0 ? (gain / invested) * 100 : 0;
                  return (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text)', display: 'block' }}>{inv.name}</strong>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Invested: {money(invested)}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>{money(current)}</div>
                        <span className={`badge-pill ${gainPct >= 0 ? 'badge-pill-mint' : 'badge-pill-pink'}`} style={{ fontSize: '0.68rem', padding: '1px 5px' }}>
                          {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>
                  No investment holdings added yet. Track mutual funds, stocks, gold, and PPF.
                </div>
              )}
            </div>
          </div>

          {/* Explore & Suggest Discovery Card */}
          <div
            className="data-card card-stagger"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/explore')}
          >
            <div className="data-card-body" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--text)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text)', display: 'block' }}>
                    Explore & Suggest
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Indian Investment & Protection Hub
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: 12 }}>
                Discover verified products from zero: Gold & Silver (incl. Aura Gold), SIP, Stocks, IPOs, LIC, and Health Protection.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2563eb' }}>
                  Start Discovery &rarr;
                </span>
                <span className="badge-pill badge-pill-blue" style={{ fontSize: '0.68rem' }}>
                  12 Categories
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
