import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  BellRing,
  CalendarClock,
  CalendarDays,
  Pause,
  Play,
  Plus,
  Repeat2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  ListOrdered,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
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

const blankForm = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return {
    name: '',
    icon: 'subscription',
    amount: '',
    period: 'monthly',
    next_due: d.toISOString().split('T')[0],
    category: 'Entertainment',
    is_trial: false,
  };
};

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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'calendar' | 'timeline'
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(new Date().getDate());
  const [cancelledIds, setCancelledIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fintrack_cancelled_subs') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    subAPI.getAll()
      .then(({ data }) => {
        setSubs(data.data || []);
        setMonthly(Number(data.monthly_total || 0));
      })
      .catch(() => toast.error('Failed to load subscriptions'))
      .finally(() => setLoading(false));
  }, []);

  function toggleCancellationFlag(id) {
    setCancelledIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('fintrack_cancelled_subs', JSON.stringify(next));
      if (next.includes(id)) {
        toast('Marked for cancellation before renewal!', { icon: '⚠️' });
      } else {
        toast.success('Removed cancellation flag');
      }
      return next;
    });
  }

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

  // Calendar mapping
  const now = new Date();
  const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calendarMap = useMemo(() => {
    const map = {};
    for (let d = 1; d <= currentMonthDays; d++) map[d] = [];
    active.forEach(sub => {
      if (!sub.next_due) return;
      const dueDay = new Date(sub.next_due).getDate();
      if (map[dueDay]) map[dueDay].push(sub);
    });
    return map;
  }, [active, currentMonthDays]);

  const selectedDayBills = calendarMap[selectedCalendarDay] || [];
  const selectedDayTotal = selectedDayBills.reduce((s, b) => s + Number(b.amount || 0), 0);

  // Timeline mapping
  const timelineSubs = useMemo(() => {
    return [...active].sort((a, b) => {
      const da = daysUntil(a.next_due) ?? 999;
      const db = daysUntil(b.next_due) ?? 999;
      return da - db;
    });
  }, [active]);

  const dueIn7DaysTotal = timelineSubs
    .filter(s => {
      const d = daysUntil(s.next_due);
      return d !== null && d >= 0 && d <= 7;
    })
    .reduce((s, sub) => s + Number(sub.amount || 0), 0);

  return (
    <Page>
      <PageHeader
        eyebrow="Recurring Outflows"
        title="Subscriptions & Bill Calendar"
        subtitle="Manage recurring digital memberships, SaaS tools, and monthly utility payment schedules."
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="primary" onClick={() => setModal(true)}>
              <Plus size={16} /> Add Subscription
            </Button>
          </div>
        }
      />

      {subs.length > 0 && (
        <>
          <div className="data-card card-stagger" style={{ marginBottom: 20 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="badge-pill badge-pill-purple" style={{ fontSize: '0.84rem', padding: '4px 10px' }}>
                    {active.length} Active Services
                  </span>
                  {upcoming > 0 && (
                    <span className="badge-pill badge-pill-amber" style={{ fontSize: '0.84rem', padding: '4px 10px' }}>
                      {upcoming} Due This Week ({money(dueIn7DaysTotal)})
                    </span>
                  )}
                  {cancelledIds.length > 0 && (
                    <span className="badge-pill badge-pill-pink" style={{ fontSize: '0.84rem', padding: '4px 10px' }}>
                      {cancelledIds.length} Flagged to Cancel
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
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2, color: 'var(--status-positive)' }}>
                    {money(Math.round(paused.reduce((s, sub) => s + monthlyEquivalent(sub), 0)))}/mo
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due in 7 Days</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2, color: upcoming > 0 ? 'var(--status-warning)' : 'var(--text)' }}>
                    {money(dueIn7DaysTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, background: 'var(--surface-strong)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
              {[
                { id: 'cards', label: 'Card Grid', icon: <LayoutGrid size={15} /> },
                { id: 'calendar', label: 'Bill Calendar', icon: <CalendarDays size={15} /> },
                { id: 'timeline', label: 'Due Timeline', icon: <ListOrdered size={15} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: viewMode === tab.id ? 'var(--btn-primary-bg, var(--brand-primary))' : 'transparent',
                    color: viewMode === tab.id ? 'var(--btn-primary-color, #ffffff)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {active.length} active recurring outflow commitments
            </div>
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
      ) : viewMode === 'calendar' ? (
        /* Bill Calendar View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <CalendarDays size={18} color="#0ea5e9" />
                <span>{currentMonthName} Payment Schedule</span>
              </div>
              <span className="badge-pill badge-pill-blue">{currentMonthDays} Days</span>
            </div>
            <div className="data-card-body" style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', paddingBottom: 6 }}>
                    {d}
                  </div>
                ))}
                {Array.from({ length: currentMonthDays }, (_, i) => i + 1).map(day => {
                  const bills = calendarMap[day] || [];
                  const isToday = day === now.getDate();
                  const isSelected = day === selectedCalendarDay;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedCalendarDay(day)}
                      style={{
                        minHeight: 52,
                        padding: 6,
                        borderRadius: 10,
                        border: isSelected ? '2px solid var(--border-focus)' : isToday ? '1px solid var(--status-info)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'var(--brand-soft)' : isToday ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '0.76rem', fontWeight: isToday || isSelected ? 800 : 600, color: isToday ? 'var(--status-info)' : 'var(--text)' }}>
                        {day}
                      </span>
                      {bills.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {bills.map(b => (
                            <span
                              key={b.id}
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: cancelledIds.includes(b.id) ? 'var(--status-negative)' : 'var(--status-positive)',
                              }}
                              title={`${b.name}: ${money(b.amount)}`}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <CalendarClock size={18} color="var(--brand-primary)" />
                <span>Day {selectedCalendarDay} Bill Outflow</span>
              </div>
              <span className="badge-pill badge-pill-mint">{selectedDayBills.length} Bills</span>
            </div>
            <div className="data-card-body" style={{ padding: 18 }}>
              {selectedDayBills.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={32} color="var(--status-positive)" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>No bills due on Day {selectedCalendarDay}</div>
                  <div style={{ fontSize: '0.78rem', marginTop: 4 }}>Select any highlighted date on the calendar to inspect due services.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'var(--surface-strong)', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total Outflow for Day {selectedCalendarDay}</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-negative)' }}>{money(selectedDayTotal)}</strong>
                  </div>
                  {selectedDayBills.map(sub => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.2rem' }}>{SUB_CATEGORIES.find(c => c.id === sub.category)?.icon || '💳'}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{sub.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub.category} • {sub.period}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>{money(sub.amount)}</div>
                        {cancelledIds.includes(sub.id) && (
                          <span className="badge-pill badge-pill-pink" style={{ fontSize: '0.65rem' }}>Cancel Flagged</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Due Timeline View */
        <div className="data-card card-stagger">
          <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
            <div className="data-card-title">
              <ListOrdered size={18} color="#8b5cf6" />
              <span>Upcoming 30-Day Outflow Cascade</span>
            </div>
            <span className="badge-pill badge-pill-purple">{timelineSubs.length} Scheduled</span>
          </div>
          <div className="data-card-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {timelineSubs.map(sub => {
              const days = daysUntil(sub.next_due);
              const overdue = days !== null && days < 0;
              const dueSoon = days !== null && days <= 7 && days >= 0;
              const isFlagged = cancelledIds.includes(sub.id);

              return (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: overdue ? 'rgba(239, 68, 68, 0.06)' : dueSoon ? 'rgba(245, 158, 11, 0.06)' : 'var(--surface)',
                    border: overdue ? '1px solid rgba(239, 68, 68, 0.3)' : dueSoon ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface-strong)', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>
                      {SUB_CATEGORIES.find(c => c.id === sub.category)?.icon || '💳'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>{sub.name}</strong>
                        {isFlagged && <span className="badge-pill badge-pill-pink" style={{ fontSize: '0.66rem' }}>Flagged for Cancellation</span>}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Due on {dateShort(sub.next_due)} • {sub.period} billing
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {money(sub.amount)}
                      </div>
                      <span className={`badge-pill ${overdue ? 'badge-pill-pink' : dueSoon ? 'badge-pill-amber' : 'badge-pill-mint'}`} style={{ fontSize: '0.68rem' }}>
                        {overdue ? 'Overdue' : days === 0 ? 'Due Today' : `${days} days left`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCancellationFlag(sub.id)}
                      className={`badge-pill ${isFlagged ? 'badge-pill-neutral' : 'badge-pill-pink'}`}
                      style={{ cursor: 'pointer', border: '1px solid var(--border)', fontSize: '0.72rem', padding: '6px 10px' }}
                      title="Flag to cancel before next auto-debit"
                    >
                      {isFlagged ? 'Keep Active' : 'Flag Cancel'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="tab-transition-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {active.length > 0 && (
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Active Subscriptions ({active.length})
              </div>
              <div className="category-grid-animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {active.map(sub => (
                  <SubscriptionCard
                    key={sub.id}
                    sub={sub}
                    isFlagged={cancelledIds.includes(sub.id)}
                    onToggleFlag={toggleCancellationFlag}
                    onToggle={toggleActive}
                    onDelete={deleteSub}
                  />
                ))}
              </div>
            </div>
          )}

          {paused.length > 0 && (
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
                Paused / Inactive ({paused.length})
              </div>
              <div className="category-grid-animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                {paused.map(sub => (
                  <SubscriptionCard
                    key={sub.id}
                    sub={sub}
                    paused
                    isFlagged={cancelledIds.includes(sub.id)}
                    onToggleFlag={toggleCancellationFlag}
                    onToggle={toggleActive}
                    onDelete={deleteSub}
                  />
                ))}
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

          <Button variant="primary" className="ui-button-full" onClick={addSub} style={{ padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
            Add Subscription
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}

function SubscriptionCard({ sub, paused, isFlagged, onToggleFlag, onToggle, onDelete }) {
  const days = daysUntil(sub.next_due);
  const overdue = days !== null && days < 0;
  const dueSoon = days !== null && days <= 7 && days >= 0;

  return (
    <div className="data-card card-stagger" style={{ opacity: paused ? 0.65 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: isFlagged ? '1px solid rgba(239, 68, 68, 0.4)' : undefined }}>
      <div className="data-card-header" style={{ padding: '12px 16px', background: 'var(--surface-strong)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: '1rem' }}>
            {SUB_CATEGORIES.find(c => c.id === sub.category)?.icon || '💳'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>{sub.name}</div>
              {isFlagged && <span className="badge-pill badge-pill-pink" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>Cancel Pending</span>}
            </div>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => onToggle(sub)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--border)', background: 'var(--surface-strong)', color: 'var(--text)', borderRadius: 6, padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {paused ? <Play size={11} /> : <Pause size={11} />} {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={() => onToggleFlag && onToggleFlag(sub.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                border: isFlagged ? '1px solid var(--border-danger, rgba(180, 35, 24, 0.4))' : '1px solid var(--border)',
                background: isFlagged ? 'var(--bg-danger-subtle, rgba(180, 35, 24, 0.12))' : 'var(--surface-strong)',
                color: isFlagged ? 'var(--status-negative)' : 'var(--text-muted)',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title={isFlagged ? 'Click to unmark cancellation' : 'Flag to cancel before next debit'}
            >
              <ShieldAlert size={11} /> {isFlagged ? 'Cancel Flagged' : 'Flag Cancel'}
            </button>
          </div>
          <button
            onClick={() => onDelete(sub.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid var(--border-danger, rgba(180, 35, 24, 0.25))', background: 'var(--bg-danger-subtle, rgba(180, 35, 24, 0.08))', color: 'var(--status-negative)', borderRadius: 6, padding: '4px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
