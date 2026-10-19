import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownRight,
  ArrowUpRight,
  Edit3,
  Camera,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { accountAPI, categoryAPI, txnAPI } from '../services/api';
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
  VisualCategorySelect,
  VisualAccountSelect,
  TextInput,
} from '../components/ui/CashewUI';
import { dateShort, money } from '../lib/format';

const blankForm = () => ({
  type: 'expense',
  title: '',
  amount: '',
  category_id: '',
  account_id: '',
  date: new Date().toISOString().split('T')[0],
  note: '',
});

export default function TransactionsPage() {
  const [txns, setTxns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [modal, setModal] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expenses: 0 });
  const [form, setForm] = useState(blankForm());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const searchTimer = useRef(null);

  useEffect(() => {
    categoryAPI.getAll().then(({ data }) => setCategories(data.data || [])).catch(() => {});
    accountAPI.getAll()
      .then(({ data }) => {
        const list = data.data || [];
        setAccounts(list);
        if (list.length) setForm(prev => ({ ...prev, account_id: String(list[0].id) }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const now = new Date();
    txnAPI.summary({ month: now.getMonth() + 1, year: now.getFullYear() })
      .then(({ data }) => setSummary({
        income: Number(data.summary?.total_income || 0),
        expenses: Number(data.summary?.total_expense || 0),
      }))
      .catch(() => {});
  }, [txns.length]);

  async function loadTxns(nextPage = 1, replace = true) {
    if (nextPage === 1) setLoading(true);
    else setLoadMore(true);

    try {
      const { data } = await txnAPI.getAll({ page: nextPage, limit: 25, search, type: typeFilter, from: fromDate || undefined, to: toDate || undefined });
      setTxns(prev => replace ? data.data || [] : [...prev, ...(data.data || [])]);
      setTotal(data.total || 0);
      setPage(nextPage);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
      setLoadMore(false);
    }
  }

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadTxns(1), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search, typeFilter, fromDate, toDate]);

  function openCreate() {
    setEditTxn(null);
    setForm({ ...blankForm(), account_id: accounts[0] ? String(accounts[0].id) : '' });
    setModal(true);
  }

  function openEdit(txn) {
    setEditTxn(txn);
    setForm({
      type: txn.type,
      title: txn.title,
      amount: String(txn.amount),
      category_id: String(txn.category_id || ''),
      account_id: String(txn.account_id || ''),
      date: txn.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      note: txn.note || '',
    });
    setModal(true);
    setActiveRow(null);
  }

  function closeModal() {
    setModal(false);
    setEditTxn(null);
    setForm({ ...blankForm(), account_id: accounts[0] ? String(accounts[0].id) : '' });
  }

  function handleScanReceipt() {
    setIsScanning(true);
    toast('Scanning receipt...', { icon: '📸', duration: 2000 });
    
    // Simulate OCR processing time
    setTimeout(() => {
      setIsScanning(false);
      
      // Auto-fill form with simulated scanned data
      setForm({
        ...blankForm(),
        type: 'expense',
        title: 'Starbucks Coffee',
        amount: '450',
        note: 'Scanned from receipt (Store #492)',
        account_id: accounts[0] ? String(accounts[0].id) : '',
        category_id: categories.find(c => c.name.toLowerCase().includes('food'))?.id || categories[0]?.id || ''
      });
      
      setEditTxn(null);
      setModal(true);
      toast.success('Receipt scanned successfully!');
    }, 2000);
  }

  async function handleSave() {
    if (!form.amount) {
      toast.error('Amount is required');
      return;
    }
    if (!form.account_id) {
      toast.error('Select an account');
      return;
    }

    let finalTitle = form.title;
    if (!finalTitle) {
      const selectedCat = categories.find(c => String(c.id) === String(form.category_id));
      finalTitle = selectedCat ? selectedCat.name : 'General';
    }

    try {
      const payload = { ...form, title: finalTitle, amount: Number(form.amount) };
      if (editTxn) {
        const { data } = await txnAPI.update(editTxn.id, payload);
        setTxns(prev => prev.map(txn => txn.id === editTxn.id ? data.data : txn));
        toast.success('Transaction updated');
      } else {
        const { data } = await txnAPI.create(payload);
        setTxns(prev => [data.data, ...prev]);
        setTotal(prev => prev + 1);
        toast.success('Transaction added');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save transaction');
    }
  }

  async function handleDelete(id) {
    try {
      await txnAPI.remove(id);
      setTxns(prev => prev.filter(txn => txn.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      setActiveRow(null);
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
    }
  }

  const grouped = txns.reduce((acc, txn) => {
    const key = new Date(txn.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(txn);
    return acc;
  }, {});

  const filteredCats = categories.filter(category => category.type === form.type || category.type === 'investment');
  const net = summary.income - summary.expenses;

  return (
    <Page>
      <PageHeader
        eyebrow="Activity & Ledger"
        title="Transactions"
        subtitle={`${total} reconciled records in your financial journal.`}
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="soft" onClick={handleScanReceipt} disabled={isScanning}>
              <Camera size={16} /> {isScanning ? 'Processing...' : 'Scan Receipt'}
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={16} /> Add Transaction
            </Button>
          </div>
        }
      />

      <div className="metric-grid">
        <div className="card-stagger">
          <MetricCard
            label="Total Income"
            value={money(summary.income)}
            helper="This calendar month"
            tone="mint"
            icon={<ArrowUpRight />}
            trend="up"
            trendValue="+12.4%"
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Total Expenses"
            value={money(summary.expenses)}
            helper="This calendar month"
            tone="pink"
            icon={<ArrowDownRight />}
            trend="down"
            trendValue="-3.1%"
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Net Flow"
            value={money(net)}
            helper={net >= 0 ? 'Surplus retained' : 'Deficit run'}
            tone={net >= 0 ? 'blue' : 'amber'}
            icon={<WalletCards />}
          />
        </div>
        <div className="card-stagger">
          <MetricCard
            label="Total Entries"
            value={String(total)}
            helper="Reconciled transactions"
            tone="purple"
            icon={<ReceiptText />}
          />
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="data-card" style={{ marginBottom: 20 }}>
        <div className="data-card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                placeholder="Search title, merchant, note..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                style={{ paddingLeft: 40, paddingRight: search ? 36 : 14, height: 42, fontSize: '0.86rem' }}
              />
              {search && (
                <button
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <SegmentedControl
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: '', label: 'All Types' },
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' },
              ]}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="date"
                className="input"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                title="From Date"
                style={{ height: 42, fontSize: '0.8rem', padding: '0 10px', flex: 1 }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
              <input
                type="date"
                className="input"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                title="To Date"
                style={{ height: 42, fontSize: '0.8rem', padding: '0 10px', flex: 1 }}
              />
              {(fromDate || toDate) && (
                <button
                  onClick={() => { setFromDate(''); setToDate(''); }}
                  title="Clear dates"
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
          <div className="spinner" />
        </div>
      ) : txns.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={search || typeFilter || fromDate || toDate ? 'No matching records' : 'No transactions recorded'}
          text={search || typeFilter || fromDate || toDate ? 'Try adjusting your search filters or date range.' : 'Record your first transaction to unlock deep spending analytics.'}
          action={!search && <Button onClick={openCreate}><Plus size={16} /> Add transaction</Button>}
        />
      ) : (
        <div key={`${typeFilter || 'all'}-${fromDate}-${toDate}-${search}`} className="tab-transition-container" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((sum, txn) => sum + (txn.type === 'income' ? Number(txn.amount) : -Number(txn.amount)), 0);
            return (
              <div key={date} className="data-card card-stagger">
                <div className="data-card-header" style={{ padding: '12px 18px', background: 'var(--surface-strong)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>{date}</span>
                    <span className="badge-pill badge-pill-neutral" style={{ fontSize: '0.7rem' }}>
                      {items.length} {items.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </div>
                  <span className={`badge-pill ${dayTotal >= 0 ? 'badge-pill-mint' : 'badge-pill-pink'}`} style={{ fontSize: '0.78rem' }}>
                    {dayTotal >= 0 ? '+' : ''}{money(dayTotal)}
                  </span>
                </div>
                <div style={{ padding: '4px 18px' }}>
                  {items.map(txn => (
                    <div
                      key={txn.id}
                      className="modern-row"
                      onClick={() => setActiveRow(activeRow === txn.id ? null : txn.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={`modern-row-avatar ${txn.type === 'income' ? 'modern-row-avatar-income' : 'modern-row-avatar-expense'}`}>
                        {txn.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <div className="modern-row-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="modern-row-title">{txn.title}</span>
                          <span className="badge-pill badge-pill-neutral" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                            {txn.category_name || 'General'}
                          </span>
                        </div>
                        <div className="modern-row-meta">
                          <span>{dateShort(txn.date)}</span>
                          <span>•</span>
                          <span>{txn.account_name || 'Main Account'}</span>
                          {txn.note && (
                            <>
                              <span>•</span>
                              <span style={{ fontStyle: 'italic', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {txn.note}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className={`modern-row-amount ${txn.type === 'income' ? 'amount-positive' : 'amount-negative'}`}>
                          {txn.type === 'income' ? '+' : '-'}{money(txn.amount)}
                        </div>
                        {activeRow === txn.id && (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                            <button
                              onClick={event => { event.stopPropagation(); openEdit(txn); }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid var(--border)', background: 'var(--surface-strong)', color: 'var(--text)', borderRadius: 6, padding: '3px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                              <Edit3 size={11} /> Edit
                            </button>
                            <button
                              onClick={event => { event.stopPropagation(); handleDelete(txn.id); }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: 6, padding: '3px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {txns.length < total && (
            <Button variant="soft" className="ui-button-full" disabled={loadMore} onClick={() => loadTxns(page + 1, false)} style={{ marginTop: 8 }}>
              {loadMore ? 'Fetching...' : `Load ${total - txns.length} more entries`}
            </Button>
          )}
        </div>
      )}

      <FAB icon={<Plus size={22} />} label="Add transaction" onClick={openCreate} />

      {modal && (
        <BottomSheet title={editTxn ? 'Edit Transaction' : 'Record Transaction'} onClose={closeModal}>
          <SegmentedControl
            value={form.type}
            onChange={value => setForm(prev => ({ ...prev, type: value, category_id: '' }))}
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
          />

          <div style={{ height: 18 }} />
          
          <div className="field" style={{ marginBottom: 18, background: 'var(--surface-strong)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Transaction Amount
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: form.type === 'income' ? '#10b981' : 'var(--text-muted)' }}>
                {form.type === 'income' ? '+₹' : '₹'}
              </span>
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
              Title / Merchant
            </label>
            <input 
              type="text"
              className="input"
              placeholder="E.g., Grocery store, salary, flight ticket"
              value={form.title}
              onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Category
              </label>
            </div>
            <VisualCategorySelect 
              categories={filteredCats.length ? filteredCats.slice(0, 8) : [{ id: '', name: 'General', icon: '📦' }]} 
              value={form.category_id} 
              onChange={val => setForm(prev => ({ ...prev, category_id: val }))} 
              label=""
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Account
            </label>
            <div style={{ position: 'relative' }}>
              <select 
                className="input" 
                style={{ appearance: 'none', background: 'var(--surface)', color: 'var(--text)', fontWeight: 500 }}
                value={form.account_id}
                onChange={event => setForm(prev => ({ ...prev, account_id: event.target.value }))}
              >
                <option value="" disabled>Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({money(acc.balance || 0)})</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 14, top: 15, pointerEvents: 'none', color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Date
            </label>
            <input 
              type="date"
              className="input"
              style={{ color: 'var(--text)', fontWeight: 500 }}
              value={form.date}
              onChange={event => setForm(prev => ({ ...prev, date: event.target.value }))}
            />
          </div>

          <div className="field" style={{ marginBottom: 22 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Notes (Optional)
            </label>
            <input 
              type="text"
              className="input"
              placeholder="Tag or memo for reconciliation"
              value={form.note}
              onChange={event => setForm(prev => ({ ...prev, note: event.target.value }))}
            />
          </div>

          <Button className="ui-button-full" onClick={handleSave} style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
            {editTxn ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}
