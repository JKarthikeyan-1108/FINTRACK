import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSecurity } from '../../context/SecurityContext';
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
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

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
    setThemeMenuOpen(false);
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

  return (
    <div className="app-shell-container">
      {/* Desktop Sidebar */}
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
            <div className="sidebar-user-card">
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

      {/* Main Container */}
      <div className="main-wrapper">
        <NetworkStatusBanner />
        {navProgress && <div className="route-progress-bar" />}

        {/* Responsive Header */}
        <header className="responsive-header">
          <div className="mobile-only status-bar-time">{time}</div>

          <div className="desktop-only header-left">
            <div className="header-breadcrumb">
              <span>FinTrack</span>
              <span>/</span>
              <span className="header-breadcrumb-active">{currentPageTitle}</span>
            </div>
          </div>

          <div
            className="desktop-only search-bar"
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
              className="header-btn header-btn-primary desktop-only"
              onClick={() => navTo('/transactions')}
            >
              <span>+ New Transaction</span>
            </button>

            <div className="theme-toggle-dropdown-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setThemeMenuOpen(prev => !prev)}
                className="icon-btn"
                title={`Theme: ${themePref === 'system' ? `System (${effectiveTheme})` : themePref === 'dark' ? 'Dark' : 'Light'}`}
                aria-label="Select theme mode (Light, Dark, System)"
                aria-haspopup="true"
                aria-expanded={themeMenuOpen}
              >
                {themePref === 'system' ? (
                  <Laptop size={18} />
                ) : effectiveTheme === 'dark' ? (
                  <Moon size={18} />
                ) : (
                  <Sun size={18} />
                )}
              </button>

              {themeMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 110 }}
                    onClick={() => setThemeMenuOpen(false)}
                  />
                  <div
                    className="theme-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 12,
                      boxShadow: 'var(--shadow-card)',
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      minWidth: 150,
                      zIndex: 115,
                    }}
                    role="menu"
                  >
                    {[
                      { key: 'light', label: 'Light', Icon: Sun },
                      { key: 'dark', label: 'Dark', Icon: Moon },
                      { key: 'system', label: 'System', Icon: Laptop },
                    ].map(({ key, label, Icon }) => {
                      const isSelected = themePref === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="menuitem"
                          onClick={() => handleSelectTheme(key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: isSelected ? 'var(--brand-soft)' : 'transparent',
                            color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <Icon size={15} color={isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)'} />
                          <span style={{ flex: 1 }}>{label}</span>
                          {isSelected && <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

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
              className="icon-btn desktop-only"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} className="icon-btn-svg" />
            </button>

            {user && (
              <div
                className="user-profile desktop-only"
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

        {/* The single Outlet */}
        <div className="app-content-scroll" onClick={() => setMoreOpen(false)}>
          <div key={loc.pathname} className="view-transition-container">
            <Outlet />
          </div>
        </div>

        {/* Mobile Popover & Bottom Nav */}
        {moreOpen && (
          <>
            <div className="mobile-only more-popover-backdrop" onClick={() => setMoreOpen(false)} />
            <div className="mobile-only more-popover" onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Extended Modules">
              <div className="more-popover-header">
                <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
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
              <div className="more-popover-list">
                {MORE_NAV.map(({ path, Icon, label, sub }) => (
                  <button key={path} className={isActive(path) ? 'active' : ''} onClick={() => navTo(path)}>
                    <Icon />
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

        <nav className="mobile-only bottom-nav" onClick={event => event.stopPropagation()} aria-label="Mobile Navigation">
          {PRIMARY_NAV.map(({ path, label, Icon }) => (
            <button key={path} className={`nav-item ${isActive(path) ? 'active' : ''}`} onClick={() => navTo(path)}>
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
          <button className={`nav-item ${moreOpen || moreActive ? 'active' : ''}`} onClick={() => setMoreOpen(value => !value)} aria-expanded={moreOpen}>
            <MoreHorizontal size={20} />
            <span>More</span>
          </button>
        </nav>
      </div>

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
