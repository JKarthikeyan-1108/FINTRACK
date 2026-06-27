import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ChartPie, Edit3, Plus, Trash2, WalletCards } from 'lucide-react';
import { budgetAPI } from '../services/api';
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
  SelectInput,
  TextInput,
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
  const [form, setForm] = useState(blankForm());

  function loadBudgets() {
    budgetAPI.getAll()
      .then(({ data }) => setBudgets(data.data || []))
      .catch(() => toast.error('Failed to load budgets'))
      .finally(() => setLoading(false));
  }

  useEffect(loadBudgets, []);

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
                      <strong>{budget.name}</strong>
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
        <BottomSheet title={editId ? 'Edit Budget' : 'New Budget'} onClose={closeModal}>
          <TextInput label="Budget name" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Food, rent, travel" />
          <TextInput label="Limit amount" type="number" value={form.amount} onChange={event => setForm(prev => ({ ...prev, amount: event.target.value }))} placeholder="0" />
          <SelectInput label="Period" value={form.period} onChange={event => setForm(prev => ({ ...prev, period: event.target.value }))}>
            {PERIODS.map(period => <option key={period} value={period}>{period[0].toUpperCase() + period.slice(1)}</option>)}
          </SelectInput>
          <TextInput label="Start date" type="date" value={form.start_date} onChange={event => setForm(prev => ({ ...prev, start_date: event.target.value }))} />

          <div className="field">
            <span>Color</span>
            <div className="swatch-grid">
              {COLORS.map(color => (
                <button
                  key={color}
                  className={`swatch ${form.color === color ? 'active' : ''}`}
                  style={{ background: color }}
                  aria-label={`Select ${color}`}
                  onClick={() => setForm(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <Button className="ui-button-full" onClick={saveBudget}>
            <WalletCards size={18} /> {editId ? 'Save budget' : 'Create budget'}
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}
