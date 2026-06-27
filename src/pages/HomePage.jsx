import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import toast from 'react-hot-toast';
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  ChartPie,
  Flag,
  Plus,
  ReceiptText,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashAPI } from '../services/api';
import {
  Button,
  Card,
  EmptyState,
  MetricCard,
  Page,
  PageHeader,
  ProgressBar,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashAPI.overview(), dashAPI.trends()])
      .then(([overviewRes, trendsRes]) => {
        setOverview(overviewRes.data);
        setTrends(trendsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const netWorth = useCountUp(overview?.net_worth || 0);
  const savingsRate = Number(overview?.savings_rate || 0);
  const recent = overview?.recent_transactions || [];
  const accounts = overview?.accounts || [];

  const labels = trends.map(row => {
    const [year, month] = row.month.split('-');
    return new Date(year, month - 1).toLocaleString('en-IN', { month: 'short' });
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

      {tokenStatus !== 'valid' && (
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

      <div className="dashboard-grid">
        <div>
          <Card tone="mint" className="hero-balance">
            <div className="hero-balance-top">
              <div>
                <span className="hero-balance-label">Total net worth</span>
                <strong className="hero-balance-value">{money(netWorth)}</strong>
              </div>
              <div className="metric-icon" style={{ width: 48, height: 48 }}>
                <WalletCards size={26} />
              </div>
            </div>

            <div>
              <div className="budget-card-header" style={{ marginBottom: 0 }}>
                <div>
                  <small>Savings rate</small>
                  <strong style={{ fontSize: 26 }}>{savingsRate}%</strong>
                </div>
                <small>{money(overview?.savings)} saved this month</small>
              </div>
              <ProgressBar value={savingsRate} tone="mint" markerLabel="Today" />
            </div>

            <div className="hero-balance-grid">
              <div className="mini-stat">
                <span>Income</span>
                <strong className="amount-income">{money(overview?.income)}</strong>
              </div>
              <div className="mini-stat">
                <span>Expenses</span>
                <strong className="amount-expense">{money(overview?.expenses)}</strong>
              </div>
            </div>
          </Card>

          <SectionTitle>Quick Actions</SectionTitle>
          <div className="quick-action-grid">
            {[
              { label: 'Add txn', path: '/transactions', Icon: Plus },
              { label: 'Budgets', path: '/budgets', Icon: ChartPie },
              { label: 'Goals', path: '/goals', Icon: Target },
              { label: 'Invest', path: '/investments', Icon: TrendingUp },
            ].map(({ label, path, Icon }) => (
              <button key={label} className="quick-action" onClick={() => navigate(path)}>
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {trends.length > 0 && (
            <>
              <SectionTitle>Income vs Expenses</SectionTitle>
              <Card>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <span className="chip chip-mint">Income</span>
                  <span className="chip chip-red">Expenses</span>
                </div>
                <div className="chart-box">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </Card>
            </>
          )}

          <SectionTitle action={<Button variant="soft" onClick={() => navigate('/transactions')}>View all</Button>}>
            Recent Activity
          </SectionTitle>
          {recent.length > 0 ? (
            <Card className="list-card">
              {recent.map(txn => (
                <div key={txn.id} className="transaction-row">
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
              ))}
            </Card>
          ) : (
            <EmptyState
              icon={<ReceiptText />}
              title="No transactions yet"
              text="Add your first transaction and the dashboard will start filling itself in."
              action={<Button onClick={() => navigate('/transactions')}><Plus size={18} /> Add transaction</Button>}
            />
          )}
        </div>

        <aside>
          <div className="metric-grid">
            <MetricCard label="Portfolio" value={money(overview?.portfolio)} helper="Investment value" icon={<TrendingUp />} tone="blue" />
            <MetricCard label="Net Savings" value={money(overview?.savings)} helper="This month" icon={<Flag />} tone="amber" />
            <MetricCard label="Income" value={money(overview?.income)} helper="Monthly inflow" icon={<Banknote />} tone="mint" />
            <MetricCard label="Expenses" value={money(overview?.expenses)} helper="Monthly outflow" icon={<ReceiptText />} tone="pink" />
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
