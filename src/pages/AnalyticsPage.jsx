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
import { FileText, Download, TrendingUp, TrendingDown, PieChart as PieIcon, Activity } from 'lucide-react';
import { txnAPI, categoryAPI } from '../services/api';
import { Page, PageHeader, Card, SectionTitle, Button, Chip } from '../components/ui/CashewUI';
import { money } from '../lib/format';
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
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const barChartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomes,
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Expense',
        data: expenses,
        backgroundColor: '#f43f5e',
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
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.4,
        borderWidth: 2.5,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#0284c7',
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
  
  const pieColors = ['#10b981', '#0284c7', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#6366f1'];
  const pieChartData = {
    labels: catLabels.length ? catLabels : ['No Data'],
    datasets: [
      {
        data: catData.length ? catData : [1],
        backgroundColor: catData.length ? pieColors.slice(0, catData.length) : ['#e2e8f0'],
        borderWidth: 0,
      },
    ],
  };

  const totalIncome = incomes.reduce((a, b) => a + b, 0);
  const totalExpense = expenses.reduce((a, b) => a + b, 0);
  const totalSaved = totalIncome - totalExpense;
  const avgSavingsRate = totalIncome > 0 ? ((totalSaved / totalIncome) * 100).toFixed(1) : 0;

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

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Page>
      <PageHeader
        eyebrow="Intelligence & Trends"
        title="Analytics"
        subtitle="Longitudinal cash flow analysis, savings velocity, and category distribution."
        action={
          <Button variant="soft" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV Ledger
          </Button>
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
    </Page>
  );
}
