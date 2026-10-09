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
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { accountAPI, txnAPI } from '../services/api';
import {
  BottomSheet,
  Button,
  Card,
  Chip,
  IconButton,
  Page,
  PageHeader,
  SectionTitle,
  TextInput,
  SelectInput,
} from '../components/ui/CashewUI';
import { money } from '../lib/format';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
];

const ACCOUNT_TYPES = ['savings', 'current', 'credit', 'wallet', 'cash', 'investment'];
const ACCOUNT_COLORS = ['#4a9eff', '#2db87d', '#e24b4a', '#ef9f27', '#9b59b6', '#1abc9c', '#e74c3c', '#3498db'];

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
  color: '#4a9eff',
});

export default function SettingsPage() {
  const { user, logout, tokenStatus, secsLeft, fmtCountdown, refreshToken, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Preferences (visual-only toggles)
  const [toggles, setToggles] = useState({ biometric: false, notifications: true, cloudSync: true });

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

  useEffect(() => {
    accountAPI.getAll()
      .then(({ data }) => setAccounts(data.data || []))
      .catch(() => {})
      .finally(() => setAccountsLoading(false));
  }, []);

  function toggle(key) {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
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
      color: acc.color || '#4a9eff',
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
      toast.success(`Exported ${transactions.length} transactions`);
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

  // ── Logout ─────────────────────────────────
  async function handleLogout() {
    if (!confirm('Sign out of FinTrack?')) return;
    await logout();
    navigate('/login', { replace: true });
  }

  const authMethod = user?.auth_method || 'phone';
  const statusTone = tokenStatus === 'critical' ? 'pink' : tokenStatus === 'warning' ? 'amber' : 'mint';
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const prefs = [
    { key: 'notifications', Icon: Bell, label: 'Push Notifications', sub: 'Transaction alerts and reminders' },
    { key: 'biometric', Icon: LockKeyhole, label: 'Biometric Lock', sub: 'Face ID or fingerprint unlock' },
    { key: 'cloudSync', Icon: Cloud, label: 'Cloud Sync', sub: 'Sync across devices' },
  ];

  const links = [
    { Icon: Tag, label: 'Manage Categories', sub: 'Organize your transactions', action: () => navigate('/categories') },
    { Icon: Download, label: 'Export Data (JSON)', sub: 'Download full backup as JSON', action: handleExport, loading: exporting },
    { Icon: Download, label: 'Export Data (CSV)', sub: 'Download transactions as CSV for Excel', action: handleExportCSV, loading: exporting },
    { Icon: ShieldCheck, label: 'JWT Inspector', sub: 'Developer security view', action: () => navigate('/jwt'), badge: 'DEV' },
    { Icon: HelpCircle, label: 'Help & Support', sub: 'Get help with FinTrack', action: () => toast('help@fintrack.app') },
    { Icon: Star, label: 'Rate FinTrack', sub: 'Share your experience', action: () => toast('Thank you!') },
    { Icon: Info, label: 'About', sub: 'App version and info', action: () => toast('FinTrack v2.0 — React + JWT'), badge: 'v2.0' },
  ];

  return (
    <Page>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Your profile, accounts, preferences, and app configuration."
      />

      {/* ── Profile Card ─────────────────────────── */}
      <Card tone="mint" style={{ marginBottom: 14 }}>
        <div className="settings-profile-hero">
          <div className="settings-avatar">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div className="settings-profile-info">
            <h2>{user?.name || 'User'}</h2>
            <p>{user?.email || user?.phone || 'No contact saved'}</p>
            <div className="settings-profile-badges">
              <Chip tone="blue">
                {authMethod === 'google' ? '🔗 Google' : authMethod === 'email' ? '📧 Email' : '📱 Phone'}
              </Chip>
              <Chip tone="mint">{user?.currency || 'INR'}</Chip>
            </div>
          </div>
          <IconButton icon={<Edit3 size={18} />} label="Edit profile" onClick={openProfileEdit} />
        </div>
      </Card>

      {/* ── Session Status ────────────────────────── */}
      <Card tone={statusTone} onClick={refreshToken} style={{ marginBottom: 14, cursor: 'pointer' }}>
        <div className="transaction-row" style={{ borderBottom: 0, padding: 0 }}>
          <div className="settings-section-icon mint">
            <ShieldCheck size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="transaction-title">
              {tokenStatus === 'critical' ? '🔴 Token expiring now' : tokenStatus === 'warning' ? '🟡 Session expiring soon' : '🟢 Session active'}
            </div>
            <div className="transaction-meta">JWT expires in {typeof fmtCountdown === 'function' ? fmtCountdown(secsLeft) : '1h'}. Tap to refresh.</div>
          </div>
          <ChevronRight size={18} />
        </div>
      </Card>

      <div className="settings-grid">
        {/* ── Accounts & Wallets ────────────────────── */}
        <div>
          <SectionTitle action={<Button variant="soft" onClick={openCreateAccount}><Plus size={16} /> Add</Button>}>
            Accounts & Wallets
          </SectionTitle>
          <Card className="list-card">
            {accountsLoading ? (
              <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
                <div className="spinner" />
              </div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p>No accounts yet</p>
                <Button variant="soft" onClick={openCreateAccount} style={{ marginTop: 10 }}>
                  <Plus size={16} /> Create account
                </Button>
              </div>
            ) : (
              <>
                {accounts.map(acc => (
                  <div key={acc.id} className="account-manage-row">
                    <div
                      className="account-manage-icon"
                      style={{ background: `${acc.color || '#4a9eff'}18`, color: acc.color || '#4a9eff' }}
                    >
                      {ACCOUNT_ICONS[acc.type] || '🏦'}
                    </div>
                    <div>
                      <strong>{acc.name}</strong>
                      <small>{acc.type || 'savings'}{acc.is_default ? ' • Default' : ''}</small>
                    </div>
                    <div className="account-manage-right">
                      <b>{money(acc.balance)}</b>
                      {!acc.is_default && (
                        <div className="account-manage-actions">
                          <button onClick={() => openEditAccount(acc)}><Edit3 size={11} /> Edit</button>
                          <button onClick={() => deleteAccount(acc)}><Trash2 size={11} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontSize: 13 }}>
                  <span style={{ fontWeight: 850, color: 'var(--text-muted)' }}>TOTAL BALANCE</span>
                  <b style={{ fontWeight: 900 }}>{money(totalBalance)}</b>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* ── Preferences ──────────────────────────── */}
        <div>
          <SectionTitle>Preferences</SectionTitle>
          <Card className="list-card">
            {prefs.map(pref => (
              <SettingsRow
                key={pref.key}
                Icon={pref.Icon}
                title={pref.label}
                sub={pref.sub}
                trailing={<Toggle on={toggles[pref.key]} onToggle={() => toggle(pref.key)} />}
              />
            ))}

            {/* Currency selector inline */}
            <div style={{ padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div className="settings-section-icon amber"><Landmark size={18} /></div>
                <div>
                  <div className="transaction-title" style={{ fontSize: 14 }}>Currency</div>
                  <div className="transaction-meta">{CURRENCIES.find(c => c.code === (user?.currency || 'INR'))?.label || 'Indian Rupee'}</div>
                </div>
              </div>
              <div className="currency-grid">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    className={`currency-btn ${(user?.currency || 'INR') === c.code ? 'active' : ''}`}
                    onClick={async () => {
                      try {
                        await updateProfile({ currency: c.code });
                        toast.success(`Currency set to ${c.code}`);
                      } catch { toast.error('Failed to update currency'); }
                    }}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* ── Quick Links ──────────────────────────── */}
        <div className="settings-grid-full">
          <SectionTitle>More</SectionTitle>
          <Card className="list-card">
            {links.map(link => (
              <SettingsRow
                key={link.label}
                Icon={link.Icon}
                title={link.label}
                sub={link.sub}
                onClick={link.loading ? undefined : link.action}
                trailing={
                  <>
                    {link.badge && <Chip tone="blue">{link.badge}</Chip>}
                    {link.loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <ChevronRight size={17} />}
                  </>
                }
              />
            ))}
          </Card>
        </div>
      </div>

      {/* ── Danger Zone ───────────────────────────── */}
      <div className="settings-danger">
        <p style={{ textAlign: 'center', margin: '0 0 12px', fontSize: 12, color: 'var(--text-soft)' }}>
          FINTRACK v2.0 — React + JWT HS256
        </p>
        <Button variant="danger" className="ui-button-full" onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </Button>
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
            <span>Currency</span>
            <div className="currency-grid">
              {CURRENCIES.map(c => (
                <button
                  key={c.code}
                  type="button"
                  className={`currency-btn ${profileForm.currency === c.code ? 'active' : ''}`}
                  onClick={() => setProfileForm(prev => ({ ...prev, currency: c.code }))}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>
          <Button className="ui-button-full" onClick={saveProfile} disabled={profileSaving}>
            <UserRound size={18} /> {profileSaving ? 'Saving...' : 'Save profile'}
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
            <span>Color</span>
            <div className="swatch-grid">
              {ACCOUNT_COLORS.map(color => (
                <button
                  key={color}
                  className={`swatch ${accountForm.color === color ? 'active' : ''}`}
                  style={{ background: color }}
                  aria-label={`Select ${color}`}
                  onClick={() => setAccountForm(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <Button className="ui-button-full" onClick={saveAccount}>
            <Wallet size={18} /> {editAccount ? 'Save changes' : 'Create account'}
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}

// ── Helper Components ──────────────────────────────────
function SettingsRow({ Icon, title, sub, trailing, onClick }) {
  return (
    <div className="transaction-row" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="transaction-icon">
        <Icon size={20} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="transaction-title">{title}</div>
        {sub && <div className="transaction-meta">{sub}</div>}
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>{trailing}</div>
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={event => { event.stopPropagation(); onToggle(); }}
      aria-pressed={on}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        border: '1px solid rgba(17,23,25,.1)',
        background: on ? '#315f3b' : '#dce4dc',
        cursor: 'pointer',
        position: 'relative',
        padding: 0,
        transition: 'background .18s ease',
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: on ? 21 : 2,
          transition: 'left .18s ease',
          boxShadow: '0 2px 7px rgba(17,23,25,.2)',
        }}
      />
    </button>
  );
}
