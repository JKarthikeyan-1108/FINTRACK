import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  ChartPie,
  CreditCard,
  Flag,
  Landmark,
  Lock,
  Repeat2,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';

const FEATURES = [
  { Icon: Wallet, title: 'Smart Dashboard', desc: 'Real-time overview of your total balance, income, expenses, and savings rate all in one beautiful view.', color: '#3b82f6' },
  { Icon: BarChart3, title: 'Deep Analytics', desc: '12-month trends, cashflow charts, category breakdowns, and savings rate tracking with CSV exports.', color: '#8b5cf6' },
  { Icon: Bot, title: 'AI Assistant', desc: 'Chat with your finances. Get personalized insights, spending pattern analysis, and smart recommendations.', color: '#ec4899' },
  { Icon: ChartPie, title: 'Budget Tracking', desc: 'Set monthly budgets by category with visual progress bars. Get alerts before you overspend.', color: '#f59e0b' },
  { Icon: Flag, title: 'Financial Goals', desc: 'Track savings goals with progress visualization. Whether it\'s a vacation or a new laptop, stay on track.', color: '#10b981' },
  { Icon: TrendingUp, title: 'Investment Portfolio', desc: 'Track stocks, mutual funds, gold, PPF, and more. Get smart allocation suggestions based on your profile.', color: '#06b6d4' },
  { Icon: Landmark, title: 'Loan & EMI Tracker', desc: 'Monitor home loans, car loans, and personal debt. Built-in EMI calculator with amortization schedules.', color: '#ef4444' },
  { Icon: Repeat2, title: 'Subscription Manager', desc: 'Never forget a recurring bill. Track Netflix, Spotify, gym memberships, and all recurring payments.', color: '#14b8a6' },
  { Icon: CreditCard, title: 'Multi-Account', desc: 'Manage savings, current, credit cards, wallets, and investment accounts all in one place.', color: '#6366f1' },
];

const STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '₹50Cr+', label: 'Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'Rating' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Freelancer', text: 'FINTRACK completely changed how I manage my freelance income. The AI insights are incredibly helpful!', avatar: 'PS' },
  { name: 'Rahul Verma', role: 'Software Engineer', text: 'Best finance app I\'ve used. The investment tracker and budget alerts keep me disciplined every month.', avatar: 'RV' },
  { name: 'Anita Desai', role: 'Small Business Owner', text: 'The multi-account feature and CSV exports save me hours of bookkeeping every week. Highly recommend!', avatar: 'AD' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* ── Navbar ─────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="landing-logo-icon">
              <Wallet size={22} />
            </div>
            <span>FINTRACK</span>
          </div>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="landing-nav-actions">
            <button className="landing-btn-ghost" onClick={() => navigate('/login')}>Log In</button>
            <button className="landing-btn-primary" onClick={() => navigate('/login')}>
              Get Started Free <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Sparkles size={14} /> Powered by AI &bull; 100% Free
          </div>
          <h1>
            Your money,
            <br />
            <span className="landing-hero-gradient">beautifully organized.</span>
          </h1>
          <p className="landing-hero-sub">
            FINTRACK is the premium personal finance manager that brings together budgets, goals,
            investments, loans, subscriptions, and AI-powered insights — all in one stunning dashboard.
          </p>
          <div className="landing-hero-cta">
            <button className="landing-btn-primary landing-btn-lg" onClick={() => navigate('/login')}>
              Start Free Today <ArrowRight size={18} />
            </button>
            <button className="landing-btn-outline landing-btn-lg" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              See Features
            </button>
          </div>
          <div className="landing-stats">
            {STATS.map(s => (
              <div key={s.label} className="landing-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating dashboard mockup */}
        <div className="landing-hero-visual">
          <div className="landing-mockup">
            <div className="landing-mockup-header">
              <div className="landing-mockup-dots">
                <span /><span /><span />
              </div>
              <span className="landing-mockup-url">fintrack.app/home</span>
            </div>
            <div className="landing-mockup-body">
              <div className="landing-mockup-sidebar">
                <div className="lm-sidebar-item active"><Wallet size={16} /> Dashboard</div>
                <div className="lm-sidebar-item"><CreditCard size={16} /> Transactions</div>
                <div className="lm-sidebar-item"><ChartPie size={16} /> Budgets</div>
                <div className="lm-sidebar-item"><TrendingUp size={16} /> Investments</div>
                <div className="lm-sidebar-item"><BarChart3 size={16} /> Analytics</div>
              </div>
              <div className="landing-mockup-main">
                <div className="lm-metrics">
                  <div className="lm-metric blue"><small>Balance</small><strong>₹2,45,800</strong></div>
                  <div className="lm-metric green"><small>Income</small><strong>₹85,000</strong></div>
                  <div className="lm-metric red"><small>Expenses</small><strong>₹42,300</strong></div>
                  <div className="lm-metric purple"><small>Savings</small><strong>₹42,700</strong></div>
                </div>
                <div className="lm-chart">
                  <svg viewBox="0 0 300 80" fill="none">
                    <path d="M0 60 Q30 50, 60 45 T120 35 T180 25 T240 20 T300 10" stroke="#3b82f6" strokeWidth="3" fill="none" />
                    <path d="M0 60 Q30 50, 60 45 T120 35 T180 25 T240 20 T300 10 V80 H0 Z" fill="url(#chartGrad)" opacity="0.15" />
                    <defs><linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────── */}
      <section id="features" className="landing-features">
        <div className="landing-section-header">
          <div className="landing-hero-badge" style={{ margin: '0 auto 16px' }}>
            <Zap size={14} /> Everything You Need
          </div>
          <h2>Powerful features, <span className="landing-hero-gradient">zero complexity</span></h2>
          <p>From daily expense tracking to long-term investment planning — FINTRACK handles it all.</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon" style={{ background: `${f.color}15`, color: f.color }}>
                <f.Icon size={24} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Security Banner ────────────────────────── */}
      <section className="landing-security">
        <div className="landing-security-inner">
          <div className="landing-security-icons">
            <div className="landing-security-icon"><Shield size={32} /></div>
            <div className="landing-security-icon"><Lock size={32} /></div>
            <div className="landing-security-icon"><Smartphone size={32} /></div>
          </div>
          <h2>Bank-grade security, by default.</h2>
          <p>JWT HS256 authentication, bcrypt password hashing, input validation, and rate limiting protect every request. Your data never leaves your control.</p>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────── */}
      <section id="testimonials" className="landing-testimonials">
        <div className="landing-section-header">
          <h2>Loved by <span className="landing-hero-gradient">thousands</span></h2>
          <p>See what our users have to say about FINTRACK.</p>
        </div>
        <div className="landing-testimonials-grid">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="landing-testimonial-card">
              <div className="landing-testimonial-stars">★★★★★</div>
              <p>"{t.text}"</p>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar">{t.avatar}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────── */}
      <section id="pricing" className="landing-pricing">
        <div className="landing-section-header">
          <h2>Simple, transparent <span className="landing-hero-gradient">pricing</span></h2>
          <p>Start for free. Upgrade when you're ready.</p>
        </div>
        <div className="landing-pricing-grid">
          <div className="landing-pricing-card">
            <h3>Free</h3>
            <div className="landing-price"><span>₹0</span>/month</div>
            <ul>
              <li>✓ Unlimited transactions</li>
              <li>✓ 5 Budget categories</li>
              <li>✓ 3 Savings goals</li>
              <li>✓ Basic analytics</li>
              <li>✓ AI Assistant (5/day)</li>
              <li>✓ CSV Export</li>
            </ul>
            <button className="landing-btn-outline" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Get Started
            </button>
          </div>
          <div className="landing-pricing-card featured">
            <div className="landing-pricing-badge">Most Popular</div>
            <h3>Pro</h3>
            <div className="landing-price"><span>₹199</span>/month</div>
            <ul>
              <li>✓ Everything in Free</li>
              <li>✓ Unlimited budgets & goals</li>
              <li>✓ Investment portfolio</li>
              <li>✓ Loan & EMI tracker</li>
              <li>✓ Unlimited AI queries</li>
              <li>✓ Receipt scanner (OCR)</li>
              <li>✓ Priority support</li>
            </ul>
            <button className="landing-btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Start Pro Trial <ArrowRight size={16} />
            </button>
          </div>
          <div className="landing-pricing-card">
            <h3>Business</h3>
            <div className="landing-price"><span>₹499</span>/month</div>
            <ul>
              <li>✓ Everything in Pro</li>
              <li>✓ Team collaboration</li>
              <li>✓ Advanced reports</li>
              <li>✓ API access</li>
              <li>✓ Custom categories</li>
              <li>✓ Dedicated support</li>
            </ul>
            <button className="landing-btn-outline" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────── */}
      <section className="landing-cta">
        <div className="landing-cta-glow" />
        <h2>Ready to take control of your finances?</h2>
        <p>Join thousands of users who trust FINTRACK to manage their money smarter.</p>
        <button className="landing-btn-primary landing-btn-lg" onClick={() => navigate('/login')}>
          Create Free Account <ArrowRight size={18} />
        </button>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-icon"><Wallet size={18} /></div>
              <span>FINTRACK</span>
            </div>
            <p>The premium personal finance manager for the modern Indian household.</p>
          </div>
          <div className="landing-footer-links">
            <div>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div>
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
            </div>
            <div>
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>© 2026 FINTRACK. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
