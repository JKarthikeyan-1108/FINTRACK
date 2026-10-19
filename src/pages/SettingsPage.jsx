import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell,
  ChevronRight,
  Cloud,
  CreditCard,
  Download,
  Edit3,
  HelpCircle,
  Info,
  Landmark,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  UserRound,
  Wallet,
  Sparkles,
  Check,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  EyeOff,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import { accountAPI, txnAPI } from '../services/api';
import {
  BottomSheet,
  Button,
  Page,
  PageHeader,
  TextInput,
  SelectInput,
} from '../components/ui/CashewUI';
import { money } from '../lib/format';
import { SUPPORTED_CURRENCIES, getExchangeRate } from '../lib/currency';
import { generateFinancialStatement } from '../lib/pdfReport';

const ACCOUNT_TYPES = ['savings', 'current', 'credit', 'wallet', 'cash', 'investment'];
const ACCOUNT_COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e', '#14b8a6', '#6366f1', '#ec4899'];

const ACCOUNT_ICONS = {
  savings: '🏦',
  current: '💳',
  credit: '💎',
  wallet: '👛',
  cash: '💵',
  investment: '📈',
};

const blankAccountForm = () => ({
  name: '',
  type: 'savings',
  balance: '',
  color: '#10b981',
});

export default function SettingsPage() {
  const { user, logout, tokenStatus, secsLeft, fmtCountdown, refreshToken, updateProfile } = useAuth();
  const navigate = useNavigate();
  const {
    pinEnabled,
    isLocked,
    autoLockTimeout,
    biometricAvailable,
    lockNow,
    setupPin,
    disablePin,
    updateAutoLock,
  } = useSecurity();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinForm, setPinForm] = useState({ pin: '', confirm: '' });

  // Preferences (visual-only toggles)
  const [toggles, setToggles] = useState({ notifications: true, cloudSync: true });

  // Profile editing
  const [profileModal, setProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', currency: 'INR' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Accounts
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountModal, setAccountModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [accountForm, setAccountForm] = useState(blankAccountForm());

  // Exporting
  const [exporting, setExporting] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  useEffect(() => {
    accountAPI.getAll()
      .then(({ data }) => setAccounts(data.data || []))
      .catch(() => {})
      .finally(() => setAccountsLoading(false));
  }, []);

  function toggle(key) {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleTokenRefresh() {
    setIsRefreshingToken(true);
    try {
      await refreshToken();
      toast.success('Session token refreshed');
    } catch {
      toast.error('Token refresh failed');
    } finally {
      setIsRefreshingToken(false);
    }
  }

  // ── Profile ─────────────────────────────────
  function openProfileEdit() {
    setProfileForm({
      name: user?.name || '',
      currency: user?.currency || 'INR',
    });
    setProfileModal(true);
  }

  async function saveProfile() {
    if (!profileForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated');
      setProfileModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update');
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Accounts ────────────────────────────────
  function openCreateAccount() {
    setEditAccount(null);
    setAccountForm(blankAccountForm());
    setAccountModal(true);
  }

  function openEditAccount(acc) {
    setEditAccount(acc);
    setAccountForm({
      name: acc.name,
      type: acc.type || 'savings',
      balance: String(acc.balance || 0),
      color: acc.color || '#10b981',
    });
    setAccountModal(true);
  }

  function closeAccountModal() {
    setAccountModal(false);
    setEditAccount(null);
    setAccountForm(blankAccountForm());
  }

  async function saveAccount() {
    if (!accountForm.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      const payload = { ...accountForm, balance: Number(accountForm.balance || 0) };
      if (editAccount) {
        const { data } = await accountAPI.update(editAccount.id, payload);
        setAccounts(prev => prev.map(a => a.id === editAccount.id ? { ...a, ...data.data } : a));
        toast.success('Account updated');
      } else {
        const { data } = await accountAPI.create(payload);
        setAccounts(prev => [...prev, data.data]);
        toast.success('Account created');
      }
      closeAccountModal();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save account');
    }
  }

  async function deleteAccount(acc) {
    if (acc.is_default) {
      toast.error('Cannot delete default account');
      return;
    }
    if (!confirm(`Delete "${acc.name}"?`)) return;
    try {
      await accountAPI.remove(acc.id);
      setAccounts(prev => prev.filter(a => a.id !== acc.id));
      toast.success('Account deleted');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete');
    }
  }

  // ── Export ──────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      const { data } = await txnAPI.getAll({ limit: 9999 });
      const transactions = data.data || [];
      const exportData = {
        exported_at: new Date().toISOString(),
        user: { name: user?.name, email: user?.email },
        total_transactions: transactions.length,
        transactions,
        accounts,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${transactions.length} transactions as JSON`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const { data } = await txnAPI.getAll({ limit: 9999 });
      const transactions = data.data || [];
      const csvRows = ['ID,Type,Amount,Title,Category,Account,Date,Note'];
      transactions.forEach(t => {
        csvRows.push([
          t.id, t.type, t.amount,
          `"${(t.title || '').replace(/"/g, '""')}"`,
          `"${(t.category_name || '').replace(/"/g, '""')}"`,
          `"${(t.account_name || '').replace(/"/g, '""')}"`,
          t.date,
          `"${(t.note || '').replace(/"/g, '""')}"`
        ].join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${transactions.length} transactions as CSV`);
    } catch {
      toast.error('CSV Export failed');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPDF() {
    setExporting(true);
    try {
      const { data } = await txnAPI.getAll({ limit: 200 });
      const transactions = data.data || [];
      generateFinancialStatement({
        user,
        periodLabel: 'Official Fiscal Statement',
        overview: {
          income: transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0),
          expenses: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0),
        },
        accounts,
        transactions,
      });
      toast.success('Generated official financial statement');
    } catch {
      toast.error('Failed to generate PDF statement');
    } finally {
      setExporting(false);
    }
  }

  const handleSetupPinSubmit = async () => {
    if (pinForm.pin.length !== 4 || !/^\d{4}$/.test(pinForm.pin)) {
      toast.error('PIN must be exactly 4 numeric digits');
      return;
    }
    if (pinForm.pin !== pinForm.confirm) {
      toast.error('PIN confirmation does not match');
      return;
    }
    await setupPin(pinForm.pin);
    toast.success('4-Digit Security PIN successfully activated');
    setShowPinModal(false);
    setPinForm({ pin: '', confirm: '' });
  };

  const handleTogglePin = () => {
    if (pinEnabled) {
      if (window.confirm('Disable PIN Lock? The application will no longer require a PIN upon launch.')) {
        disablePin();
        toast.success('App Security Lock disabled');
      }
    } else {
      setPinForm({ pin: '', confirm: '' });
      setShowPinModal(true);
    }
  };

  // ── Logout ─────────────────────────────────
  async function handleLogout() {
    if (!confirm('Sign out of FinTrack on this device?')) return;
    await logout();
    navigate('/login', { replace: true });
  }

  const authMethod = user?.auth_method || 'phone';
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const prefs = [
    { key: 'notifications', Icon: Bell, label: 'Push Notifications', sub: 'Instant transaction alerts & budget milestones' },
    { key: 'biometric', Icon: LockKeyhole, label: 'Biometric Access', sub: 'Require Touch ID / Face ID upon session resume' },
    { key: 'cloudSync', Icon: Cloud, label: 'Cloud Synchronization', sub: 'Continuous encrypted cloud synchronization' },
  ];

  return (
    <Page>
      <PageHeader
        eyebrow="Account & Preferences"
        title="Settings"
        subtitle="Manage your profile, connected accounts, security session, and platform configurations"
        action={
          <span className="badge-pill badge-pill-mint" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <Sparkles size={14} /> FinTrack PRO v14
          </span>
        }
      />

      {/* ── Executive Profile Hero Card ─────────────────────────── */}
      <div className="data-card card-stagger" style={{ marginBottom: 20 }}>
        <div className="data-card-body" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                  flexShrink: 0,
                }}
              >
                {(user?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    {user?.name || 'FinTrack User'}
                  </h2>
                  <span className="badge-pill badge-pill-mint">PRO Plan</span>
                  <span className="badge-pill badge-pill-blue">
                    {authMethod === 'google' ? 'Google OAuth' : authMethod === 'email' ? 'Verified Email' : 'Phone Verified'}
                  </span>
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {authMethod === 'email' ? <Mail size={14} /> : <Phone size={14} />}
                  <span>{user?.email || user?.phone || 'account@fintrack.app'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={openProfileEdit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 10,
                background: 'var(--surface-strong)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Edit3 size={15} /> Edit Profile
            </button>
          </div>

          {/* Quick Stats Banner inside Profile */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginTop: 20,
              paddingTop: 18,
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Consolidated Balance
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                {money(totalBalance)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Active Accounts
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
                {accounts.length} Wallets / Banks
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Default Currency
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', marginTop: 2 }}>
                {user?.currency || 'INR'} ({CURRENCIES.find(c => c.code === (user?.currency || 'INR'))?.symbol || '₹'})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Session Integrity
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0ea5e9', marginTop: 2 }}>
                JWT HS256 Protected
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Security & Live Session Card ────────────────────────── */}
      <div className="data-card card-stagger" style={{ marginBottom: 20 }}>
        <div
          className="data-card-body"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            background: tokenStatus === 'critical' ? 'rgba(244, 63, 94, 0.08)' : tokenStatus === 'warning' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: tokenStatus === 'critical' ? '#f43f5e' : tokenStatus === 'warning' ? '#f59e0b' : '#10b981',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>
                  {tokenStatus === 'critical' ? 'Session Expiring Imminently' : tokenStatus === 'warning' ? 'Session Renewal Advised' : 'Active Authenticated Session'}
                </strong>
                <span className={`badge-pill ${tokenStatus === 'critical' ? 'badge-pill-pink' : tokenStatus === 'warning' ? 'badge-pill-amber' : 'badge-pill-mint'}`}>
                  {typeof fmtCountdown === 'function' ? fmtCountdown(secsLeft) : '1h'} remaining
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Cryptographic token is validated on all requests. Click refresh to extend session lifetime.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/jwt')}
              className="badge-pill badge-pill-neutral"
              style={{ cursor: 'pointer', padding: '8px 12px', fontSize: '0.78rem', border: '1px solid var(--border)' }}
            >
              <KeyRound size={13} /> Token Inspector
            </button>
            <button
              type="button"
              onClick={handleTokenRefresh}
              disabled={isRefreshingToken}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
                opacity: isRefreshingToken ? 0.7 : 1,
              }}
            >
              <RefreshCw size={14} className={isRefreshingToken ? 'spin' : ''} />
              {isRefreshingToken ? 'Refreshing...' : 'Renew Token'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2-Column Dashboard Grid ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Left Column: Accounts & Data Portability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Accounts & Wallets */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Wallet size={17} color="#10b981" /> Accounts & Wallets
              </div>
              <button
                type="button"
                onClick={openCreateAccount}
                className="data-card-action"
                style={{ color: '#10b981' }}
              >
                <Plus size={15} /> Add Account
              </button>
            </div>
            <div className="data-card-body" style={{ padding: '8px 20px 16px' }}>
              {accountsLoading ? (
                <div style={{ display: 'grid', placeItems: 'center', padding: '36px 0' }}>
                  <div className="spinner" />
                </div>
              ) : accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🏦</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>No accounts configured</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>Add your bank account, credit card, or wallet</div>
                  <Button variant="soft" onClick={openCreateAccount} style={{ marginTop: 14 }}>
                    <Plus size={15} /> Create First Account
                  </Button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {accounts.map(acc => (
                      <div
                        key={acc.id}
                        className="modern-row"
                        style={{ padding: '12px 0' }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 10,
                            background: `${acc.color || '#10b981'}1a`,
                            color: acc.color || '#10b981',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '1.1rem',
                            border: `1px solid ${acc.color || '#10b981'}33`,
                            flexShrink: 0,
                          }}
                        >
                          {ACCOUNT_ICONS[acc.type] || '🏦'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {acc.name}
                            </strong>
                            {acc.is_default && (
                              <span className="badge-pill badge-pill-mint" style={{ fontSize: '0.65rem' }}>Default</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 2 }}>
                            {acc.type || 'savings'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
                            {money(acc.balance)}
                          </div>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => openEditAccount(acc)}
                              className="account-manage-actions button"
                              style={{ border: '1px solid var(--border)', background: 'var(--surface-strong)', color: 'var(--text)', padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', cursor: 'pointer' }}
                            >
                              <Edit3 size={11} /> Edit
                            </button>
                            {!acc.is_default && (
                              <button
                                type="button"
                                onClick={() => deleteAccount(acc)}
                                style={{ border: '1px solid rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.08)', color: '#f43f5e', padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', cursor: 'pointer' }}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 14,
                      marginTop: 6,
                      borderTop: '1px solid var(--border)',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Consolidated Balance
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>
                      {money(totalBalance)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Data Portability & Backup */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Download size={17} color="#0ea5e9" /> Data Export & Portability
              </div>
              <span className="badge-pill badge-pill-blue">Full Ownership</span>
            </div>
            <div className="data-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Your financial data belongs exclusively to you. Export the complete transactional ledger at any time in standardized formats.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'var(--surface-strong)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Download size={15} color="#0ea5e9" /> JSON Backup
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={exporting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'var(--surface-strong)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Download size={15} color="#10b981" /> CSV for Excel
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={exporting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'var(--surface-strong)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Download size={15} color="#8b5cf6" /> PDF Statement
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preferences, Currencies & Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* App Security & Privacy Vault */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <LockKeyhole size={17} color="#8b5cf6" /> App Security & Privacy Vault
              </div>
              <span className={`badge-pill ${pinEnabled ? 'badge-pill-mint' : 'badge-pill-pink'}`}>
                {pinEnabled ? 'PIN Vault Active' : 'Unprotected'}
              </span>
            </div>
            <div className="data-card-body" style={{ padding: '8px 20px 16px' }}>
              {/* Row 1: PIN Protection */}
              <div className="modern-row" style={{ padding: '14px 0' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: pinEnabled ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-strong)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                    color: pinEnabled ? '#10b981' : 'var(--text)',
                    flexShrink: 0,
                  }}
                >
                  <KeyRound size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>4-Digit Privacy PIN</strong>
                    {pinEnabled && (
                      <button
                        type="button"
                        onClick={() => { setPinForm({ pin: '', confirm: '' }); setShowPinModal(true); }}
                        style={{ background: 'none', border: 'none', color: '#0ea5e9', fontSize: '0.74rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {pinEnabled ? 'Requires PIN on app launch or inactivity' : 'Lock your financial accounts behind a PIN'}
                  </div>
                </div>
                <Toggle on={pinEnabled} onToggle={handleTogglePin} />
              </div>

              {/* Row 2: Biometric Hardware Key */}
              <div className="modern-row" style={{ padding: '14px 0' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'var(--surface-strong)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                    color: biometricAvailable ? '#0ea5e9' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  <Smartphone size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>Biometric Hardware Sensor</strong>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {biometricAvailable ? 'Platform authenticator (TouchID/FaceID) detected' : 'SHA-256 cryptographic client vault enabled'}
                  </div>
                </div>
                <span className={`badge-pill ${biometricAvailable ? 'badge-pill-blue' : 'badge-pill-neutral'}`} style={{ fontSize: '0.7rem' }}>
                  {biometricAvailable ? 'Available' : 'Emulated'}
                </span>
              </div>

              {/* Row 3: Auto-Lock Timeout */}
              {pinEnabled && (
                <div className="modern-row" style={{ padding: '14px 0' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'var(--surface-strong)',
                      border: '1px solid var(--border)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#f59e0b',
                      flexShrink: 0,
                    }}
                  >
                    <Sliders size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>Auto-Lock Inactivity</strong>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Locks screen after period of inactivity
                    </div>
                  </div>
                  <select
                    value={autoLockTimeout}
                    onChange={(e) => updateAutoLock(Number(e.target.value))}
                    style={{
                      background: 'var(--surface-strong)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <option value={0}>Immediately on background</option>
                    <option value={1}>1 Minute</option>
                    <option value={5}>5 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                  </select>
                </div>
              )}

              {/* Row 4: Quick Lock Trigger */}
              {pinEnabled && (
                <div style={{ paddingTop: 10, paddingBottom: 6 }}>
                  <button
                    type="button"
                    onClick={lockNow}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <LockKeyhole size={14} /> Lock FinTrack Vault Immediately
                  </button>
                </div>
              )}

              {/* Currency Selector */}
              <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-subtle)', marginTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Landmark size={16} color="#10b981" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)' }}>Base Currency & FX</span>
                  </div>
                  <span className="badge-pill badge-pill-mint">{user?.currency || 'INR'} Selected</span>
                </div>

                <div className="currency-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                  {SUPPORTED_CURRENCIES.map(c => {
                    const isSelected = (user?.currency || 'INR') === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        className={`currency-btn ${isSelected ? 'active' : ''}`}
                        title={`${c.name} (${c.region})`}
                        onClick={async () => {
                          try {
                            await updateProfile({ currency: c.code });
                            toast.success(`Currency switched to ${c.code} (${c.name})`);
                          } catch {
                            toast.error('Failed to update currency');
                          }
                        }}
                      >
                        <div style={{ fontSize: '1.15rem' }}>{c.flag}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, marginTop: 2 }}>{c.code}</div>
                        <div style={{ fontSize: '0.68rem', opacity: 0.75 }}>{c.symbol}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Links & Tools */}
          <div className="data-card card-stagger">
            <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
              <div className="data-card-title">
                <Info size={17} color="#0ea5e9" /> Tools & Resources
              </div>
              <span className="badge-pill badge-pill-neutral">Quick Links</span>
            </div>
            <div className="data-card-body" style={{ padding: '6px 20px 14px' }}>
              {[
                { Icon: Tag, label: 'Manage Categories', sub: 'Customize expense & income taxonomy', action: () => navigate('/categories') },
                { Icon: ShieldCheck, label: 'JWT Security Inspector', sub: 'Inspect access token headers, payload and signature', action: () => navigate('/jwt'), badge: 'DEV' },
                { Icon: HelpCircle, label: 'Help & Support', sub: 'Questions, bug reports or feedback', action: () => toast('Support contact: help@fintrack.app') },
                { Icon: Star, label: 'Rate FinTrack', sub: 'Help us improve the personal finance platform', action: () => toast.success('Thank you for rating FinTrack!') },
              ].map(item => (
                <div
                  key={item.label}
                  className="modern-row"
                  onClick={item.action}
                  style={{ cursor: 'pointer', padding: '12px 0' }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--surface-strong)',
                      border: '1px solid var(--border)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--text)',
                      flexShrink: 0,
                    }}
                  >
                    <item.Icon size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <strong style={{ fontSize: '0.86rem', color: 'var(--text)' }}>{item.label}</strong>
                      {item.badge && <span className="badge-pill badge-pill-blue" style={{ fontSize: '0.65rem' }}>{item.badge}</span>}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone: Sign Out */}
          <div
            className="data-card"
            style={{
              borderColor: 'rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.03)',
            }}
          >
            <div className="data-card-body" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#f43f5e' }}>Sign Out of Session</strong>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Clears local credentials and terminates active authentication session.
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#f43f5e',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Edit Sheet ────────────────────── */}
      {profileModal && (
        <BottomSheet title="Edit Profile" onClose={() => setProfileModal(false)}>
          <TextInput
            label="Display name"
            value={profileForm.name}
            onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Your name"
          />
          <div className="field">
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Currency</span>
            <div className="currency-grid">
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={`currency-btn ${profileForm.currency === c.code ? 'active' : ''}`}
                  onClick={() => setProfileForm(prev => ({ ...prev, currency: c.code }))}
                >
                  <div style={{ fontSize: '1rem', fontWeight: 800 }}>{c.symbol}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85 }}>{c.code}</div>
                </button>
              ))}
            </div>
          </div>
          <Button className="ui-button-full" onClick={saveProfile} disabled={profileSaving}>
            <UserRound size={18} /> {profileSaving ? 'Saving Changes...' : 'Save Profile'}
          </Button>
        </BottomSheet>
      )}

      {/* ── Account Create/Edit Sheet ─────────────── */}
      {accountModal && (
        <BottomSheet title={editAccount ? 'Edit Account' : 'New Account'} onClose={closeAccountModal}>
          <TextInput
            label="Account name"
            value={accountForm.name}
            onChange={e => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Savings, Salary, Credit Card..."
          />
          <div className="field-row">
            <SelectInput
              label="Type"
              value={accountForm.type}
              onChange={e => setAccountForm(prev => ({ ...prev, type: e.target.value }))}
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
              ))}
            </SelectInput>
            <TextInput
              label="Balance"
              type="number"
              value={accountForm.balance}
              onChange={e => setAccountForm(prev => ({ ...prev, balance: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div className="field">
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Color Accent</span>
            <div className="swatch-grid" style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {ACCOUNT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`swatch ${accountForm.color === color ? 'active' : ''}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: color,
                    border: accountForm.color === color ? '3px solid #ffffff' : '2px solid transparent',
                    boxShadow: accountForm.color === color ? `0 0 0 2px ${color}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  aria-label={`Select ${color}`}
                  onClick={() => setAccountForm(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <Button className="ui-button-full" onClick={saveAccount} style={{ marginTop: 14 }}>
            <Wallet size={18} /> {editAccount ? 'Save Changes' : 'Create Account'}
          </Button>
        </BottomSheet>
      )}

      {/* ── PIN Setup Modal ──────────────────────── */}
      {showPinModal && (
        <BottomSheet title={pinEnabled ? 'Change Security PIN' : 'Set 4-Digit Security PIN'} onClose={() => setShowPinModal(false)}>
          <div style={{ padding: '4px 0 16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Set a secure 4-digit numeric code to guard your accounts, transaction ledger, and financial reports from unauthorized eyes.
            </p>

            <TextInput
              label="Enter 4-Digit PIN"
              type="password"
              maxLength={4}
              value={pinForm.pin}
              onChange={e => setPinForm(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="••••"
              autoFocus
            />

            <TextInput
              label="Confirm 4-Digit PIN"
              type="password"
              maxLength={4}
              value={pinForm.confirm}
              onChange={e => setPinForm(prev => ({ ...prev, confirm: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="••••"
            />

            <Button
              className="ui-button-full"
              onClick={handleSetupPinSubmit}
              disabled={pinForm.pin.length !== 4 || pinForm.pin !== pinForm.confirm}
              style={{ marginTop: 14 }}
            >
              <KeyRound size={18} /> Save & Activate PIN Lock
            </Button>
          </div>
        </BottomSheet>
      )}
    </Page>
  );
}

// ── Polished Toggle Switch ──────────────────────────────────
function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={event => { event.stopPropagation(); onToggle(); }}
      aria-pressed={on}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        border: '1px solid var(--border)',
        background: on ? '#10b981' : 'var(--surface-strong)',
        cursor: 'pointer',
        position: 'relative',
        padding: 0,
        transition: 'all .2s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: 2,
          left: on ? 20 : 2,
          transition: 'left .2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  );
}
