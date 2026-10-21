import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSecurity } from '../../context/SecurityContext';
import useFinTrackPlatform from '../../hooks/useFinTrackPlatform';
import AIChatbot from '../AIChatbot';
import CommandPalette from '../CommandPalette';
import NetworkStatusBanner from '../NetworkStatusBanner';
import PWAInstallPrompt from '../PWAInstallPrompt';
import SecurityLockModal from '../SecurityLockModal';
import { triggerHaptic } from '../../lib/haptics';
import {
  Award,
  Bell,
  BarChart3,
  Calculator,
  ChartPie,
  ChevronRight,
  Compass,
  Flag,
  Home,
  Landmark,
  Laptop,
  Lock,
  Moon,
  Sun,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Repeat2,
  Search,
  Settings,
  ShieldCheck,
  Tag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { getStoredThemePreference, resolveEffectiveTheme, applyTheme } from '../../lib/theme';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { path: '/home', label: 'Dashboard', Icon: Home },
      { path: '/analytics', label: 'Analytics', Icon: BarChart3 },
    ],
  },
  {
    title: 'Ledger & Cash',
    items: [
      { path: '/transactions', label: 'Transactions', Icon: ReceiptText },
      { path: '/budgets', label: 'Budgets', Icon: ChartPie },
      { path: '/subscriptions', label: 'Subscriptions', Icon: Repeat2 },
      { path: '/split', label: 'Split & Groups', Icon: Users },
    ],
  },
  {
    title: 'Wealth & Assets',
    items: [
      { path: '/explore', label: 'Explore & Suggest', Icon: Compass },
      { path: '/investments', label: 'My Investments', Icon: TrendingUp },
      { path: '/goals', label: 'Savings Goals', Icon: Flag },
      { path: '/loans', label: 'Loans & EMI', Icon: Landmark },
      { path: '/calculators', label: 'Calculators', Icon: Calculator },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/categories', label: 'Categories', Icon: Tag },
      { path: '/settings', label: 'Preferences', Icon: Settings },
      { path: '/jwt', label: 'Security (JWT)', Icon: ShieldCheck },
    ],
  },
];

const PRIMARY_NAV = [
  { path: '/home', label: 'Home', Icon: Home },
  { path: '/transactions', label: 'Txns', Icon: ReceiptText },
  { path: '/budgets', label: 'Budgets', Icon: ChartPie },
  { path: '/subscriptions', label: 'Subs', Icon: Repeat2 },
];

const MORE_NAV = [
  { path: '/explore', Icon: Compass, label: 'Explore & Suggest', sub: 'Verified Indian investments & protection' },
  { path: '/investments', Icon: TrendingUp, label: 'My Investments', sub: 'Actual portfolio & rebalancing' },
  { path: '/split', Icon: Users, label: 'Split & Groups', sub: 'Splitwise-grade bill split & debts' },
  { path: '/analytics', Icon: BarChart3, label: 'Analytics', sub: 'Deep insights & reports' },
  { path: '/calculators', Icon: Calculator, label: 'Calculators', sub: 'EMI, SIP, ROI & budget tools' },
  { path: '/goals', Icon: Flag, label: 'Goals', sub: 'Savings targets' },
  { path: '/loans', Icon: Landmark, label: 'Loans & EMI', sub: 'Debt tracker' },
  { path: '/categories', Icon: Tag, label: 'Categories', sub: 'Manage spending tags' },
  { path: '/settings', Icon: Settings, label: 'Settings', sub: 'Account preferences' },
  { path: '/jwt', Icon: ShieldCheck, label: 'JWT Inspector', sub: 'Developer security view' },
];

export default function AppShell() {
  const { isDesktop, isMobile } = useFinTrackPlatform();
  const { tokenStatus, secsLeft, fmtCountdown, user, logout, refreshToken } = useAuth();
  const { pinEnabled, lockNow } = useSecurity();
  const nav = useNavigate();
  const loc = useLocation();
  const [time, setTime] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navProgress, setNavProgress] = useState(false);
  const [themePref, setThemePref] = useState(getStoredThemePreference);
  const [effectiveTheme, setEffectiveTheme] = useState(() => resolveEffectiveTheme(themePref));

  useEffect(() => {
    const effective = applyTheme(themePref);
    setEffectiveTheme(effective);

    if (themePref === 'system' && window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = () => {
        const updated = applyTheme('system');
        setEffectiveTheme(updated);
      };
      mql.addEventListener('change', handleSystemChange);
      return () => mql.removeEventListener('change', handleSystemChange);
    }
  }, [themePref]);

  const handleSelectTheme = (pref) => {
    triggerHaptic('selection');
    document.documentElement.classList.add('theme-transitioning');
    setThemePref(pref);
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  };

  const toggleTheme = () => {
    handleSelectTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    setNavProgress(true);
    const timer = setTimeout(() => setNavProgress(false), 380);
    return () => clearTimeout(timer);
  }, [loc.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      let h = d.getHours();
      const m = d.getMinutes();
      const ap = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      setTime(`${h}:${m < 10 ? '0' : ''}${m} ${ap}`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const isActive = path => loc.pathname === path || loc.pathname.startsWith(`${path}/`);
  const moreActive = MORE_NAV.some(item => isActive(item.path));

  // Determine active breadcrumb name
  const currentNav = [...PRIMARY_NAV, ...MORE_NAV].find(i => isActive(i.path));
  const currentPageTitle = currentNav ? currentNav.label : 'Dashboard';

  function navTo(path) {
    triggerHaptic('selection');
    setMoreOpen(false);
    if (typeof document !== 'undefined' && document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(() => {
        nav(path);
      });
    } else {
      nav(path);
    }
  }

  // DESKTOP LAYOUT (>= 1024px Web View: 240px Fixed Sidebar + 64px Command Bar + Master Ledger Grid)
  if (isDesktop) {
    return (
      <div className="desktop-shell">
        {/* Fixed 240px Left Navigation Sidebar */}
        <aside className="desktop-sidebar" aria-label="Main Navigation">
          <div className="sidebar-header">
            <div className="sidebar-brand-link" onClick={() => navTo('/home')}>
              <div className="sidebar-brand-icon">
                <TrendingUp size={20} strokeWidth={2.5} />
              </div>
              <div>
                <span className="sidebar-brand-title">FinTrack</span>
              </div>
            </div>
            <span className="sidebar-brand-badge">v14 PRO</span>
          </div>

          <nav className="sidebar-nav">
            {NAV_SECTIONS.map(section => (
              <div key={section.title}>
                <div className="sidebar-section-title">{section.title}</div>
                {section.items.map(({ path, label, Icon }) => (
                  <button
                    key={path}
                    type="button"
                    className={`sidebar-item ${isActive(path) ? 'active' : ''}`}
                    onClick={() => navTo(path)}
                  >
                    <Icon size={18} strokeWidth={isActive(path) ? 2.4 : 2} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <PWAInstallPrompt />
            {user && (
              <div
                className="sidebar-user-card"
                onClick={() => navTo('/settings')}
                style={{ cursor: 'pointer' }}
                title="Account Settings"
              >
                <div className="sidebar-user-avatar">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{user.name || user.email?.split('@')[0] || 'User'}</div>
                  <div className="sidebar-user-plan">Active Account</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 64px Top Command Bar */}
        <header className="desktop-command-bar">
          <div className="header-left">
            <div className="header-breadcrumb">
              <span>FinTrack</span>
              <span>/</span>
              <span className="header-breadcrumb-active">{currentPageTitle}</span>
            </div>
          </div>

          <div
            className="search-bar"
            onClick={() => setPaletteOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <input
              type="text"
              placeholder="Search or jump to... (⌘K)"
              aria-label="Search or jump to"
              readOnly
              style={{ cursor: 'pointer' }}
            />
            <Search size={16} className="search-icon" />
            <span className="search-shortcut-badge">⌘K</span>
          </div>

          <div className="header-actions">
            <PWAInstallPrompt compact />
            {tokenStatus && tokenStatus !== 'valid' && typeof fmtCountdown === 'function' && (
              <button
                type="button"
                className="header-btn"
                onClick={refreshToken}
                title="Click to refresh session"
                style={{ color: tokenStatus === 'critical' ? '#ef4444' : '#f59e0b', borderColor: tokenStatus === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)' }}
              >
                <ShieldCheck size={16} />
                <span>Expires: {fmtCountdown(secsLeft)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn"
              title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme mode"
            >
              {effectiveTheme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {pinEnabled && (
              <button
                type="button"
                onClick={lockNow}
                className="icon-btn"
                title="Lock FinTrack Vault Now"
                aria-label="Lock FinTrack Vault Now"
                style={{ color: '#10b981' }}
              >
                <Lock size={17} />
              </button>
            )}

            <button
              type="button"
              className="icon-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} className="icon-btn-svg" />
            </button>

            {user && (
              <div
                className="user-profile"
                style={{ cursor: 'pointer' }}
                onClick={() => navTo('/settings')}
                title="Account Settings"
              >
                <div className="user-dot">{(user.name || user.email || 'U')[0].toUpperCase()}</div>
                <span className="user-name">{user.name?.split(' ')[0] || 'User'}</span>
              </div>
            )}
          </div>
        </header>

        {/* Desktop Isolated Scroll Container */}
        <main className="desktop-content-area">
          <NetworkStatusBanner />
          {navProgress && <div className="route-progress-bar" />}
          <div key={loc.pathname} className="view-transition-container" style={{ padding: '24px 32px' }}>
            <Outlet />
          </div>
        </main>

        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onToggleTheme={toggleTheme}
          onRefreshToken={refreshToken}
        />
        <AIChatbot />
        <SecurityLockModal />
      </div>
    );
  }

  // MOBILE APK LAYOUT (< 1024px: 56px Top Bar + Docked 5-Slot Bottom Nav with Center '+' Button)
  return (
    <div className="mobile-shell">
      {/* 56px Compact Mobile Top App Bar */}
      <header className="mobile-app-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navTo('/home')}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--brand-primary)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <TrendingUp size={18} strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              FinTrack
            </span>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '1px 6px', borderRadius: 999, background: 'var(--brand-soft)', color: 'var(--brand-primary)' }}>
              PRO
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="icon-btn"
            title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme mode"
            style={{ width: 36, height: 36 }}
          >
            {effectiveTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {pinEnabled && (
            <button
              type="button"
              onClick={lockNow}
              className="icon-btn"
              title="Lock FinTrack Vault Now"
              aria-label="Lock FinTrack Vault Now"
              style={{ width: 36, height: 36, color: '#10b981' }}
            >
              <Lock size={16} />
            </button>
          )}

          {user && (
            <button
              type="button"
              onClick={() => navTo('/settings')}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover))',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.82rem',
                border: 'none',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 2px 8px rgba(112, 38, 50, 0.25)',
              }}
              title="Settings"
              aria-label="User Profile"
            >
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Scrollable Content Area */}
      <main className="mobile-content-area" onClick={() => setMoreOpen(false)}>
        <NetworkStatusBanner />
        {navProgress && <div className="route-progress-bar" />}
        <div key={loc.pathname} className="view-transition-container" style={{ padding: '12px 14px' }}>
          <Outlet />
        </div>
      </main>

      {/* Slide-Up Extended Modules Bottom Sheet */}
      {moreOpen && (
        <>
          <div className="more-popover-backdrop" onClick={() => setMoreOpen(false)} />
          <div className="more-popover" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Extended Modules">
            <div className="more-popover-header">
              <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                Platform Modules
              </span>
              <button
                type="button"
                className="more-popover-close"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {user && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  margin: '4px 4px 10px',
                  borderRadius: 14,
                  background: 'var(--brand-soft)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onClick={() => navTo('/settings')}
                title="Manage Profile & Settings"
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover))',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0,
                  }}
                >
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name || user.email?.split('@')[0] || 'FinTrack User'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email || 'Active Account'}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: '#15803D',
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  PRO
                </span>
              </div>
            )}

            <div className="more-popover-list">
              {MORE_NAV.map(({ path, Icon, label, sub }) => (
                <button key={path} className={isActive(path) ? 'active' : ''} onClick={() => navTo(path)}>
                  <Icon size={18} />
                  <span>
                    <strong>{label}</strong>
                    <small>{sub}</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Docked 5-Slot Bottom Navigation Bar (No Overlap, No Floating FAB) */}
      <nav className="mobile-docked-nav" aria-label="Mobile Navigation">
        {/* Slot 1: Home */}
        <button
          type="button"
          className={`docked-nav-slot ${isActive('/home') ? 'active' : ''}`}
          onClick={() => navTo('/home')}
          aria-label="Home"
        >
          <Home size={20} strokeWidth={isActive('/home') ? 2.5 : 2} />
          <span>Home</span>
        </button>

        {/* Slot 2: Txns */}
        <button
          type="button"
          className={`docked-nav-slot ${isActive('/transactions') ? 'active' : ''}`}
          onClick={() => navTo('/transactions')}
          aria-label="Transactions"
        >
          <ReceiptText size={20} strokeWidth={isActive('/transactions') ? 2.5 : 2} />
          <span>Txns</span>
        </button>

        {/* Slot 3: Center Docked '+' Button */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button
            type="button"
            className="docked-center-action-btn"
            onClick={() => {
              triggerHaptic('selection');
              navTo('/transactions?action=new');
            }}
            aria-label="Quick Add Transaction"
            title="Add Transaction"
          >
            <Plus size={26} strokeWidth={3} />
          </button>
        </div>

        {/* Slot 4: Budgets */}
        <button
          type="button"
          className={`docked-nav-slot ${isActive('/budgets') ? 'active' : ''}`}
          onClick={() => navTo('/budgets')}
          aria-label="Budgets"
        >
          <ChartPie size={20} strokeWidth={isActive('/budgets') ? 2.5 : 2} />
          <span>Budgets</span>
        </button>

        {/* Slot 5: More */}
        <button
          type="button"
          className={`docked-nav-slot ${moreOpen || moreActive ? 'active' : ''}`}
          onClick={() => setMoreOpen(prev => !prev)}
          aria-expanded={moreOpen}
          aria-label="More Modules"
        >
          <MoreHorizontal size={20} strokeWidth={moreOpen || moreActive ? 2.5 : 2} />
          <span>More</span>
        </button>
      </nav>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onToggleTheme={toggleTheme}
        onRefreshToken={refreshToken}
      />
      <AIChatbot />
      <SecurityLockModal />
    </div>
  );
}
