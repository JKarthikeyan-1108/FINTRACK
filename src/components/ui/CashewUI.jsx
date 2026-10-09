import { X } from 'lucide-react';

export function Page({ children, className = '' }) {
  return <main className={`app-page ${className}`}>{children}</main>;
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div className="section-title">
      <span>{children}</span>
      {action}
    </div>
  );
}

export function Card({ children, className = '', tone = 'plain', ...props }) {
  return (
    <section className={`ui-card ui-card-${tone} ${className}`} {...props}>
      {children}
    </section>
  );
}

export function MetricCard({ label, value, helper, tone = 'mint', icon }) {
  return (
    <Card className="metric-card" tone={tone}>
      <div className="metric-card-top">
        {icon && <span className="metric-icon">{icon}</span>}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </Card>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`ui-button ui-button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ icon, label, variant = 'soft', className = '', ...props }) {
  return (
    <button className={`icon-button icon-button-${variant} ${className}`} aria-label={label} title={label} {...props}>
      {icon}
    </button>
  );
}

export function FAB({ icon, label, ...props }) {
  return (
    <button className="fab" aria-label={label} title={label} {...props}>
      {icon}
    </button>
  );
}

export function ProgressBar({ value = 0, tone = 'mint', markerLabel }) {
  const bounded = Math.max(0, Math.min(Number(value || 0), 100));
  return (
    <div className="progress-wrap">
      {markerLabel && (
        <span className="progress-marker" style={{ left: `${bounded}%` }}>
          {markerLabel}
        </span>
      )}
      <div className={`progress-track progress-${tone}`}>
        <span style={{ width: `${bounded}%` }} />
      </div>
    </div>
  );
}

export function RingMeter({ value = 0, tone = 'mint', size = 58 }) {
  const bounded = Math.max(0, Math.min(Number(value || 0), 100));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (bounded / 100);
  return (
    <div className={`ring-meter ring-${tone}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} />
        <circle cx={size / 2} cy={size / 2} r={radius} strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <strong>{bounded.toFixed(0)}%</strong>
    </div>
  );
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="segmented-control">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export function TextInput({ label, className = '', ...props }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function SelectInput({ label, children, className = '', ...props }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

export function VisualCategorySelect({ categories, value, onChange, label = "Category" }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="visual-selector-grid">
        {categories.map(cat => (
          <button 
            key={cat.id} 
            type="button" 
            className={`visual-selector-btn ${value === String(cat.id) ? 'active' : ''}`}
            onClick={() => onChange(String(cat.id))}
          >
            <span className="visual-icon">{cat.icon || '📦'}</span>
            <span className="visual-label">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function VisualAccountSelect({ accounts, value, onChange, label = "Account" }) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="visual-selector-grid">
        {accounts.map(acc => (
          <button 
            key={acc.id} 
            type="button" 
            className={`visual-selector-btn ${value === String(acc.id) ? 'active' : ''}`}
            onClick={() => onChange(String(acc.id))}
          >
            <span className="visual-icon" style={{ color: acc.color || '#4a9eff' }}>💳</span>
            <span className="visual-label">{acc.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BottomSheet({ title, onClose, children }) {
  return (
    <div className="sheet-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>{title}</h2>
          <IconButton icon={<X size={18} />} label="Close" onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Chip({ children, tone = 'neutral' }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}
