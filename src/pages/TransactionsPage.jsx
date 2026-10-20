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
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckSquare,
  Square,
  CheckCircle2,
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
import { generateFinancialStatement } from '../lib/pdfReport';
import { scanReceiptFile } from '../lib/receiptOcr';
import { queueOfflineTransaction, flushOfflineQueue, getPendingOfflineTransactions } from '../lib/offlineSync';
import { parseBankStatement } from '../lib/bankStatementParser';

const blankForm = () => ({
  type: 'expense',
  title: '',
  amount: '',
  category_id: '',
  account_id: '',
  date: new Date().toISOString().split('T')[0],
  note: '',
  receiptUrl: null,
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
  const fileInputRef = useRef(null);

  // Bank Statement Import State
  const importFileRef = useRef(null);
  const [importModal, setImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importedTxns, setImportedTxns] = useState([]);
  const [importAccountId, setImportAccountId] = useState('');
  const [isImporting, setIsImporting] = useState(false);

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

  function triggerReceiptUpload() {
    fileInputRef.current?.click();
  }

  async function handleReceiptFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading('Preprocessing & scanning receipt with AI OCR...', { icon: '📸' });

    try {
      const result = await scanReceiptFile(file);
      const matchedCategory = categories.find(c =>
        c.name.toLowerCase().includes(result.categoryKey) ||
        result.merchant.toLowerCase().includes(c.name.toLowerCase())
      ) || categories[0];

      setForm({
        ...blankForm(),
        type: 'expense',
        title: result.merchant,
        amount: String(result.amount),
        date: result.date,
        note: `Receipt: ${result.fileName}${result.tax ? ` (Tax: ₹${result.tax})` : ''} • Scanned with OCR`,
        account_id: accounts[0] ? String(accounts[0].id) : '',
        category_id: matchedCategory ? String(matchedCategory.id) : '',
        receiptUrl: result.thumbnailUrl,
      });

      setEditTxn(null);
      setModal(true);
      toast.success(`Scanned: ${result.merchant} (${money(result.amount)})`, { id: toastId });
    } catch {
      toast.error('Failed to parse receipt image. Please enter details manually.', { id: toastId });
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function triggerStatementImport() {
    importFileRef.current?.click();
  }

  async function handleStatementFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Parsing bank statement: ${file.name}...`, { icon: '📄' });
    try {
      const text = await file.text();
      const parsed = parseBankStatement(text, file.name, txns);
      if (!parsed.length) {
        toast.error('No valid transactions found in the file. Ensure CSV, OFX, or QIF format.', { id: toastId });
        return;
      }

      setImportFileName(file.name);
      setImportedTxns(parsed);
      setImportAccountId(accounts[0] ? String(accounts[0].id) : '');
      setImportModal(true);
      const dupCount = parsed.filter(t => t.isDuplicate).length;
      toast.success(
        `Parsed ${parsed.length} records!${dupCount > 0 ? ` (${dupCount} duplicate(s) flagged)` : ''}`,
        { id: toastId }
      );
    } catch {
      toast.error('Failed to parse bank statement. Please verify file format.', { id: toastId });
    } finally {
      if (importFileRef.current) importFileRef.current.value = '';
    }
  }

  function toggleImportItem(index) {
    setImportedTxns(prev => prev.map((item, idx) => idx === index ? { ...item, selected: !item.selected } : item));
  }

  function setAllImportItems(mode) {
    setImportedTxns(prev => prev.map(item => {
      if (mode === 'all') return { ...item, selected: true };
      if (mode === 'none') return { ...item, selected: false };
      if (mode === 'non-duplicates') return { ...item, selected: !item.isDuplicate };
      return item;
    }));
  }

  async function handleCommitBatchImport() {
    const selected = importedTxns.filter(t => t.selected);
    if (!selected.length) {
      toast.error('Please select at least one transaction to import');
      return;
    }
    if (!importAccountId) {
      toast.error('Please select a target account for imported records');
      return;
    }

    setIsImporting(true);
    const toastId = toast.loading(`Importing ${selected.length} transaction(s)...`);
    let successCount = 0;

    for (const item of selected) {
      const matchedCat = categories.find(c =>
        c.name.toLowerCase() === (item.category || '').toLowerCase() ||
        c.name.toLowerCase().includes((item.category || '').toLowerCase())
      ) || categories[0];

      const payload = {
        type: item.type,
        title: item.title || item.rawNarration || 'Bank Transaction',
        amount: Number(item.amount),
        category_id: matchedCat ? String(matchedCat.id) : '',
        account_id: String(importAccountId),
        date: item.date,
        note: `Imported via Statement (${importFileName})${item.rawNarration ? ` • ${item.rawNarration}` : ''}`,
      };

      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        await queueOfflineTransaction(payload);
        successCount++;
      } else {
        try {
          await txnAPI.create(payload);
          successCount++;
        } catch {
          await queueOfflineTransaction(payload);
          successCount++;
        }
      }
    }

    setIsImporting(false);
    setImportModal(false);
    setImportedTxns([]);
    toast.success(`Successfully imported ${successCount} transactions!`, { id: toastId });
    loadTxns(1);
  }

  useEffect(() => {
    const handleOnline = async () => {
      try {
        const res = await flushOfflineQueue(payload => txnAPI.create(payload));
        if (res.synced > 0) {
          toast.success(`Synced ${res.synced} offline transaction(s) with cloud!`);
          loadTxns(1);
        }
      } catch {
        // Retry on next online cycle
      }
    };

    window.addEventListener('online', handleOnline);
    // Initial check for any pending items
    handleOnline();

    return () => window.removeEventListener('online', handleOnline);
  }, []);

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

    const payload = { ...form, title: finalTitle, amount: Number(form.amount) };

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline && !editTxn) {
      await queueOfflineTransaction(payload);
      setTxns(prev => [{ ...payload, id: `offline_${Date.now()}`, is_offline: true }, ...prev]);
      setTotal(prev => prev + 1);
      toast('Saved offline! Will sync automatically when connection restores.', { icon: '💾' });
      closeModal();
      return;
    }

    try {
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
      if (!editTxn && (!error.response || error.code === 'ERR_NETWORK')) {
        await queueOfflineTransaction(payload);
        setTxns(prev => [{ ...payload, id: `offline_${Date.now()}`, is_offline: true }, ...prev]);
        setTotal(prev => prev + 1);
        toast('Connection unavailable. Saved offline to sync later.', { icon: '💾' });
        closeModal();
        return;
      }
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              onClick={() => {
                generateFinancialStatement({
                  periodLabel: 'Reconciled Transaction Journal',
                  overview: { income: summary.income, expenses: summary.expenses, savings: summary.income - summary.expenses },
                  accounts,
                  transactions: txns,
                });
                toast.success('Generated official financial statement');
              }}
            >
              <Download size={15} /> PDF Statement
            </Button>
            <Button variant="soft" onClick={triggerStatementImport}>
              <Upload size={15} /> Import Statement
            </Button>
            <Button variant="soft" onClick={triggerReceiptUpload} disabled={isScanning}>
              <Camera size={16} /> {isScanning ? 'Processing OCR...' : 'Scan Receipt'}
            </Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={16} /> Add Transaction
            </Button>
          </div>
        }
      />

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleReceiptFileSelected}
      />

      <input
        type="file"
        ref={importFileRef}
        accept=".csv,.ofx,.qif,text/csv,text/plain"
        style={{ display: 'none' }}
        onChange={handleStatementFileSelected}
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
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid var(--border-danger, rgba(180, 35, 24, 0.25))', background: 'var(--bg-danger-subtle, rgba(180, 35, 24, 0.08))', color: 'var(--status-negative)', borderRadius: 6, padding: '3px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
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

          {form.receiptUrl && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'var(--surface-strong)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <img src={form.receiptUrl} alt="Receipt preview" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-subtle)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="badge-pill badge-pill-mint" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>OCR Verified</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Camera Scan</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text)', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {form.title} • {money(form.amount)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, receiptUrl: null }))}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                title="Remove attached receipt"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          <div className="field" style={{ marginBottom: 18, background: 'var(--surface-strong)', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Transaction Amount
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: form.type === 'income' ? 'var(--status-positive)' : 'var(--text-muted)' }}>
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

          <Button variant="primary" className="ui-button-full" onClick={handleSave} style={{ padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
            {editTxn ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </BottomSheet>
      )}

      {/* Statement Import Reconciler Modal */}
      {importModal && (
        <BottomSheet title={`Reconcile Bank Statement: ${importFileName}`} onClose={() => !isImporting && setImportModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Account Selector & Summary Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, background: 'var(--surface-strong)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Target Destination Account
                </label>
                <select
                  className="input"
                  value={importAccountId}
                  onChange={e => setImportAccountId(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({money(acc.balance || 0)})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div className="badge-pill badge-pill-mint" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <CheckCircle2 size={14} /> Total: {importedTxns.length} records
                </div>
                {importedTxns.filter(t => t.isDuplicate).length > 0 && (
                  <div className="badge-pill badge-pill-amber" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    <AlertTriangle size={14} /> {importedTxns.filter(t => t.isDuplicate).length} duplicates flagged
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--status-positive)' }}>
                  Selected to import: {importedTxns.filter(t => t.selected).length}
                </div>
              </div>
            </div>

            {/* Quick Selection Toolbar */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Review parsed records before importing:
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="secondary" onClick={() => setAllImportItems('all')} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  Select All
                </Button>
                <Button variant="secondary" onClick={() => setAllImportItems('non-duplicates')} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  Skip Duplicates
                </Button>
                <Button variant="secondary" onClick={() => setAllImportItems('none')} style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                  Deselect All
                </Button>
              </div>
            </div>

            {/* Scrollable Records Preview */}
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {importedTxns.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleImportItem(idx)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: item.isDuplicate ? '1px solid rgba(180, 83, 9, 0.4)' : item.selected ? '1px solid var(--border-focus)' : '1px solid var(--border)',
                    background: item.selected ? 'var(--brand-soft)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleImportItem(idx)}
                        onClick={e => e.stopPropagation()}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.date} • {item.category} {item.rawNarration && item.rawNarration !== item.title ? `(${item.rawNarration.slice(0, 30)}...)` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: item.type === 'income' ? 'var(--status-positive)' : 'var(--text)' }}>
                        {item.type === 'income' ? '+' : '-'}{money(item.amount)}
                      </div>
                      <span className={`badge-pill ${item.type === 'income' ? 'badge-pill-mint' : 'badge-pill-neutral'}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {item.type.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {item.isDuplicate && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--status-warning)', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, background: 'var(--amber-subtle, rgba(180, 83, 9, 0.1))' }}>
                      <AlertTriangle size={12} />
                      <span>{item.duplicateInfo?.reason || 'Potential duplicate with existing transaction'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <Button
                variant="secondary"
                onClick={() => setImportModal(false)}
                disabled={isImporting}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCommitBatchImport}
                disabled={isImporting || importedTxns.filter(t => t.selected).length === 0}
                style={{ flex: 2 }}
              >
                {isImporting ? 'Importing Transactions...' : `Confirm & Import (${importedTxns.filter(t => t.selected).length} Records)`}
              </Button>
            </div>
          </div>
        </BottomSheet>
      )}
    </Page>
  );
}
