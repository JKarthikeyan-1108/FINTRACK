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
        borderColor: '#315f3b',
        backgroundColor: 'rgba(111,179,110,.18)',
        borderWidth: 3,
        tension: 0.42,
        fill: true,
        pointRadius: 0,
      },
      {
        label: 'Expenses',
        data: trends.map(row => row.expenses),
        borderColor: '#c84d4d',
        backgroundColor: 'rgba(200,77,77,.08)',
        borderWidth: 3,
        tension: 0.42,
        fill: true,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8d978f', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(17,23,25,.06)' },
        ticks: { color: '#8d978f', font: { size: 11 }, callback: value => money(value, true) },
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
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle="A calm view of today's money, monthly rhythm, and the places your cash is moving."
        action={<Button variant="primary" onClick={() => navigate('/transactions')}><Plus size={18} /> Add</Button>}
      />

      {tokenStatus && tokenStatus !== 'valid' && typeof fmtCountdown === 'function' && (
        <Card tone={tokenStatus === 'critical' ? 'pink' : 'amber'} style={{ marginBottom: 14 }} onClick={refreshToken}>
          <div className="budget-card-header">
            <div>
              <span className="hero-balance-label">Session</span>
              <strong style={{ fontSize: 18 }}>{tokenStatus === 'critical' ? 'Expiring now' : 'Expiring soon'}</strong>
              <small>JWT expires in {fmtCountdown(secsLeft)}. Tap to refresh.</small>
            </div>
          </div>
        </Card>
      )}

      <div className="metric-grid">
        <MetricCard label="Total Balance" value={money(netWorth)} helper={`Savings Rate: ${savingsRate}%`} icon={<Wallet />} tone="blue" />
        <MetricCard label="Monthly Income" value={money(overview?.income)} helper="This month" icon={<TrendingUp />} tone="mint" />
        <MetricCard label="Monthly Expenses" value={money(overview?.expenses)} helper="This month" icon={<ArrowDownRight />} tone="pink" />
        <MetricCard label="Monthly Savings" value={money(overview?.savings)} helper="Net saved" icon={<Flag />} tone="purple" />
      </div>

      <div className="dashboard-grid">
        <div>
          <SectionTitle>Quick Actions</SectionTitle>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/transactions')}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'grid', placeItems: 'center' }}><Plus size={24} /></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)' }}>Add Txn</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/budgets')}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'grid', placeItems: 'center' }}><ChartPie size={24} /></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)' }}>Budget</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/goals')}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'grid', placeItems: 'center' }}><Target size={24} /></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)' }}>Goal</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/investments')}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'grid', placeItems: 'center' }}><TrendingUp size={24} /></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-soft)' }}>Invest</span>
            </div>
          </div>
          
          <SectionTitle>Income vs Expenses</SectionTitle>
          <Card tone="plain" style={{ padding: 24, boxShadow: '0 12px 32px rgba(0,0,0,0.06)' }}>

            <div className="chart-box" style={{ height: 100, margin: '24px 0' }}>
              <Line data={chartData} options={chartOptions} />
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              {/* Budgets List Card */}
              <Card tone="plain" style={{ flex: 1, minWidth: 280, padding: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Budgets</span>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/budgets')}>View All &rarr;</span>
                </div>
                {budgets.slice(0,3).map(b => (
                  <div key={b.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: '1.5rem', background: '#f1f5f9', padding: 8, borderRadius: 12 }}>{b.emoji || '🍔'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ fontSize: '0.9rem', color: '#334155' }}>{b.name || 'Food'}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{money(b.spent)} / {money(b.amount)}</span>
                        </div>
                        <ProgressBar value={(Number(b.spent) / Number(b.amount)) * 100} tone={Number(b.spent) > Number(b.amount) ? 'pink' : 'mint'} />
                      </div>
                    </div>
                  </div>
                ))}
                {budgets.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No budgets set</div>}
              </Card>

              {/* Goals List Card */}
              <Card tone="plain" style={{ flex: 1, minWidth: 280, padding: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Goals</span>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/goals')}>View All &rarr;</span>
                </div>
                {goals.slice(0,3).map(g => (
                  <div key={g.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: '1.5rem', background: '#f1f5f9', padding: 8, borderRadius: 12 }}>{g.emoji || '💻'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ fontSize: '0.9rem', color: '#334155' }}>{g.name}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{money(g.saved_amount)} / {money(g.target_amount)}</span>
                        </div>
                        <ProgressBar value={(Number(g.saved_amount) / Number(g.target_amount)) * 100} tone="blue" />
                      </div>
                    </div>
                  </div>
                ))}
                {goals.length === 0 && <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No goals set</div>}
              </Card>

              {/* Investments List Card */}
              <Card tone="plain" style={{ flex: 1, minWidth: 280, padding: 20, boxShadow: '0 12px 32px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Investments</span>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>View All &rarr;</span>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: '1.5rem', background: '#f1f5f9', padding: 8, borderRadius: 12 }}>📈</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Mutual Funds</strong>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{money(112500)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Invested: {money(100000)}</span>
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>+12.5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: '1.5rem', background: '#f1f5f9', padding: 8, borderRadius: 12 }}>🏢</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Stocks</strong>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{money(85000)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Invested: {money(80000)}</span>
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>+8.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
              {/* Recent Activity Card */}
              <Card className="list-card" style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 8px 0' }}>
                  <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Recent Transactions</span>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/transactions')}>View All &rarr;</span>
                </div>
                {recent.length > 0 ? (
                  recent.map(txn => (
                    <div key={txn.id} className="transaction-row" style={{ padding: '8px' }}>
                      <div className="transaction-icon">
                        {txn.type === 'income' ? <ArrowUpRight size={21} /> : <ArrowDownRight size={21} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="transaction-title">{txn.title}</div>
                        <div className="transaction-meta">{dateShort(txn.date)} - {txn.category_name || 'General'}</div>
                      </div>
                      <div className={`transaction-amount ${txn.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                        {txn.type === 'income' ? '+' : '-'}{money(txn.amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState icon={<ReceiptText />} title="No transactions yet" text="Add your first transaction." />
                )}
              </Card>

              {/* Upcoming Bills Card */}
              <Card className="list-card" style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 8px 0' }}>
                  <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Upcoming Bills</span>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>View All &rarr;</span>
                </div>
                <div className="transaction-row" style={{ padding: '8px' }}>
                  <div style={{ fontSize: '1.5rem', background: '#fee2e2', padding: 8, borderRadius: 12 }}>🎬</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="transaction-title">Netflix</div>
                    <div className="transaction-meta">Entertainment</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="transaction-amount amount-expense">-{money(499)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>3 days left</div>
                  </div>
                </div>
                <div className="transaction-row" style={{ padding: '8px' }}>
                  <div style={{ fontSize: '1.5rem', background: '#dcfce7', padding: 8, borderRadius: 12 }}>🎵</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="transaction-title">Spotify</div>
                    <div className="transaction-meta">Music</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="transaction-amount amount-expense">-{money(119)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>5 days left</div>
                  </div>
                </div>
              </Card>

              {/* Loans Card */}
              <Card className="list-card" style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '8px 8px 0' }}>
                  <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>Loans</span>
                  <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>View All &rarr;</span>
                </div>
                <div style={{ padding: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Home Loan</strong>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{money(4200000)} left</strong>
                  </div>
                  <ProgressBar value={72} tone="blue" />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, textAlign: 'right' }}>EMI: {money(12500)}</div>
                </div>
                <div style={{ padding: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.9rem', color: '#334155' }}>Car Loan</strong>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{money(120000)} left</strong>
                  </div>
                  <ProgressBar value={40} tone="amber" />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4, textAlign: 'right' }}>EMI: {money(7200)}</div>
                </div>
              </Card>
            </div>
          </Card>
        </div>

        <aside>
          {/* Gamification Widget */}
          <SectionTitle>Your Achievements</SectionTitle>
          <Card style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame size={20} color="#ef4444" fill="#ef4444" />
                <strong style={{ fontSize: '1.05rem', color: 'var(--text)' }}>7 Day Streak!</strong>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You're on fire!</span>
            </div>
            
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(236, 72, 153, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 6px' }}>
                  <Award size={24} color="#ec4899" />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-soft)' }}>Saver</div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 6px' }}>
                  <Target size={24} color="#10b981" />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-soft)' }}>Budgeter</div>
              </div>
              <div style={{ textAlign: 'center', flexShrink: 0, opacity: 0.4 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(100, 116, 139, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 6px' }}>
                  <TrendingUp size={24} color="#64748b" />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-soft)' }}>Investor</div>
              </div>
            </div>
          </Card>

          <SectionTitle>Quick Stats</SectionTitle>
          <div className="metric-grid">
            <MetricCard label="Portfolio" value={money(overview?.portfolio)} helper="Investment value" icon={<TrendingUp />} tone="blue" />
          </div>

          {accounts.length > 0 && (
            <>
              <SectionTitle>Accounts</SectionTitle>
              <Card className="list-card">
                {accounts.map(account => (
                  <div key={account.id} className="account-row">
                    <div className="account-icon">
                      <WalletCards size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong>{account.name}</strong>
                      <small style={{ textTransform: 'capitalize' }}>{account.type || 'Account'}</small>
                    </div>
                    <b>{money(account.balance)}</b>
                  </div>
                ))}
              </Card>
            </>
          )}
        </aside>
      </div>
    </Page>
  );
}
