import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Bell,
  ChevronRight,
  Cloud,
  HelpCircle,
  Info,
  LockKeyhole,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Chip, IconButton, Page, PageHeader, SectionTitle } from '../components/ui/CashewUI';

export default function SettingsPage() {
  const { user, logout, tokenStatus, secsLeft, fmtCountdown, refreshToken } = useAuth();
  const navigate = useNavigate();
  const [toggles, setToggles] = useState({ biometric: false, notifications: true, cloudSync: true });

  function toggle(key) {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleLogout() {
    if (!confirm('Sign out?')) return;
    await logout();
    navigate('/login', { replace: true });
  }

  const authMethod = user?.auth_method || 'phone';
  const statusTone = tokenStatus === 'critical' ? 'pink' : tokenStatus === 'warning' ? 'amber' : 'mint';

  const prefs = [
    { key: 'notifications', Icon: Bell, label: 'Push Notifications', sub: 'Transaction alerts and reminders' },
    { key: 'biometric', Icon: LockKeyhole, label: 'Biometric Lock', sub: 'Face ID or fingerprint unlock' },
    { key: 'cloudSync', Icon: Cloud, label: 'Cloud Sync', sub: 'Sync across devices' },
  ];

  const links = [
    { Icon: ShieldCheck, label: 'JWT Inspector', action: () => navigate('/jwt'), badge: 'DEV' },
    { Icon: LockKeyhole, label: 'Privacy Policy', action: () => toast('Coming soon') },
    { Icon: HelpCircle, label: 'Help & Support', action: () => toast('help@fintrack.app') },
    { Icon: Star, label: 'Rate FinTrack', action: () => toast('Thank you') },
    { Icon: Info, label: 'About', action: () => toast('FinTrack v2.0'), badge: 'v2.0' },
  ];

  return (
    <Page>
      <PageHeader eyebrow="Account" title="Settings" subtitle="Manage session health, preferences, and app utilities." />

      <Card tone="mint" style={{ marginBottom: 14 }}>
        <div className="transaction-row" style={{ borderBottom: 0, padding: 0 }}>
          <div className="user-dot" style={{ width: 56, height: 56, fontSize: 20 }}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="transaction-title">{user?.name || 'User'}</div>
            <div className="transaction-meta">{user?.email || user?.phone || 'No contact saved'}</div>
            <div style={{ marginTop: 8 }}>
              <Chip tone="blue">
                {authMethod === 'google' ? 'Google' : authMethod === 'email' ? 'Email' : 'Phone'} sign-in
              </Chip>
            </div>
          </div>
          <IconButton icon={authMethod === 'email' ? <Mail size={18} /> : <Phone size={18} />} label="Auth method" />
        </div>
      </Card>

      <Card tone={statusTone} onClick={refreshToken} style={{ marginBottom: 16, cursor: 'pointer' }}>
        <div className="transaction-row" style={{ borderBottom: 0, padding: 0 }}>
          <div className="transaction-icon">
            <ShieldCheck size={21} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="transaction-title">
              {tokenStatus === 'critical' ? 'Token expiring now' : tokenStatus === 'warning' ? 'Session expiring soon' : 'Session active'}
            </div>
            <div className="transaction-meta">JWT expires in {fmtCountdown(secsLeft)}. Tap to extend.</div>
          </div>
          <ChevronRight size={18} />
        </div>
      </Card>

      <SectionTitle>Preferences</SectionTitle>
      <Card className="list-card">
        {prefs.map(pref => (
          <SettingsRow key={pref.key} Icon={pref.Icon} title={pref.label} sub={pref.sub} trailing={<Toggle on={toggles[pref.key]} onToggle={() => toggle(pref.key)} />} />
        ))}
      </Card>

      <SectionTitle>More</SectionTitle>
      <Card className="list-card">
        {links.map(link => (
          <SettingsRow
            key={link.label}
            Icon={link.Icon}
            title={link.label}
            onClick={link.action}
            trailing={<>{link.badge && <Chip tone="blue">{link.badge}</Chip>}<ChevronRight size={17} /></>}
          />
        ))}
      </Card>

      <p style={{ textAlign: 'center', margin: '18px 0', fontSize: 12 }}>FINTRACK v2.0 - JWT + React</p>
      <Button variant="danger" className="ui-button-full" onClick={handleLogout}>
        <LogOut size={18} /> Sign Out
      </Button>
    </Page>
  );
}

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
