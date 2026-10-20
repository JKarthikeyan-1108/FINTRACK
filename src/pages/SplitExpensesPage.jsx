import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  Receipt,
  Trash2,
  WalletCards,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Scale,
  Sparkles,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  MetricCard,
  Page,
  PageHeader,
  SegmentedControl,
  TextInput,
} from '../components/ui/CashewUI';
import { dateShort, money } from '../lib/format';
import { calculateSplits, simplifyDebts, toMoney } from '../lib/debtSimplification';
import { accountAPI, txnAPI } from '../services/api';

const DEFAULT_GROUPS = [
  {
    id: 'grp_goa',
    name: 'Goa Vacation 2026',
    emoji: '🏝️',
    members: [
      { id: 'm1', name: 'You (Me)', isCurrent: true },
      { id: 'm2', name: 'Rahul Sharma' },
      { id: 'm3', name: 'Priya Patel' },
      { id: 'm4', name: 'Vikram Mehta' },
    ],
    expenses: [
      {
        id: 'exp_1',
        title: 'Villa Rental & Resort Booking',
        amount: 24000,
        paidBy: 'm1',
        splitType: 'equal',
        date: '2026-10-15',
      },
      {
        id: 'exp_2',
        title: 'Seafood Beach Shack Dinner',
        amount: 6800,
        paidBy: 'm2',
        splitType: 'equal',
        date: '2026-10-16',
      },
      {
        id: 'exp_3',
        title: 'Self-Drive Car Rental & Fuel',
        amount: 8200,
        paidBy: 'm3',
        splitType: 'equal',
        date: '2026-10-17',
      },
    ],
    settlements: [
      {
        id: 'set_1',
        fromMemberId: 'm4',
        toMemberId: 'm1',
        amount: 5000,
        date: '2026-10-18',
        note: 'UPI payment to settle partial share',
      },
    ],
  },
  {
    id: 'grp_flat',
    name: 'Flat 304 Roommates',
    emoji: '🏠',
    members: [
      { id: 'm1', name: 'You (Me)', isCurrent: true },
      { id: 'm2', name: 'Arjun Verma' },
      { id: 'm5', name: 'Sneha Rao' },
    ],
    expenses: [
      {
        id: 'exp_4',
        title: 'Airtel Fiber Broadband Bill',
        amount: 1499,
        paidBy: 'm1',
        splitType: 'equal',
        date: '2026-10-10',
      },
      {
        id: 'exp_5',
        title: 'Monthly Groceries & Milk Delivery',
        amount: 4500,
        paidBy: 'm5',
        splitType: 'equal',
        date: '2026-10-12',
      },
    ],
    settlements: [],
  },
];

export default function SplitExpensesPage() {
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem('fintrack_shared_groups');
      return saved ? JSON.parse(saved) : DEFAULT_GROUPS;
    } catch {
      return DEFAULT_GROUPS;
    }
  });

  const [activeGroupId, setActiveGroupId] = useState(() => groups[0]?.id || 'grp_goa');
  const [activeView, setActiveView] = useState('debts'); // 'debts' | 'expenses' | 'balances'
  const [accounts, setAccounts] = useState([]);

  // Modals
  const [expenseModal, setExpenseModal] = useState(false);
  const [groupModal, setGroupModal] = useState(false);
  const [settleModal, setSettleModal] = useState(null); // { from, to, amount }

  // New Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('m1');
  const [expSplitType, setExpSplitType] = useState('equal');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('🏝️');
  const [newMemberInputs, setNewMemberInputs] = useState(['', '']);

  // Settle Up Form State
  const [settleAmount, setSettleAmount] = useState('');
  const [settleSyncPersonal, setSettleSyncPersonal] = useState(true);
  const [settleAccountId, setSettleAccountId] = useState('');

  // Persist groups
  useEffect(() => {
    try {
      localStorage.setItem('fintrack_shared_groups', JSON.stringify(groups));
    } catch {}
  }, [groups]);

  // Load personal accounts for settle-up synchronization
  useEffect(() => {
    accountAPI.getAll()
      .then(({ data }) => {
        const list = data.data || [];
        setAccounts(list);
        if (list.length) setSettleAccountId(String(list[0].id));
      })
      .catch(() => {});
  }, []);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || DEFAULT_GROUPS[0];

  // Initialize selected members for new expense
  useEffect(() => {
    if (activeGroup?.members) {
      setSelectedMembers(activeGroup.members.map(m => m.id));
      setExpPaidBy(activeGroup.members[0]?.id || 'm1');
    }
  }, [activeGroupId]);

  // Compute debt simplification
  const debtResult = simplifyDebts(
    activeGroup.members || [],
    activeGroup.expenses || [],
    activeGroup.settlements || [],
    'm1'
  );

  // Handlers
  function handleOpenExpenseModal() {
    setExpTitle('');
    setExpAmount('');
    setExpPaidBy('m1');
    setExpSplitType('equal');
    setExpDate(new Date().toISOString().split('T')[0]);
    setSelectedMembers(activeGroup.members.map(m => m.id));
    setExpenseModal(true);
  }

  function handleSaveExpense() {
    if (!expTitle.trim() || !expAmount || Number(expAmount) <= 0) {
      toast.error('Title and valid amount are required');
      return;
    }
    if (!selectedMembers.length) {
      toast.error('Select at least one member to split with');
      return;
    }

    const membersForSplit = activeGroup.members.filter(m => selectedMembers.includes(m.id));
    const splits = calculateSplits(Number(expAmount), expSplitType, membersForSplit);

    const newExpense = {
      id: `exp_${Date.now()}`,
      title: expTitle.trim(),
      amount: Number(expAmount),
      paidBy: expPaidBy,
      splitType: expSplitType,
      splits,
      date: expDate,
    };

    setGroups(prev => prev.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, expenses: [newExpense, ...g.expenses] };
      }
      return g;
    }));

    setExpenseModal(false);
    toast.success(`Recorded shared expense: ${expTitle} (${money(expAmount)})`);
  }

  function handleDeleteExpense(expId) {
    setGroups(prev => prev.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, expenses: g.expenses.filter(e => e.id !== expId) };
      }
      return g;
    }));
    toast.success('Shared expense removed');
  }

  function handleCreateGroup() {
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    const validNewMembers = newMemberInputs
      .map(name => name.trim())
      .filter(Boolean)
      .map((name, idx) => ({ id: `m_${Date.now()}_${idx}`, name }));

    const members = [
      { id: 'm1', name: 'You (Me)', isCurrent: true },
      ...validNewMembers,
    ];

    const newGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      emoji: newGroupEmoji || '👥',
      members,
      expenses: [],
      settlements: [],
    };

    setGroups(prev => [newGroup, ...prev]);
    setActiveGroupId(newGroup.id);
    setGroupModal(false);
    setNewGroupName('');
    setNewMemberInputs(['', '']);
    toast.success(`Created group "${newGroupName}"!`);
  }

  function openSettleModal(debt) {
    setSettleModal(debt);
    setSettleAmount(String(debt.amount));
    setSettleSyncPersonal(true);
  }

  async function handleConfirmSettle() {
    if (!settleModal || !settleAmount || Number(settleAmount) <= 0) return;

    const amt = Number(settleAmount);
    const newSettlement = {
      id: `set_${Date.now()}`,
      fromMemberId: settleModal.from,
      toMemberId: settleModal.to,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      note: `Settled payment between ${settleModal.fromName} and ${settleModal.toName}`,
    };

    setGroups(prev => prev.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, settlements: [newSettlement, ...g.settlements] };
      }
      return g;
    }));

    // Optionally sync into personal transactions ledger
    if (settleSyncPersonal && settleAccountId) {
      try {
        const isReceiving = settleModal.to === 'm1';
        const isPaying = settleModal.from === 'm1';

        if (isReceiving || isPaying) {
          const payload = {
            type: isReceiving ? 'income' : 'expense',
            title: isReceiving
              ? `Settlement from ${settleModal.fromName} (${activeGroup.name})`
              : `Settled to ${settleModal.toName} (${activeGroup.name})`,
            amount: amt,
            account_id: String(settleAccountId),
            date: new Date().toISOString().split('T')[0],
            note: `Splitwise settlement in ${activeGroup.name}`,
          };
          await txnAPI.create(payload);
          toast.success('Synced settle-up into personal transaction journal!');
        }
      } catch {
        // Continue even if local API fails
      }
    }

    setSettleModal(null);
    toast.success(`Settled ${money(amt)} between ${settleModal.fromName} and ${settleModal.toName}!`);
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Shared Finances & Bill Splitting"
        title="Split & Groups"
        subtitle="Splitwise-grade minimum cash flow debt simplification & settle-ups"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setGroupModal(true)}>
              <Plus size={16} /> New Group
            </Button>
            <Button variant="primary" onClick={handleOpenExpenseModal}>
              <Receipt size={16} /> Add Shared Expense
            </Button>
          </div>
        }
      />

      {/* Horizontal Group Selector Bar */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 6,
          marginBottom: 20,
        }}
      >
        {groups.map(grp => {
          const active = grp.id === activeGroupId;
          return (
            <button
              key={grp.id}
              type="button"
              onClick={() => setActiveGroupId(grp.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                border: active ? '2px solid #10b981' : '1px solid var(--border)',
                background: active ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-strong)',
                color: active ? '#10b981' : 'var(--text)',
                fontWeight: active ? 800 : 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '1.15rem' }}>{grp.emoji}</span>
              <span>{grp.name}</span>
              <span className="badge-pill badge-pill-neutral" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                {grp.members?.length || 0} members
              </span>
            </button>
          );
        })}
      </div>

      {/* Group Metric Overview Grid */}
      <div className="metric-grid">
        <div className="card-stagger">
          <MetricCard
            label="Total Group Spend"
            value={money(debtResult.totalGroupSpend)}
            helper={`${activeGroup.expenses?.length || 0} shared bills recorded`}
            tone="neutral"
            icon={<DollarSign />}
          />
        </div>

        <div className="card-stagger">
          <MetricCard
            label="Your Net Position"
            value={
              debtResult.myNetBalance > 0
                ? `+${money(debtResult.myNetBalance)}`
                : debtResult.myNetBalance < 0
                ? `-${money(Math.abs(debtResult.myNetBalance))}`
                : '₹0'
            }
            helper={
              debtResult.myNetBalance > 0
                ? 'You are owed money by the group'
                : debtResult.myNetBalance < 0
                ? 'You owe money to the group'
                : 'All settled up with everyone!'
            }
            tone={debtResult.myNetBalance > 0 ? 'mint' : debtResult.myNetBalance < 0 ? 'coral' : 'neutral'}
            icon={debtResult.myNetBalance >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
          />
        </div>

        <div className="card-stagger">
          <MetricCard
            label="Pending Simplified Transfers"
            value={String(debtResult.simplifiedDebts.length)}
            helper="Minimum cash flow settlements"
            tone="blue"
            icon={<Scale />}
          />
        </div>

        <div className="card-stagger">
          <MetricCard
            label="Group Members"
            value={String(activeGroup.members?.length || 0)}
            helper="Active split participants"
            tone="neutral"
            icon={<Users />}
          />
        </div>
      </div>

      {/* View Segmented Control */}
      <div style={{ marginTop: 24, marginBottom: 16 }}>
        <SegmentedControl
          value={activeView}
          onChange={setActiveView}
          options={[
            { value: 'debts', label: `Settle-Up Matrix (${debtResult.simplifiedDebts.length})`, icon: <Scale size={15} /> },
            { value: 'expenses', label: `Shared Bills (${activeGroup.expenses?.length || 0})`, icon: <Receipt size={15} /> },
            { value: 'balances', label: `Member Balances (${activeGroup.members?.length || 0})`, icon: <Users size={15} /> },
          ]}
        />
      </div>

      {/* TAB 1: Settle-Up Matrix (Debt Simplification) */}
      {activeView === 'debts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {debtResult.simplifiedDebts.length === 0 ? (
            <Card style={{ padding: '40px 20px', textAlign: 'center' }}>
              <CheckCircle2 size={42} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: 'var(--text)' }}>
                All Settled Up!
              </h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Everyone in <strong>{activeGroup.name}</strong> is completely squared away. No pending transfers needed.
              </p>
            </Card>
          ) : (
            debtResult.simplifiedDebts.map((debt, idx) => {
              const involvesMe = debt.from === 'm1' || debt.to === 'm1';
              const iOwe = debt.from === 'm1';
              return (
                <div
                  key={idx}
                  className="data-card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    border: involvesMe ? (iOwe ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)') : '1px solid var(--border)',
                    background: involvesMe ? (iOwe ? 'rgba(244, 63, 94, 0.04)' : 'rgba(16, 185, 129, 0.04)') : 'var(--surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'var(--surface-strong)',
                        border: '1px solid var(--border)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        color: 'var(--text)',
                      }}
                    >
                      {debt.fromName.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text)' }}>
                        <span>{debt.fromName}</span>
                        <ArrowRight size={16} color="var(--text-muted)" />
                        <span>{debt.toName}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {debt.from === 'm1' ? 'You need to pay' : debt.to === 'm1' ? 'You are receiving' : 'External group transfer'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: involvesMe ? (iOwe ? '#f43f5e' : '#10b981') : 'var(--text)' }}>
                      {money(debt.amount)}
                    </strong>
                    <Button variant="primary" onClick={() => openSettleModal(debt)} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                      <Check size={14} /> Record Settle-Up
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: Shared Bills Stream */}
      {activeView === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeGroup.expenses?.length === 0 ? (
            <Card style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Receipt size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text)' }}>No Shared Bills Yet</h3>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Add dinners, groceries, tickets, or Airbnb rentals to split effortlessly.
              </p>
              <Button variant="primary" onClick={handleOpenExpenseModal}>
                <Plus size={15} /> Add First Bill
              </Button>
            </Card>
          ) : (
            activeGroup.expenses.map(exp => {
              const payer = activeGroup.members.find(m => m.id === exp.paidBy);
              const mySplit = exp.splits?.find(s => s.memberId === 'm1');
              const isPayerMe = exp.paidBy === 'm1';

              return (
                <div
                  key={exp.id}
                  className="data-card"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    background: 'var(--surface)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(16, 185, 129, 0.12)',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#10b981',
                      }}
                    >
                      <Receipt size={20} />
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text)', display: 'block' }}>
                        {exp.title}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {exp.date} • Paid by <strong>{payer?.name || 'Someone'}</strong> • {exp.splitType === 'equal' ? 'Split Equally' : 'Custom Split'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                        {money(exp.amount)}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: isPayerMe ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                        {isPayerMe ? `You lent ${money(exp.amount - (mySplit?.amount || 0))}` : `Your share: ${money(mySplit?.amount || 0)}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteExpense(exp.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}
                      title="Delete expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: Member Balances */}
      {activeView === 'balances' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {activeGroup.members?.map(m => {
            const net = debtResult.balances[m.id] || 0;
            return (
              <div
                key={m.id}
                className="data-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--surface)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: m.id === 'm1' ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-strong)',
                      border: '1px solid var(--border)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      color: m.id === 'm1' ? '#10b981' : 'var(--text)',
                    }}
                  >
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text)', display: 'block' }}>
                      {m.name}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {m.id === 'm1' ? 'You' : 'Member'}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: net > 0 ? '#10b981' : net < 0 ? '#f43f5e' : 'var(--text-muted)' }}>
                    {net > 0 ? `+${money(net)}` : net < 0 ? `-${money(Math.abs(net))}` : '₹0'}
                  </div>
                  <span className={`badge-pill ${net > 0 ? 'badge-pill-mint' : net < 0 ? 'badge-pill-coral' : 'badge-pill-neutral'}`} style={{ fontSize: '0.7rem' }}>
                    {net > 0 ? 'Owed to them' : net < 0 ? 'Owes' : 'Settled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Shared Expense BottomSheet */}
      {expenseModal && (
        <BottomSheet title={`Add Shared Expense in ${activeGroup.name}`} onClose={() => setExpenseModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TextInput
              label="Expense Title / Description"
              placeholder="e.g. Seafood Dinner, Uber ride, Airbnb"
              value={expTitle}
              onChange={e => setExpTitle(e.target.value)}
            />

            <TextInput
              label="Total Amount (₹)"
              type="number"
              placeholder="e.g. 2400"
              value={expAmount}
              onChange={e => setExpAmount(e.target.value)}
            />

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Paid By
              </label>
              <select
                className="input"
                value={expPaidBy}
                onChange={e => setExpPaidBy(e.target.value)}
                style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)' }}
              >
                {activeGroup.members?.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Split With Members
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--surface-strong)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                {activeGroup.members?.map(m => {
                  const checked = selectedMembers.includes(m.id);
                  return (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 600 }}>{m.name}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedMembers(prev =>
                            checked ? prev.filter(id => id !== m.id) : [...prev, m.id]
                          );
                        }}
                        style={{ width: 18, height: 18, accentColor: '#10b981', cursor: 'pointer' }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            <TextInput
              label="Date"
              type="date"
              value={expDate}
              onChange={e => setExpDate(e.target.value)}
            />

            <Button variant="primary" onClick={handleSaveExpense} style={{ marginTop: 8, background: '#10b981', color: 'white' }}>
              Save Shared Expense
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* New Group BottomSheet */}
      {groupModal && (
        <BottomSheet title="Create New Shared Group" onClose={() => setGroupModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TextInput
              label="Group Name"
              placeholder="e.g. Ladakh Bike Trip, Flat 102, Dinner Club"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
            />

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Group Icon / Emoji
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['🏝️', '🏠', '🚗', '✈️', '🍔', '☕', '🎮', '💡'].map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewGroupEmoji(em)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      border: newGroupEmoji === em ? '2px solid #10b981' : '1px solid var(--border)',
                      background: newGroupEmoji === em ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface)',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                Add Members (Besides You)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {newMemberInputs.map((val, idx) => (
                  <TextInput
                    key={idx}
                    placeholder={`Friend ${idx + 1} Name`}
                    value={val}
                    onChange={e => {
                      const next = [...newMemberInputs];
                      next[idx] = e.target.value;
                      setNewMemberInputs(next);
                    }}
                  />
                ))}
                <Button
                  variant="secondary"
                  onClick={() => setNewMemberInputs(prev => [...prev, ''])}
                  style={{ padding: '6px', fontSize: '0.78rem' }}
                >
                  <Plus size={14} /> Add Another Friend
                </Button>
              </div>
            </div>

            <Button variant="primary" onClick={handleCreateGroup} style={{ marginTop: 8, background: '#10b981', color: 'white' }}>
              Create Group
            </Button>
          </div>
        </BottomSheet>
      )}

      {/* Record Settle-Up BottomSheet */}
      {settleModal && (
        <BottomSheet title="Record Settle-Up Payment" onClose={() => setSettleModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--surface-strong)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Payer:</span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text)', display: 'block' }}>{settleModal.fromName}</strong>
              </div>
              <ArrowRight size={18} color="#10b981" />
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Receiver:</span>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text)', display: 'block' }}>{settleModal.toName}</strong>
              </div>
            </div>

            <TextInput
              label="Settlement Amount (₹)"
              type="number"
              value={settleAmount}
              onChange={e => setSettleAmount(e.target.value)}
            />

            {(settleModal.from === 'm1' || settleModal.to === 'm1') && (
              <div style={{ background: 'var(--surface-strong)', padding: 12, borderRadius: 10, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={settleSyncPersonal}
                    onChange={e => setSettleSyncPersonal(e.target.checked)}
                    style={{ accentColor: '#10b981', width: 16, height: 16 }}
                  />
                  <span>Sync to Personal Transaction Ledger</span>
                </label>
                {settleSyncPersonal && (
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                      Personal Account
                    </label>
                    <select
                      className="input"
                      value={settleAccountId}
                      onChange={e => setSettleAccountId(e.target.value)}
                      style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)' }}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({money(acc.balance || 0)})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <Button variant="primary" onClick={handleConfirmSettle} style={{ marginTop: 8, background: '#10b981', color: 'white' }}>
              Confirm Settle-Up Payment
            </Button>
          </div>
        </BottomSheet>
      )}
    </Page>
  );
}
