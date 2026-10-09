import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AIChatbot from '../AIChatbot';
import {
  Bell,
  BarChart3,
  ChartPie,
  ChevronRight,
  Flag,
  Home,
  Landmark,
  Moon,
  Sun,
  MoreHorizontal,
  ReceiptText,
  Repeat2,
  Settings,
  ShieldCheck,
  Tag,
  TrendingUp,
} from 'lucide-react';

const PRIMARY_NAV = [
  { path: '/home', label: 'Home', Icon: Home },
  { path: '/transactions', label: 'Txns', Icon: ReceiptText },
  { path: '/budgets', label: 'Budgets', Icon: ChartPie },
  { path: '/subscriptions', label: 'Subs', Icon: Repeat2 },
];

const MORE_NAV = [
  { path: '/analytics', Icon: BarChart3, label: 'Analytics', sub: 'Deep insights & reports' },
  { path: '/investments', Icon: TrendingUp, label: 'Investments', sub: 'Portfolio and plans' },
  { path: '/goals', Icon: Flag, label: 'Goals', sub: 'Savings targets' },
  { path: '/loans', Icon: Landmark, label: 'Loans & EMI', sub: 'Debt tracker' },
  { path: '/categories', Icon: Tag, label: 'Categories', sub: 'Manage spending tags' },
  { path: '/settings', Icon: Settings, label: 'Settings', sub: 'Account preferences' },
  { path: '/jwt', Icon: ShieldCheck, label: 'JWT Inspector', sub: 'Developer security view' },
];

export default function AppShell() {
  const { tokenStatus, secsLeft, fmtCountdown, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [time, setTime] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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

  function navTo(path) {
    setMoreOpen(false);
    nav(path);
  }

  const DesktopSidebar = () => (
    <div className="sidebar">
      <div className="sidebar-header">
        <TrendingUp size={28} /> FINTRACK
      </div>
      <div className="sidebar-nav">
        {[...PRIMARY_NAV, ...MORE_NAV].map(({ path, label, Icon }) => (
          <button key={path} className={`sidebar-item ${isActive(path) ? 'active' : ''}`} onClick={() => navTo(path)}>
            <Icon size={20} />
            <span style={{ fontSize: '0.95rem' }}>{label}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: '24px 16px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 8 }}>
            <Award size={18} /> Upgrade to Pro
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 12 }}>Unlock advanced insights and reports.</div>
          <button style={{ width: '100%', padding: '8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Upgrade</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell-container">
      {/* Desktop Sidebar (hidden on mobile via CSS) */}
      <div className="desktop-sidebar">
        <div className="sidebar-header">
          <TrendingUp size={28} /> FINTRACK
        </div>
        <div className="sidebar-nav">
          {[...PRIMARY_NAV, ...MORE_NAV].map(({ path, label, Icon }) => (
            <button key={path} className={`sidebar-item ${isActive(path) ? 'active' : ''}`} onClick={() => navTo(path)}>
              <Icon size={20} />
              <span style={{ fontSize: '0.95rem' }}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '24px 16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 8 }}>
              <Award size={18} /> Upgrade to Pro
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 12 }}>Unlock advanced insights and reports.</div>
            <button style={{ width: '100%', padding: '8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Upgrade</button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="main-wrapper">
        {/* Responsive Header (Desktop TopBar / Mobile StatusBar) */}
        <div className="responsive-header">
          <div className="mobile-only status-bar-time">{time}</div>
          <div className="desktop-only search-bar">
            <input type="text" placeholder="Search transactions, categories..." />
            <Search size={18} className="search-icon" />
          </div>

          <div className="header-actions">
            {tokenStatus && tokenStatus !== 'valid' && typeof fmtCountdown === 'function' && (
              <span style={{ color: tokenStatus === 'critical' ? '#c84d4d' : '#c58a21', fontSize: 11, fontWeight: 850 }}>
                {fmtCountdown(secsLeft)}
              </span>
            )}
            <button onClick={toggleTheme} className="icon-btn">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Bell size={20} className="icon-btn-svg" />
            {user && (
              <div className="user-profile">
                <div className="user-dot">{(user.name || user.email || 'U')[0].toUpperCase()}</div>
                <span className="desktop-only user-name">{user.name?.split(' ')[0] || 'User'}</span>
              </div>
            )}
          </div>
        </div>

        {/* The single Outlet */}
        <div className="app-content-scroll" onClick={() => setMoreOpen(false)}>
          <Outlet />
        </div>

        {/* Mobile Popover & Bottom Nav */}
        {moreOpen && (
          <div className="mobile-only more-popover" onClick={event => event.stopPropagation()}>
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
        )}

        <nav className="mobile-only bottom-nav" onClick={event => event.stopPropagation()}>
          {PRIMARY_NAV.map(({ path, label, Icon }) => (
            <button key={path} className={`nav-item ${isActive(path) ? 'active' : ''}`} onClick={() => navTo(path)}>
              <Icon />
              <span>{label}</span>
            </button>
          ))}
          <button className={`nav-item ${moreOpen || moreActive ? 'active' : ''}`} onClick={() => setMoreOpen(value => !value)}>
            <MoreHorizontal />
            <span>More</span>
          </button>
        </nav>
      </div>

      <AIChatbot />
    </div>
  );
}
