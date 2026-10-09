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
        eyebrow="Savings"
        title="Goals"
        subtitle="Turn big purchases into visible progress instead of vague intentions."
        action={<Button onClick={() => setModal(true)}><Plus size={18} /> New</Button>}
      />

      {goals.length > 0 && (
        <Card tone="blue" className="hero-balance" style={{ marginBottom: 16 }}>
          <div className="budget-card-header">
            <div>
              <span className="hero-balance-label">Total saved</span>
              <strong>{money(totalSaved)}</strong>
              <small>of {money(totalTarget)} across {goals.length} goals</small>
            </div>
            <RingMeter value={totalPct} tone="blue" size={72} />
          </div>
          <ProgressBar value={totalPct} tone="blue" />
          <div className="hero-balance-grid">
            <div className="mini-stat">
              <span>Remaining</span>
              <strong>{money(totalTarget - totalSaved)}</strong>
            </div>
            <div className="mini-stat">
              <span>Achieved</span>
              <strong>{achieved}</strong>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target />}
          title="No goals yet"
          text="Create a savings goal and add deposits as you make progress."
          action={<Button onClick={() => setModal(true)}><Plus size={18} /> Create goal</Button>}
        />
      ) : (
        <div className="budget-list">
          {goals.map(goal => {
            const saved = Number(goal.saved_amount || goal.current_amount || 0);
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
            const done = goal.is_achieved || pct >= 100;
            const days = goal.deadline ? daysUntil(goal.deadline) : null;

            return (
              <Card key={goal.id} tone={done ? 'mint' : 'plain'}>
                <div className="budget-row">
                  <RingMeter value={pct} tone={done ? 'mint' : 'blue'} />
                  <div className="budget-row-main">
                    <div className="budget-row-title">
                      <strong>{goal.name}</strong>
                      <b>{pct.toFixed(0)}%</b>
                    </div>
                    <div className="budget-row-meta">
                      <span>{money(saved)} saved</span>
                      <span>{money(target)} target</span>
                    </div>
                    <ProgressBar value={pct} tone={done ? 'mint' : 'blue'} />
                    <div className="budget-row-meta">
                      <span>{goal.deadline ? `${days < 0 ? 'Past due' : `${days}d left`} - ${dateShort(goal.deadline)}` : 'No deadline'}</span>
                    </div>
                    {goal.note && <p style={{ marginTop: 10 }}>{goal.note}</p>}
                    <div className="row-actions">
                      {!done && <button onClick={() => { setDepositModal(goal); setDepositAmt(''); }}><WalletCards size={13} /> Add money</button>}
                      <button onClick={() => deleteGoal(goal.id)}><Trash2 size={13} /> Delete</button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FAB icon={<Plus size={24} />} label="Create goal" onClick={() => setModal(true)} />

      {modal && (
        <BottomSheet title="Create Goal" onClose={() => setModal(false)}>
          <div className="field" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Goal Category</label>
              <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>See All</button>
            </div>
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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Goal Name</label>
            <input 
              type="text"
              className="input"
              placeholder="E.g., New Car, Emergency Fund"
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Target Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: '#64748b', fontWeight: 600, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 32, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}
                placeholder="0.00"
                value={form.target_amount}
                onChange={event => setForm(prev => ({ ...prev, target_amount: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Target Date</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 13, color: '#64748b' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </span>
              <input 
                type="date"
                className="input"
                style={{ paddingLeft: 40, color: '#0f172a', fontWeight: 500 }}
                value={form.deadline}
                onChange={event => setForm(prev => ({ ...prev, deadline: event.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', background: '#f0f9ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', color: '#0284c7', fontSize: '0.85rem', lineHeight: 1.5 }}>
            <span style={{ fontSize: '1rem' }}>💡</span>
            <span>Break down large goals into smaller, manageable milestones.</span>
          </div>

          <Button className="ui-button-full" onClick={addGoal} style={{ background: '#10b981', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
            Create Goal
          </Button>
        </BottomSheet>
      )}

      {depositModal && (
        <BottomSheet title={`Add to ${depositModal.name}`} onClose={() => setDepositModal(null)}>
          <Card tone="blue" style={{ marginBottom: 14 }}>
            <span className="hero-balance-label">Progress</span>
            <strong>{money(depositModal.saved_amount || depositModal.current_amount || 0)}</strong>
            <p>saved of {money(depositModal.target_amount)}</p>
          </Card>
          <TextInput label="Amount" type="number" value={depositAmt} autoFocus onChange={event => setDepositAmt(event.target.value)} placeholder="0" />
          <div className="quick-action-grid" style={{ marginBottom: 14 }}>
            {[500, 1000, 5000, 10000].map(amount => (
              <button key={amount} className="quick-action" onClick={() => setDepositAmt(String(amount))}>
                <WalletCards />
                <span>{money(amount, true)}</span>
              </button>
            ))}
          </div>
          <Button className="ui-button-full" onClick={deposit}>Add money</Button>
        </BottomSheet>
      )}
    </Page>
  );
}
