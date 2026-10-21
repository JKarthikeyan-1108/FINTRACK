import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Home,
  BarChart3,
  ReceiptText,
  ChartPie,
  Repeat2,
  TrendingUp,
  Flag,
  Landmark,
  Calculator,
  Tag,
  Settings,
  ShieldCheck,
  Plus,
  Moon,
  Sun,
  RefreshCw,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';

const ITEMS = [
  { id: 'home', label: 'Dashboard Overview', category: 'Navigation', icon: Home, path: '/home' },
  { id: 'explore', label: 'Explore & Suggest (Investment & Protection Discovery)', category: 'Navigation', icon: Compass, path: '/explore' },
  { id: 'analytics', label: 'Cashflow Analytics & Trends', category: 'Navigation', icon: BarChart3, path: '/analytics' },
  { id: 'transactions', label: 'Transactions Ledger', category: 'Navigation', icon: ReceiptText, path: '/transactions' },
  { id: 'budgets', label: 'Budget Envelopes', category: 'Navigation', icon: ChartPie, path: '/budgets' },
  { id: 'subscriptions', label: 'Recurring Subscriptions', category: 'Navigation', icon: Repeat2, path: '/subscriptions' },
  { id: 'split', label: 'Split & Groups (Shared Expenses)', category: 'Navigation', icon: Users, path: '/split' },
  { id: 'investments', label: 'My Investment Portfolio & Rebalancing', category: 'Navigation', icon: TrendingUp, path: '/investments' },
  { id: 'goals', label: 'Savings Goals', category: 'Navigation', icon: Flag, path: '/goals' },
  { id: 'loans', label: 'Loans & EMI Amortization', category: 'Navigation', icon: Landmark, path: '/loans' },
  { id: 'calculators', label: 'Financial Engines & Calculators', category: 'Navigation', icon: Calculator, path: '/calculators' },
  { id: 'categories', label: 'Taxonomy & Categories', category: 'Navigation', icon: Tag, path: '/categories' },
  { id: 'settings', label: 'Settings & Accounts', category: 'Navigation', icon: Settings, path: '/settings' },
  { id: 'jwt', label: 'JWT Security Inspector', category: 'Developer', icon: ShieldCheck, path: '/jwt' },
];

export default function CommandPalette({ isOpen, onClose, onToggleTheme, onRefreshToken }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredItems = ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const actions = [
    {
      id: 'action-new-txn',
      label: 'Record New Transaction',
      category: 'Quick Action',
      icon: Plus,
      action: () => { onClose(); navigate('/transactions?action=new'); },
    },
    {
      id: 'action-new-invest',
      label: 'Record New Investment Allocation (SIP / Equity / Gold)',
      category: 'Quick Action',
      icon: TrendingUp,
      action: () => { onClose(); navigate('/transactions?action=invest'); },
    },
    {
      id: 'action-theme',
      label: 'Toggle Dark / Light Theme',
      category: 'Quick Action',
      icon: Moon,
      action: () => { onClose(); onToggleTheme?.(); },
    },
    {
      id: 'action-renew',
      label: 'Renew Authentication Token',
      category: 'Quick Action',
      icon: RefreshCw,
      action: () => { onClose(); onRefreshToken?.(); },
    },
  ].filter(action => action.label.toLowerCase().includes(query.toLowerCase()));

  const allResults = [...actions, ...filteredItems];

  useEffect(() => {
    const handleKeyDown = e => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, allResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected) {
          if (selected.action) {
            selected.action();
          } else if (selected.path) {
            onClose();
            navigate(selected.path);
          }
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allResults, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(580px, 92vw)',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'scaleIn 0.15s ease-out',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-strong)',
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command or search ledger..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.98rem',
              color: 'var(--text)',
            }}
          />
          <span className="badge-pill badge-pill-neutral" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {allResults.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No commands or pages matching "{query}"
            </div>
          ) : (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.path) {
                      onClose();
                      navigate(item.path);
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    color: isSelected ? '#10b981' : 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isSelected ? '#10b981' : 'var(--surface-strong)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        display: 'grid',
                        placeItems: 'center',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.category}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                      <span>Select</span>
                      <ArrowRight size={13} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            background: 'var(--surface-strong)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            color: 'var(--text-soft)',
          }}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>FinTrack Command Engine</span>
        </div>
      </div>
    </div>
  );
}
