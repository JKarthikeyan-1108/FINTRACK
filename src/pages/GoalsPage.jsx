import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Flag, Plus, Target, Trash2, WalletCards } from 'lucide-react';
import { goalAPI } from '../services/api';
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
  TextInput,
  VisualCategorySelect,
} from '../components/ui/CashewUI';
import { dateShort, daysUntil, money } from '../lib/format';

const blankForm = () => ({ name: 'Emergency Fund', category_id: 'emergency_fund', target_amount: '', deadline: '', note: '' });

const GOAL_CATEGORIES = [
  { id: 'laptop', name: 'Laptop', icon: '💻' },
  { id: 'home', name: 'Home', icon: '🏠' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'education', name: 'Education', icon: '🎓' },
  { id: 'vehicle', name: 'Vehicle', icon: '🚗' },
  { id: 'emergency_fund', name: 'Emergency Fund', icon: '💰' },
  { id: 'custom', name: 'Custom', icon: '🎯' },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [depositModal, setDepositModal] = useState(null);
  const [depositAmt, setDepositAmt] = useState('');
  const [form, setForm] = useState(blankForm());

  useEffect(() => {
    goalAPI.getAll()
      .then(({ data }) => setGoals(data.data || []))
      .catch(() => toast.error('Failed to load goals'))
      .finally(() => setLoading(false));
  }, []);

  const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.target_amount), 0);
  const totalSaved = goals.reduce((sum, goal) => sum + Number(goal.saved_amount || goal.current_amount || 0), 0);
  const totalPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const achieved = goals.filter(goal => goal.is_achieved || Number(goal.saved_amount || goal.current_amount || 0) >= Number(goal.target_amount)).length;

  async function addGoal() {
    if (!form.name || !form.target_amount) {
      toast.error('Name and target are required');
      return;
    }

    try {
      const cat = GOAL_CATEGORIES.find(c => c.id === form.category_id);
      const payload = { ...form, emoji: cat ? cat.icon : '🎯' };
      const { data } = await goalAPI.create(payload);
      setGoals(prev => [data.data, ...prev]);
      setModal(false);
      setForm(blankForm());
      toast.success('Goal created');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create goal');
    }
  }

  async function deposit() {
    const amount = Number(depositAmt);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const goal = depositModal;
    const current = Number(goal.saved_amount || goal.current_amount || 0);
    const nextSaved = Math.min(current + amount, Number(goal.target_amount));
    const nextAchieved = nextSaved >= Number(goal.target_amount);

    try {
      const { data } = await goalAPI.update(goal.id, {
        ...goal,
        saved_amount: nextSaved,
        current_amount: nextSaved,
        is_achieved: nextAchieved,
      });
      setGoals(prev => prev.map(item => item.id === goal.id ? data.data : item));
      setDepositModal(null);
      setDepositAmt('');
      toast.success(nextAchieved ? 'Goal achieved' : 'Money added');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update goal');
    }
  }

  async function deleteGoal(id) {
    try {
      await goalAPI.remove(id);
      setGoals(prev => prev.filter(goal => goal.id !== id));
      toast.success('Goal deleted');
    } catch {
      toast.error('Failed to delete goal');
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Targeted Wealth"
        title="Savings Goals"
        subtitle="Set funded milestones for capital purchases, emergencies, and life aspirations."
        action={
          <Button variant="primary" onClick={() => setModal(true)}>
            <Plus size={16} /> New Goal
          </Button>
        }
      />

      {goals.length > 0 && (
        <div className="data-card card-stagger" style={{ marginBottom: 20 }}>
          <div className="data-card-body" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  Total Capital Accumulated
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                  <strong style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                    {money(totalSaved)}
                  </strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    saved of {money(totalTarget)} target
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge-pill badge-pill-blue" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                  {totalPct.toFixed(0)}% Overall Funded
                </span>
                <span className="badge-pill badge-pill-mint" style={{ fontSize: '0.82rem', padding: '4px 10px' }}>
                  {achieved} of {goals.length} Achieved
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <ProgressBar value={totalPct} tone="blue" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Funding Gap</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: 'var(--text)' }}>
                  {money(totalTarget - totalSaved)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Milestones</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: 'var(--text)' }}>
                  {goals.length} Goals
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completion Ratio</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: 2, color: '#10b981' }}>
                  {((achieved / (goals.length || 1)) * 100).toFixed(0)}% Completed
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
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target />}
          title="No goals established"
          text="Establish a goal for an emergency fund, vehicle, or dream project to start tracking your deposits."
          action={<Button onClick={() => setModal(true)}><Plus size={16} /> Establish goal</Button>}
        />
      ) : (
        <div className="category-grid-animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {goals.map(goal => {
            const saved = Number(goal.saved_amount || goal.current_amount || 0);
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
            const done = goal.is_achieved || pct >= 100;
            const days = goal.deadline ? daysUntil(goal.deadline) : null;
            const cat = GOAL_CATEGORIES.find(c => c.id === goal.category_id);

            return (
              <div key={goal.id} className="data-card card-stagger" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="data-card-header" style={{ padding: '14px 18px', background: 'var(--surface-strong)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: '1.1rem' }}>
                      {goal.emoji || cat?.icon || '🎯'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                        {goal.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {goal.deadline ? `${days < 0 ? 'Due past' : `${days}d remaining`} • ${dateShort(goal.deadline)}` : 'No set deadline'}
                      </div>
                    </div>
                  </div>
                  <span className={`badge-pill ${done ? 'badge-pill-mint' : 'badge-pill-blue'}`}>
                    {done ? 'Achieved 🎉' : `${pct.toFixed(0)}% Funded`}
                  </span>
                </div>

                <div className="data-card-body" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {money(saved)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        target of {money(target)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: done ? '#10b981' : 'var(--text-muted)' }}>
                        {done ? 'Target reached' : `${money(Math.max(0, target - saved))} needed`}
                      </span>
                    </div>
                  </div>

                  <ProgressBar value={pct} tone={done ? 'mint' : 'blue'} />

                  {goal.note && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 10, background: 'var(--surface-strong)', padding: '6px 10px', borderRadius: 6 }}>
                      {goal.note}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {done ? 'Goal Completed' : `${(100 - pct).toFixed(0)}% to milestone`}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!done && (
                        <button
                          onClick={() => { setDepositModal(goal); setDepositAmt(''); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid rgba(14, 165, 233, 0.3)', background: 'rgba(14, 165, 233, 0.08)', color: '#0284c7', borderRadius: 6, padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          <WalletCards size={12} /> Add Funds
                        </button>
                      )}
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: 6, padding: '4px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FAB icon={<Plus size={22} />} label="Create goal" onClick={() => setModal(true)} />

      {modal && (
        <BottomSheet title="Establish Savings Goal" onClose={() => setModal(false)}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Goal Type
            </label>
            <VisualCategorySelect 
              categories={GOAL_CATEGORIES.slice(0, 8)} 
              value={form.category_id} 
              onChange={val => {
                const cat = GOAL_CATEGORIES.find(c => c.id === val);
                setForm(prev => ({ ...prev, category_id: val, name: val === 'custom' ? '' : (cat ? cat.name : '') }));
              }} 
              label=""
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Goal Name
            </label>
            <input 
              type="text"
              className="input"
              placeholder="E.g., Emergency Reserve 6M, EV Downpayment"
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
              autoFocus
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target Amount
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 34, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}
                placeholder="0.00"
                value={form.target_amount}
                onChange={event => setForm(prev => ({ ...prev, target_amount: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target Deadline
            </label>
            <input 
              type="date"
              className="input"
              style={{ color: 'var(--text)', fontWeight: 500 }}
              value={form.deadline}
              onChange={event => setForm(prev => ({ ...prev, deadline: event.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--surface-strong)', padding: '12px 16px', borderRadius: '8px', marginBottom: '22px', border: '1px solid var(--border)', fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '1rem' }}>💡</span>
            <span>Allocating automated monthly transfers helps you achieve goals 3x faster without budget strain.</span>
          </div>

          <Button className="ui-button-full" onClick={addGoal} style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
            Activate Savings Goal
          </Button>
        </BottomSheet>
      )}

      {depositModal && (
        <BottomSheet title={`Add Funds to ${depositModal.name}`} onClose={() => setDepositModal(null)}>
          <div className="data-card" style={{ marginBottom: 16 }}>
            <div className="data-card-body" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Current Progress</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {money(depositModal.saved_amount || depositModal.current_amount || 0)}
                </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  of {money(depositModal.target_amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>Deposit Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number" 
                className="input" 
                style={{ paddingLeft: 34, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}
                value={depositAmt} 
                autoFocus 
                onChange={event => setDepositAmt(event.target.value)} 
                placeholder="0.00" 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {[500, 1000, 5000, 10000].map(amount => (
              <button
                key={amount}
                type="button"
                className="quick-action-pill"
                onClick={() => setDepositAmt(String(amount))}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <span>+{money(amount, true)}</span>
              </button>
            ))}
          </div>

          <Button className="ui-button-full" onClick={deposit} style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
            Confirm Deposit
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}
