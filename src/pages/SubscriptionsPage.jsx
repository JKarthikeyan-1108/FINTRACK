import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, CalendarClock, Pause, Play, Plus, Repeat2, Trash2 } from 'lucide-react';
import { subAPI } from '../services/api';
import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  FAB,
  MetricCard,
  Page,
  PageHeader,
  SegmentedControl,
  SelectInput,
  TextInput,
  VisualCategorySelect,
} from '../components/ui/CashewUI';
import { dateShort, daysUntil, money } from '../lib/format';

const PERIODS = ['monthly', 'yearly', 'weekly'];
const SUB_CATEGORIES = [
  { id: 'Entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'Cloud Storage', name: 'Cloud Storage', icon: '☁️' },
  { id: 'Software', name: 'Software', icon: '💻' },
  { id: 'Music', name: 'Music', icon: '🎵' },
  { id: 'Mobile', name: 'Mobile', icon: '📱' },
  { id: 'Shopping', name: 'Shopping', icon: '📦' },
  { id: 'Fitness', name: 'Fitness', icon: '🏋️' },
  { id: 'Education', name: 'Education', icon: '📚' },
  { id: 'Other', name: 'Other', icon: '💰' },
];

const blankForm = () => ({
  name: '',
  icon: 'subscription',
  amount: '',
  period: 'monthly',
  next_due: '',
  category: 'Entertainment',
});

function monthlyEquivalent(sub) {
  if (sub.period === 'yearly') return Number(sub.amount) / 12;
  if (sub.period === 'weekly') return Number(sub.amount) * 4.33;
  return Number(sub.amount);
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [monthly, setMonthly] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blankForm());

  useEffect(() => {
    subAPI.getAll()
      .then(({ data }) => {
        setSubs(data.data || []);
        setMonthly(Number(data.monthly_total || 0));
      })
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false));
  }, []);

  async function addSub() {
    if (!form.name || !form.amount || !form.next_due) {
      toast.error('Name, amount, and due date are required');
      return;
    }

    try {
      const { data } = await subAPI.create(form);
      setSubs(prev => [...prev, data.data].sort((a, b) => new Date(a.next_due) - new Date(b.next_due)));
      setMonthly(prev => prev + monthlyEquivalent(form));
      setModal(false);
      setForm(blankForm());
      toast.success('Subscription added');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add subscription');
    }
  }

  async function toggleActive(sub) {
    try {
      const { data } = await subAPI.update(sub.id, { ...sub, is_active: !sub.is_active });
      setSubs(prev => prev.map(item => item.id === sub.id ? data.data : item));
    } catch {
      toast.error('Failed to update subscription');
    }
  }

  async function deleteSub(id) {
    try {
      await subAPI.remove(id);
      setSubs(prev => prev.filter(sub => sub.id !== id));
      toast.success('Subscription removed');
    } catch {
      toast.error('Failed to remove subscription');
    }
  }

  const active = subs.filter(sub => sub.is_active);
  const paused = subs.filter(sub => !sub.is_active);
  const upcoming = active.filter(sub => daysUntil(sub.next_due) <= 7).length;

  return (
    <Page>
      <PageHeader
        eyebrow="Recurring Outflows"
        title="Subscriptions"
        subtitle="Manage recurring digital memberships, SaaS tools, and utilities to protect cashflow."
        action={
          <Button variant="primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Add Subscription
          </Button>
        }
      />

      {subs.length > 0 && (
        <>
          <div className="data-card" style={{ marginBottom: 20 }}>
            <div className="data-card-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Total Monthly Recurring Burn
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                    <strong style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                      {money(Math.round(monthly))}
                    </strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      / month ({money(Math.round(monthly * 12))} annually)
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge-pill badge-pill-purple" style={{ fontSize: '0.84rem', padding: '4px 10px' }}>
                    {active.length} Active Services
                  </span>
                  {upcoming > 0 && (
                    <span className="badge-pill badge-pill-amber" style={{ fontSize: '0.84rem', padding: '4px 10px' }}>
                      {upcoming} Due This Week
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Annual Run Rate</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2, color: 'var(--text)' }}>
                    {money(Math.round(monthly * 12))}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paused Cost Avoidance</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2, color: '#10b981' }}>
                    {money(Math.round(paused.reduce((s, sub) => s + monthlyEquivalent(sub), 0)))}/mo
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Weekly Average</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2, color: 'var(--text)' }}>
                    {money(Math.round(monthly / 4.33))}/wk
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <MetricCard label="Active Services" value={String(active.length)} helper="Currently billing" tone="mint" icon={<Repeat2 />} />
            <MetricCard label="Paused" value={String(paused.length)} helper="Billing frozen" tone="amber" icon={<Pause />} />
            <MetricCard label="Due Soon" value={String(upcoming)} helper="Renewing soon" tone="pink" icon={<BellRing />} />
            <MetricCard label="Monthly Equiv." value={money(Math.round(monthly))} helper="Blended run rate" tone="purple" icon={<CalendarClock />} />
          </div>
        </>
      )}

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : subs.length === 0 ? (
        <EmptyState
          icon={<Repeat2 />}
          title="No active subscriptions"
          text="Track SaaS memberships, streaming services, and utility bills before they silently compound."
          action={<Button onClick={() => setModal(true)}><Plus size={16} /> Add subscription</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {active.length > 0 && (
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Active Subscriptions ({active.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {active.map(sub => <SubscriptionCard key={sub.id} sub={sub} onToggle={toggleActive} onDelete={deleteSub} />)}
              </div>
            </div>
          )}

          {paused.length > 0 && (
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Paused / Inactive ({paused.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {paused.map(sub => <SubscriptionCard key={sub.id} sub={sub} paused onToggle={toggleActive} onDelete={deleteSub} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <FAB icon={<Plus size={22} />} label="Add subscription" onClick={() => setModal(true)} />

      {modal && (
        <BottomSheet title="Add Recurring Subscription" onClose={() => setModal(false)}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Subscription Category
            </label>
            <VisualCategorySelect 
              categories={SUB_CATEGORIES.slice(0, 8)} 
              value={form.category} 
              onChange={val => setForm(prev => ({ ...prev, category: val }))} 
              label=""
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Service Name
            </label>
            <input 
              type="text"
              className="input"
              placeholder="E.g., Netflix, Spotify, AWS, GitHub"
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
              autoFocus
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Billing Cost
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 34, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}
                placeholder="0.00"
                value={form.amount}
                onChange={event => setForm(prev => ({ ...prev, amount: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Billing Frequency
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

          <div className="field" style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Next Scheduled Billing Date
            </label>
            <input 
              type="date"
              className="input"
              style={{ color: 'var(--text)', fontWeight: 500 }}
              value={form.next_due}
              onChange={event => setForm(prev => ({ ...prev, next_due: event.target.value }))}
            />
          </div>

          <Button className="ui-button-full" onClick={addSub} style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
            Add Subscription
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}

function SubscriptionCard({ sub, paused, onToggle, onDelete }) {
  const days = daysUntil(sub.next_due);
  const overdue = days !== null && days < 0;
  const dueSoon = days !== null && days <= 7 && days >= 0;

  return (
    <div className="data-card" style={{ opacity: paused ? 0.65 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="data-card-header" style={{ padding: '12px 16px', background: 'var(--surface-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: '1rem' }}>
            {SUB_CATEGORIES.find(c => c.id === sub.category)?.icon || '💳'}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>{sub.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {sub.category || 'General'} • <span style={{ textTransform: 'capitalize' }}>{sub.period}</span>
            </div>
          </div>
        </div>
        <span className={`badge-pill ${paused ? 'badge-pill-neutral' : overdue ? 'badge-pill-pink' : dueSoon ? 'badge-pill-amber' : 'badge-pill-mint'}`}>
          {paused ? 'Paused' : overdue ? 'Overdue' : days === 0 ? 'Due Today' : `${days}d left`}
        </span>
      </div>

      <div className="data-card-body" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {money(sub.amount)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Equivalent to {money(Math.round(monthlyEquivalent(sub)))}/mo
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            Renews: {dateShort(sub.next_due)}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => onToggle(sub)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--border)', background: 'var(--surface-strong)', color: 'var(--text)', borderRadius: 6, padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {paused ? <Play size={11} /> : <Pause size={11} />} {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={() => onDelete(sub.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: 6, padding: '4px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
