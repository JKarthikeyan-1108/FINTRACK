import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ChartPie, Edit3, Plus, Trash2, WalletCards } from 'lucide-react';
import { categoryAPI, budgetAPI } from '../services/api';
import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  FAB,
  Page,
  PageHeader,
  ProgressBar,
  RingMeter,
  SegmentedControl,
  SelectInput,
  TextInput,
  VisualCategorySelect,
} from '../components/ui/CashewUI';
import { money } from '../lib/format';

const COLORS = ['#6fb36e', '#4b82b8', '#d65f87', '#c58a21', '#8a68c3', '#58a79f', '#d7764a', '#7aa95c'];
const PERIODS = ['monthly', 'weekly', 'yearly'];
const PERIOD_LABEL = { monthly: 'This month', weekly: 'This week', yearly: 'This year' };

function todayProgress() {
  const now = new Date();
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (now.getDate() / total) * 100;
}

const blankForm = () => ({
  name: '',
  category_id: '',
  amount: '',
  period: 'monthly',
  color: '#6fb36e',
  start_date: new Date().toISOString().split('T')[0],
});

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blankForm());

  function loadBudgets() {
    budgetAPI.getAll()
      .then(({ data }) => setBudgets(data.data || []))
      .catch(() => toast.error('Failed to load budgets'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.data || [])).catch(() => {});
    loadBudgets();
  }, []);

  const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + Number(budget.spent || budget.spent_amount || 0), 0);
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const remaining = totalBudget - totalSpent;
  const overCount = budgets.filter(budget => Number(budget.spent || budget.spent_amount || 0) > Number(budget.amount)).length;

  function openCreate() {
    setEditId(null);
    setForm(blankForm());
    setModal(true);
  }

  function openEdit(budget) {
    setEditId(budget.id);
    setForm({
      name: budget.name,
      category_id: String(budget.category_id || ''),
      amount: String(budget.amount),
      period: budget.period || 'monthly',
      color: budget.color || '#6fb36e',
      start_date: budget.start_date || new Date().toISOString().split('T')[0],
    });
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditId(null);
    setForm(blankForm());
  }

  async function saveBudget() {
    if (!form.name || !form.amount) {
      toast.error('Name and amount are required');
      return;
    }

    try {
      if (editId) {
        const { data } = await budgetAPI.update(editId, form);
        setBudgets(prev => prev.map(budget => budget.id === editId ? { ...budget, ...data.data } : budget));
        toast.success('Budget updated');
      } else {
        const { data } = await budgetAPI.create(form);
        setBudgets(prev => [data.data, ...prev]);
        toast.success('Budget created');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save budget');
    }
  }

  async function deleteBudget(id) {
    try {
      await budgetAPI.remove(id);
      setBudgets(prev => prev.filter(budget => budget.id !== id));
      toast.success('Budget deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Planning"
        title="Budgets"
        subtitle="See how much of the month has passed and how much of your plan is still available."
        action={<Button onClick={openCreate}><Plus size={18} /> New</Button>}
      />

      {budgets.length > 0 && (
        <Card tone={overCount ? 'amber' : 'mint'} className="hero-balance" style={{ marginBottom: 16 }}>
          <div className="budget-card-header">
            <div>
              <span className="hero-balance-label">Monthly spending</span>
              <strong>{money(totalSpent)}</strong>
              <small>of {money(totalBudget)} planned</small>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ fontSize: 30 }}>{overallPct.toFixed(0)}%</strong>
              <small>used</small>
            </div>
          </div>
          <ProgressBar value={overallPct} tone={overCount ? 'amber' : 'mint'} markerLabel="Spend" />
          <ProgressBar value={todayProgress()} tone="blue" markerLabel="Today" />
          <div className="hero-balance-grid">
            <div className="mini-stat">
              <span>Remaining</span>
              <strong className={remaining >= 0 ? 'amount-income' : 'amount-expense'}>{money(remaining)}</strong>
            </div>
            <div className="mini-stat">
              <span>Watchlist</span>
              <strong>{overCount ? `${overCount} over` : 'On plan'}</strong>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<ChartPie />}
          title="No budgets yet"
          text="Create monthly, weekly, or yearly spending envelopes to track limits like Cashew."
          action={<Button onClick={openCreate}><Plus size={18} /> Create budget</Button>}
        />
      ) : (
        <div className="budget-list">
          {budgets.map(budget => {
            const spent = Number(budget.spent || budget.spent_amount || 0);
            const limit = Number(budget.amount);
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over = spent > limit;
            const left = limit - spent;

            return (
              <Card key={budget.id}>
                <div className="budget-row">
                  <RingMeter value={pct} tone={over ? 'pink' : 'mint'} />
                  <div className="budget-row-main">
                    <div className="budget-row-title">
                      <strong>{budget.category_name || budget.name}</strong>
                      <b className={over ? 'amount-expense' : 'amount-income'}>{money(spent)}</b>
                    </div>
                    <div className="budget-row-meta">
                      <span>{PERIOD_LABEL[budget.period] || budget.period}</span>
                      <span>of {money(limit)}</span>
                    </div>
                    <ProgressBar value={pct} tone={over ? 'pink' : 'mint'} />
                    <div className="budget-row-meta">
                      <span className={over ? 'amount-expense' : ''}>{over ? `Over by ${money(spent - limit)}` : `${money(left)} left`}</span>
                      <span className="row-actions">
                        <button onClick={() => openEdit(budget)}><Edit3 size={13} /> Edit</button>
                        <button onClick={() => deleteBudget(budget.id)}><Trash2 size={13} /> Delete</button>
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FAB icon={<Plus size={24} />} label="Create budget" onClick={openCreate} />

      {modal && (
        <BottomSheet title={editId ? 'Edit Budget' : 'Create Budget'} onClose={closeModal}>
          <div className="field" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Category</label>
              <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>See All</button>
            </div>
            <VisualCategorySelect 
              categories={[{ id: '', name: 'General', icon: '📦' }, ...categories.filter(c => c.type === 'expense').slice(0, 7)]} 
              value={form.category_id} 
              onChange={val => {
                const cat = categories.find(c => String(c.id) === val);
                setForm(prev => ({ ...prev, category_id: val, name: cat ? cat.name : 'General Budget' }));
              }} 
              label=""
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Budget Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: '#64748b', fontWeight: 600, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 32, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}
                placeholder="0.00"
                value={form.amount}
                onChange={event => setForm(prev => ({ ...prev, amount: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Period</label>
            <SegmentedControl
              value={form.period}
              onChange={value => setForm(prev => ({ ...prev, period: value }))}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Start Date</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 13, color: '#64748b' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </span>
              <input 
                type="date"
                className="input"
                style={{ paddingLeft: 40, color: '#0f172a', fontWeight: 500 }}
                value={form.start_date}
                onChange={event => setForm(prev => ({ ...prev, start_date: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>End Date (Optional)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 13, color: '#64748b' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </span>
              <input 
                type="date"
                className="input"
                style={{ paddingLeft: 40, color: '#0f172a', fontWeight: 500 }}
                placeholder="Select date"
                value={form.end_date || ''}
                onChange={event => setForm(prev => ({ ...prev, end_date: event.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', background: '#f0f9ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', color: '#0284c7', fontSize: '0.85rem', lineHeight: 1.5 }}>
            <span style={{ fontSize: '1rem' }}>💡</span>
            <span>A monthly budget helps you stay on track with your long-term goals.</span>
          </div>

          <Button className="ui-button-full" onClick={saveBudget} style={{ background: '#10b981', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
            {editId ? 'Save Changes' : 'Create Budget'}
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}
