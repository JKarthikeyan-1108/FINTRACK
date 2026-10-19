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
        eyebrow="Financial Discipline"
        title="Budgets"
        subtitle="Envelopes and thresholds to keep your monthly spending within plan."
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} /> Create Budget
          </Button>
        }
      />

      {budgets.length > 0 && (
        <div className="data-card card-stagger" style={{ marginBottom: 20 }}>
          <div className="data-card-body" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Total Monthly Envelope
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                  <strong style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                    {money(totalSpent)}
                  </strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    spent of {money(totalBudget)}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge-pill ${overCount > 0 ? 'badge-pill-pink' : 'badge-pill-mint'}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                  {overallPct.toFixed(0)}% Utilized
                </span>
                <span className={`badge-pill ${overCount > 0 ? 'badge-pill-amber' : 'badge-pill-neutral'}`} style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                  {overCount > 0 ? `${overCount} Over Budget` : 'All On Track'}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Budget Spent ({overallPct.toFixed(0)}%)</span>
                <span>Month Elapsed ({todayProgress().toFixed(0)}%)</span>
              </div>
              <ProgressBar value={overallPct} tone={overCount ? 'pink' : 'mint'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining Cap</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: remaining >= 0 ? '#10b981' : '#f43f5e' }}>
                  {money(remaining)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Envelopes</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: 'var(--text)' }}>
                  {budgets.length} Categories
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Discipline Status</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: overallPct <= todayProgress() ? '#10b981' : '#f59e0b' }}>
                  {overallPct <= todayProgress() ? 'Ahead of Pace' : 'Above Pace'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<ChartPie />}
          title="No budgets configured"
          text="Create monthly or weekly envelopes to keep essential and discretionary spending on plan."
          action={<Button onClick={openCreate}><Plus size={16} /> Create budget</Button>}
        />
      ) : (
        <div className="category-grid-animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {budgets.map(budget => {
            const spent = Number(budget.spent || budget.spent_amount || 0);
            const limit = Number(budget.amount);
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const over = spent > limit;
            const left = limit - spent;

            return (
              <div key={budget.id} className="data-card card-stagger" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="data-card-header" style={{ padding: '14px 18px', background: 'var(--surface-strong)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: '1rem' }}>
                      🏷️
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                        {budget.category_name || budget.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {PERIOD_LABEL[budget.period] || budget.period}
                      </div>
                    </div>
                  </div>
                  <span className={`badge-pill ${over ? 'badge-pill-pink' : 'badge-pill-mint'}`}>
                    {over ? 'Over Limit' : `${(100 - pct).toFixed(0)}% Left`}
                  </span>
                </div>

                <div className="data-card-body" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: over ? '#f43f5e' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {money(spent)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        limit of {money(limit)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: over ? '#f43f5e' : '#10b981' }}>
                        {over ? `+${money(spent - limit)}` : `${money(left)} left`}
                      </span>
                    </div>
                  </div>

                  <ProgressBar value={pct} tone={over ? 'pink' : 'mint'} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {pct.toFixed(0)}% consumed
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => openEdit(budget)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid var(--border)', background: 'var(--surface-strong)', color: 'var(--text)', borderRadius: 6, padding: '3px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <Edit3 size={11} /> Edit
                      </button>
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: 6, padding: '3px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FAB icon={<Plus size={22} />} label="Create budget" onClick={openCreate} />

      {modal && (
        <BottomSheet title={editId ? 'Edit Budget Envelope' : 'Create Budget Envelope'} onClose={closeModal}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Category
            </label>
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

          <div className="field" style={{ marginBottom: 18, background: 'var(--surface-strong)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Envelope Limit
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>₹</span>
              <input 
                type="number"
                step="any"
                className="input"
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  fontSize: '1.85rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  boxShadow: 'none',
                  fontVariantNumeric: 'tabular-nums',
                  height: 'auto',
                  minHeight: 'auto',
                }}
                placeholder="0.00"
                value={form.amount}
                onChange={event => setForm(prev => ({ ...prev, amount: event.target.value }))}
                autoFocus
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Recurrence Period
            </label>
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
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Start Date
            </label>
            <input 
              type="date"
              className="input"
              style={{ color: 'var(--text)', fontWeight: 500 }}
              value={form.start_date}
              onChange={event => setForm(prev => ({ ...prev, start_date: event.target.value }))}
            />
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              End Date (Optional)
            </label>
            <input 
              type="date"
              className="input"
              style={{ color: 'var(--text)', fontWeight: 500 }}
              value={form.end_date || ''}
              onChange={event => setForm(prev => ({ ...prev, end_date: event.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--surface-strong)', padding: '12px 16px', borderRadius: '8px', marginBottom: '22px', border: '1px solid var(--border)', fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '1rem' }}>💡</span>
            <span>FinTrack alerts you proactively when your category spend reaches 80% and 100% of limits.</span>
          </div>

          <Button className="ui-button-full" onClick={saveBudget} style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
            {editId ? 'Save Envelope Changes' : 'Activate Budget Envelope'}
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}
