import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDownRight,
  ArrowUpRight,
  Edit3,
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

  async function handleSave() {
    if (!form.title || !form.amount) {
      toast.error('Title and amount are required');
      return;
    }
    if (!form.account_id) {
      toast.error('Select an account');
      return;
    }

    try {
      const payload = { ...form, amount: Number(form.amount) };
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
        action={<Button variant="primary" onClick={openCreate}><Plus size={18} /> Add</Button>}
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
              { value: 'expense', label: 'Expense', icon: <ArrowDownRight /> },
              { value: 'income', label: 'Income', icon: <ArrowUpRight /> },
            ]}
          />

          <div style={{ height: 14 }} />
          <TextInput label="Title" value={form.title} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} placeholder="Groceries, salary, rent" />
          <div className="field-row">
            <TextInput label="Amount" type="number" value={form.amount} onChange={event => setForm(prev => ({ ...prev, amount: event.target.value }))} placeholder="0" />
            <TextInput label="Date" type="date" value={form.date} onChange={event => setForm(prev => ({ ...prev, date: event.target.value }))} />
          </div>
          <SelectInput label="Category" value={form.category_id} onChange={event => setForm(prev => ({ ...prev, category_id: event.target.value }))}>
            <option value="">General</option>
            {filteredCats.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectInput>
          <SelectInput label="Account" value={form.account_id} onChange={event => setForm(prev => ({ ...prev, account_id: event.target.value }))}>
            <option value="">Select account</option>
            {accounts.map(account => <option key={account.id} value={account.id}>{account.name} ({money(account.balance)})</option>)}
          </SelectInput>
          <TextInput label="Note" value={form.note} onChange={event => setForm(prev => ({ ...prev, note: event.target.value }))} placeholder="Optional" />
          <Button className="ui-button-full" onClick={handleSave}>{editTxn ? 'Save changes' : 'Add transaction'}</Button>
        </BottomSheet>
      )}
    </Page>
  );
}
