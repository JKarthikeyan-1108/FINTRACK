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
  const [modal, setModal] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expenses: 0 });
  const [form, setForm] = useState(blankForm());
  const [isScanning, setIsScanning] = useState(false);
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
      const { data } = await txnAPI.getAll({ page: nextPage, limit: 25, search, type: typeFilter });
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
  }, [search, typeFilter]);

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
        eyebrow="Activity"
        title="Transactions"
        subtitle={`${total} records in your ledger`}
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="soft" onClick={handleScanReceipt} disabled={isScanning}>
              <Camera size={18} /> {isScanning ? 'Scanning...' : 'Scan'}
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={18} /> Add
            </Button>
          </div>
        }
      />

      <div className="metric-grid">
        <MetricCard label="Income" value={money(summary.income)} helper="This month" tone="mint" icon={<ArrowUpRight />} />
        <MetricCard label="Expenses" value={money(summary.expenses)} helper="This month" tone="pink" icon={<ArrowDownRight />} />
        <MetricCard label="Net" value={money(net)} helper={net >= 0 ? 'Positive cashflow' : 'Needs attention'} tone={net >= 0 ? 'blue' : 'amber'} icon={<WalletCards />} />
        <MetricCard label="Entries" value={String(total)} helper="Loaded ledger" tone="purple" icon={<ReceiptText />} />
      </div>

      <Card style={{ marginTop: 14 }}>
        <div className="field" style={{ marginBottom: 12 }}>
          <span>Search</span>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: 15, color: '#66706a' }} />
            <input
              className="input"
              placeholder="Search title, category, account"
              value={search}
              onChange={event => setSearch(event.target.value)}
              style={{ paddingLeft: 42, paddingRight: search ? 42 : 14 }}
            />
            {search && (
              <button
                aria-label="Clear search"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 11, top: 10, border: 0, background: 'transparent', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <SegmentedControl
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: '', label: 'All', icon: <ReceiptText /> },
            { value: 'income', label: 'Income', icon: <ArrowUpRight /> },
            { value: 'expense', label: 'Expense', icon: <ArrowDownRight /> },
          ]}
        />
      </Card>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
          <div className="spinner" />
        </div>
      ) : txns.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={search ? 'No matching transactions' : 'No transactions yet'}
          text={search ? 'Try a different search or clear the filters.' : 'Add your first transaction and start building your spending story.'}
          action={!search && <Button onClick={openCreate}><Plus size={18} /> Add transaction</Button>}
        />
      ) : (
        <>
          {Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((sum, txn) => sum + (txn.type === 'income' ? Number(txn.amount) : -Number(txn.amount)), 0);
            return (
              <div key={date}>
                <div className="date-group">
                  <span>{date}</span>
                  <span className={dayTotal >= 0 ? 'amount-income' : 'amount-expense'}>{dayTotal >= 0 ? '+' : ''}{money(dayTotal)}</span>
                </div>
                <Card className="list-card">
                  {items.map(txn => (
                    <div key={txn.id} className="transaction-row" onClick={() => setActiveRow(activeRow === txn.id ? null : txn.id)}>
                      <div className="transaction-icon">
                        {txn.type === 'income' ? <ArrowUpRight size={21} /> : <ArrowDownRight size={21} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="transaction-title">{txn.title}</div>
                        <div className="transaction-meta">{dateShort(txn.date)} - {txn.category_name || 'General'} - {txn.account_name || 'Account'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className={`transaction-amount ${txn.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                          {txn.type === 'income' ? '+' : '-'}{money(txn.amount)}
                        </div>
                        {activeRow === txn.id && (
                          <div className="row-actions">
                            <button onClick={event => { event.stopPropagation(); openEdit(txn); }}><Edit3 size={13} /> Edit</button>
                            <button onClick={event => { event.stopPropagation(); handleDelete(txn.id); }}><Trash2 size={13} /> Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            );
          })}

          {txns.length < total && (
            <Button variant="soft" className="ui-button-full" disabled={loadMore} onClick={() => loadTxns(page + 1, false)} style={{ marginTop: 14 }}>
              {loadMore ? 'Loading...' : `Load ${total - txns.length} more`}
            </Button>
          )}
        </>
      )}

      <FAB icon={<Plus size={24} />} label="Add transaction" onClick={openCreate} />

      {modal && (
        <BottomSheet title={editTxn ? 'Edit Transaction' : 'Add Transaction'} onClose={closeModal}>
          <SegmentedControl
            value={form.type}
            onChange={value => setForm(prev => ({ ...prev, type: value, category_id: '' }))}
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
          />

          <div style={{ height: 20 }} />
          
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Amount</label>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Category</label>
              <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>See All</button>
            </div>
            <VisualCategorySelect 
              categories={filteredCats.length ? filteredCats.slice(0, 8) : [{ id: '', name: 'General', icon: '📦' }]} 
              value={form.category_id} 
              onChange={val => setForm(prev => ({ ...prev, category_id: val }))} 
              label=""
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Account</label>
            <div style={{ position: 'relative' }}>
              <select 
                className="input" 
                style={{ appearance: 'none', background: '#f8fafc', color: '#0f172a', fontWeight: 500 }}
                value={form.account_id}
                onChange={event => setForm(prev => ({ ...prev, account_id: event.target.value }))}
              >
                <option value="" disabled>Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              <div style={{ position: 'absolute', right: 14, top: 15, pointerEvents: 'none', color: '#64748b' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Date</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 13, color: '#64748b' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </span>
              <input 
                type="date"
                className="input"
                style={{ paddingLeft: 40, color: '#0f172a', fontWeight: 500 }}
                value={form.date}
                onChange={event => setForm(prev => ({ ...prev, date: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Note (Optional)</label>
            <input 
              type="text"
              className="input"
              placeholder="Add a note..."
              value={form.note}
              onChange={event => setForm(prev => ({ ...prev, note: event.target.value }))}
            />
          </div>

          <Button className="ui-button-full" onClick={handleSave} style={{ background: '#10b981', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
            {editTxn ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}
