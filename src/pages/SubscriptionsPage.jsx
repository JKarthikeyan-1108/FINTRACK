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
  SelectInput,
  TextInput,
} from '../components/ui/CashewUI';
import { dateShort, daysUntil, money } from '../lib/format';

const PERIODS = ['monthly', 'yearly', 'weekly'];
const CATS = ['Entertainment', 'Music', 'Cloud', 'Fitness', 'News', 'Gaming', 'Productivity', 'Security', 'Health', 'Other'];

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
        eyebrow="Recurring"
        title="Subscriptions"
        subtitle="Track recurring payments before they quietly eat the month."
        action={<Button onClick={() => setModal(true)}><Plus size={18} /> Add</Button>}
      />

      {subs.length > 0 && (
        <>
          <Card tone="purple" className="hero-balance" style={{ marginBottom: 14 }}>
            <div className="budget-card-header">
              <div>
                <span className="hero-balance-label">Monthly recurring</span>
                <strong>{money(Math.round(monthly))}</strong>
                <small>{money(Math.round(monthly * 12))} per year</small>
              </div>
              <div className="metric-icon" style={{ width: 48, height: 48 }}>
                <Repeat2 size={25} />
              </div>
            </div>
            <div className="hero-balance-grid">
              <div className="mini-stat">
                <span>Active</span>
                <strong>{active.length}</strong>
              </div>
              <div className="mini-stat">
                <span>Due soon</span>
                <strong>{upcoming}</strong>
              </div>
            </div>
          </Card>
          <div className="metric-grid">
            <MetricCard label="Active" value={String(active.length)} helper="Current services" tone="mint" icon={<Repeat2 />} />
            <MetricCard label="Paused" value={String(paused.length)} helper="Not billing" tone="amber" icon={<Pause />} />
            <MetricCard label="Week" value={String(upcoming)} helper="Renewing soon" tone="pink" icon={<BellRing />} />
            <MetricCard label="Monthly" value={money(monthly)} helper="Equivalent spend" tone="purple" icon={<CalendarClock />} />
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
          title="No subscriptions"
          text="Add Netflix, Spotify, cloud tools, insurance, and any recurring bills."
          action={<Button onClick={() => setModal(true)}><Plus size={18} /> Add subscription</Button>}
        />
      ) : (
        <>
          {active.length > 0 && <div className="section-title"><span>Active</span></div>}
          <div className="budget-list">
            {active.map(sub => <SubscriptionCard key={sub.id} sub={sub} onToggle={toggleActive} onDelete={deleteSub} />)}
          </div>
          {paused.length > 0 && <div className="section-title"><span>Paused</span></div>}
          <div className="budget-list">
            {paused.map(sub => <SubscriptionCard key={sub.id} sub={sub} paused onToggle={toggleActive} onDelete={deleteSub} />)}
          </div>
        </>
      )}

      <FAB icon={<Plus size={24} />} label="Add subscription" onClick={() => setModal(true)} />

      {modal && (
        <BottomSheet title="Add Subscription" onClose={() => setModal(false)}>
          <TextInput label="Service name" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Netflix, Spotify, iCloud" />
          <div className="field-row">
            <TextInput label="Amount" type="number" value={form.amount} onChange={event => setForm(prev => ({ ...prev, amount: event.target.value }))} placeholder="0" />
            <SelectInput label="Period" value={form.period} onChange={event => setForm(prev => ({ ...prev, period: event.target.value }))}>
              {PERIODS.map(period => <option key={period} value={period}>{period[0].toUpperCase() + period.slice(1)}</option>)}
            </SelectInput>
          </div>
          <TextInput label="Next due date" type="date" value={form.next_due} onChange={event => setForm(prev => ({ ...prev, next_due: event.target.value }))} />
          <SelectInput label="Category" value={form.category} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))}>
            {CATS.map(category => <option key={category} value={category}>{category}</option>)}
          </SelectInput>
          <Button className="ui-button-full" onClick={addSub}><Repeat2 size={18} /> Add subscription</Button>
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
    <Card tone={paused ? 'plain' : dueSoon || overdue ? 'amber' : 'plain'} style={{ opacity: paused ? .68 : 1 }}>
      <div className="transaction-row" style={{ borderBottom: 0, padding: 0 }}>
        <div className="transaction-icon">
          <Repeat2 size={21} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="transaction-title">{sub.name}</div>
          <div className="transaction-meta">{sub.category || 'Subscription'} - {sub.period} - {dateShort(sub.next_due)}</div>
          <div className="transaction-meta">
            {overdue ? 'Overdue' : days === 0 ? 'Due today' : `Due in ${days}d`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="transaction-amount">{money(sub.amount)}</div>
          <div className="transaction-meta">{money(monthlyEquivalent(sub))}/mo</div>
        </div>
      </div>
      <div className="row-actions">
        <button onClick={() => onToggle(sub)}>{paused ? <Play size={13} /> : <Pause size={13} />} {paused ? 'Resume' : 'Pause'}</button>
        <button onClick={() => onDelete(sub.id)}><Trash2 size={13} /> Delete</button>
      </div>
    </Card>
  );
}
