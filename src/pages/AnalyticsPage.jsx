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
        backgroundColor: '#22c55e',
        borderRadius: 4,
      },
      {
        label: 'Expense',
        data: expenses,
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
    ],
  };

  const lineChartData = {
    labels,
    datasets: [
      {
        label: 'Savings Rate (%)',
        data: savingsRates,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
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
  
  const pieColors = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f43f5e', '#8b5cf6'];
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
    return <Page><PageHeader title="Analytics" /><div style={{ padding: 20 }}>Loading analytics...</div></Page>;
  }

  return (
    <Page>
      <PageHeader
        title="Deep Analytics"
        subtitle="Insights and trends over the last 12 months"
        action={
          <Button onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="#10b981" /> Total Income (12m)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{money(totalIncome)}</div>
        </Card>
        <Card>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={16} color="#ef4444" /> Total Expense (12m)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{money(totalExpense)}</div>
        </Card>
        <Card>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="#3b82f6" /> Avg Savings Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a' }}>{avgSavingsRate}%</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <Card>
          <SectionTitle>Cashflow Trends</SectionTitle>
          <div style={{ height: 300 }}>
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', paddingBottom: '2rem' }}>
        <Card>
          <SectionTitle>Savings Rate</SectionTitle>
          <div style={{ height: 250 }}>
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
              }}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle>This Month's Spending</SectionTitle>
          <div style={{ height: 220, position: 'relative' }}>
            <Doughnut
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { position: 'right' } },
              }}
            />
          </div>
        </Card>
      </div>
    </Page>
  );
}
