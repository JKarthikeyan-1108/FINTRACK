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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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

  const labels = trends.map(row => {
    if (!row?.month) return '';
    const [year, month] = row.month.split('-');
    return new Date(year, (month || 1) - 1).toLocaleString('en-IN', { month: 'short' });
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: trends.map(row => row.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#10b981',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Expenses',
        data: trends.map(row => row.expenses),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.08)',
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#f43f5e',
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
          color: 'var(--text-muted, #94a3b8)',
          font: { family: 'inherit', size: 11, weight: 600 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255, 255, 255, 0.1)',
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
        ticks: { color: '#94a3b8', font: { size: 11, weight: 500 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94a3b8', font: { size: 11, weight: 500 }, callback: value => money(value, true) },
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

  return (
    <Page>
      <PageHeader
        eyebrow={dateLong(new Date())}
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'User'}`}
        subtitle="Real-time financial intelligence across your cashflow, budgets, investments, and debt."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
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
          <span className="quick-action-pill-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>+</span>
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
          <span className="quick-action-pill-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>₹</span>
          <span>Calculators Suite</span>
        </button>
      </div>

      {/* 2-Column Responsive Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Left / Main Column */}
        <div className="dashboard-column">
          {/* Cashflow Trends Area Chart */}
          <div className="data-card card-stagger">
            <div className="data-card-header">
              <div className="data-card-title">
                <TrendingUp size={18} style={{ color: '#10b981' }} />
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
                      background: txn.type === 'income' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                      color: txn.type === 'income' ? '#10b981' : '#f43f5e',
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
                <TrendingUp size={18} style={{ color: '#10b981' }} />
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
        </div>
      </div>
    </Page>
  );
}
