import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  ChartPie,
  ChevronRight,
  Flag,
  Home,
  Landmark,
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

  return (
    <div className="phone-shell">
      <div className="status-bar">
        <span className="status-bar-time">{time}</span>
        <div className="status-bar-icons">
          {tokenStatus !== 'valid' && (
            <span style={{ color: tokenStatus === 'critical' ? '#c84d4d' : '#c58a21', fontSize: 11, fontWeight: 850 }}>
              {fmtCountdown(secsLeft)}
            </span>
          )}
          <Bell size={16} />
          {user && <div className="user-dot">{(user.name || user.email || 'U')[0].toUpperCase()}</div>}
        </div>
      </div>

      <div className="app-content" onClick={() => setMoreOpen(false)}>
        <Outlet />
      </div>

      {moreOpen && (
        <div className="more-popover" onClick={event => event.stopPropagation()}>
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

      <nav className="bottom-nav" onClick={event => event.stopPropagation()}>
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
  );
}
