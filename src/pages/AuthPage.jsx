import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  BarChart3, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User,
  PieChart, 
  ShieldCheck, 
  Target, 
  TrendingUp,
  Fingerprint,
  Sparkles,
  Zap,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setupRecaptcha } from '../firebase/authService';
import FinTrackLogo from '../components/ui/FinTrackLogo';
import './AuthPage.css';

const GoogleSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M5.27 9.77A7 7 0 0112 5c1.76 0 3.35.66 4.57 1.73l3.38-3.38A11.8 11.8 0 0012 .5C7.31.5 3.26 3.07 1.27 6.93l4 2.84z" />
    <path fill="#34A853" d="M16.04 18.01A7 7 0 015.27 14.23l-4 2.84C3.26 20.93 7.31 23.5 12 23.5c3.19 0 6.22-1.14 8.49-3.29l-4.45-2.2z" />
    <path fill="#4A90D9" d="M20.49 20.21A11.8 11.8 0 0023.5 12c0-.81-.09-1.6-.23-2.37H12v4.76h6.46a5.5 5.5 0 01-2.38 3.62l4.41 2.2z" />
    <path fill="#FBBC05" d="M5.27 14.23A6.97 6.97 0 015 12c0-.77.13-1.52.27-2.23L1.27 6.93A11.75 11.75 0 00.5 12c0 1.86.44 3.61 1.2 5.18l3.57-2.95z" />
  </svg>
);

export default function AuthPage() {
  const { 
    googleLogin, 
    emailLogin, 
    emailRegister, 
    forgotPassword, 
    isAuthenticated, 
    phoneLogin, 
    verifyOtp: verifyPhoneOtp, 
    demoLogin,
    user,
  } = useAuth();
  const navigate = useNavigate();
  
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot' | 'verify' | 'phone'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Read any stored cached session to offer 1-click continuation
  const storedSession = (() => {
    try {
      const raw = localStorage.getItem('fintrack_auth_session');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const handleSelectDemo = (profileKey) => {
    const selectedUser = demoLogin(profileKey);
    toast.success(`Welcome to FinTrack, ${selectedUser.name}!`);
    navigate('/home', { replace: true });
  };

  async function handleGoogle() {
    setLoading(true);
    try {
      await googleLogin();
      toast.success('Signed in with Google successfully');
      navigate('/home', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (authView === 'login') {
        if (!email.trim() || !pass) {
          throw new Error('Please enter both email and password');
        }
        await emailLogin(email.trim(), pass);
        toast.success('Welcome back to FinTrack!');
        navigate('/home', { replace: true });
      } 
      else if (authView === 'register') {
        if (!name.trim() || !email.trim() || !pass) {
          throw new Error('All fields are required');
        }
        if (pass.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        if (pass !== confirmPass) {
          throw new Error('Passwords do not match');
        }
        await emailRegister(name.trim(), email.trim(), pass);
        toast.success('Account created successfully! Welcome to FinTrack.');
        navigate('/home', { replace: true });
      }
      else if (authView === 'forgot') {
        if (!email.trim()) {
          throw new Error('Please enter your account email');
        }
        await forgotPassword(email.trim());
        toast.success('Password reset link sent! Check your email inbox.');
        setAuthView('login');
      }
      else if (authView === 'verify') {
        const code = otp.join('');
        if (code.length < 6) {
          throw new Error('Please enter the complete 6-digit code');
        }
        await verifyPhoneOtp(code);
        toast.success('Phone verified successfully!');
        navigate('/home', { replace: true });
      }
      else if (authView === 'phone') {
        if (!phone.trim()) {
          throw new Error('Please enter your mobile phone number (e.g. +91 9876543210)');
        }
        setupRecaptcha('recaptcha-container');
        await phoneLogin(phone.trim());
        setAuthView('verify');
        toast.success(`Verification code sent to ${phone}`);
      }
    } catch (error) {
      const msg = error.message || 'Authentication failed. Please verify credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const calculateStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[^a-zA-Z\d]/.test(password)) strength += 25;
    return strength;
  };

  const passStrength = calculateStrength(pass);

  return (
    <div className="auth-split-container">
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL (Web / Desktop Showcase — 100% Contained, Zero Overlaps)
         ───────────────────────────────────────────────────────────── */}
      <div className="auth-left-panel">
        <div className="auth-ambient-orb auth-ambient-orb-1" />
        <div className="auth-ambient-orb auth-ambient-orb-2" />

        <div className="auth-left-content">
          {/* Brand Emblem Header */}
          <div className="auth-brand-badge" onClick={() => navigate('/')}>
            <FinTrackLogo size={36} />
            <div>
              <div className="auth-brand-name">FinTrack</div>
            </div>
          </div>

          {/* Hero Typography */}
          <h1 className="auth-hero-title">
            Wealth Intelligence, <br />
            <span className="highlight">Precision Control.</span>
          </h1>
          <p className="auth-hero-desc">
            Track multi-currency cash flows, set smart 50/30/20 budgets, simulate debt payoff velocity,
            and monitor your entire net worth in one unified sovereign dashboard.
          </p>

          {/* In-Flow Telemetry Preview Card (Zero Negative Margins or Absolute Bleed) */}
          <div className="auth-telemetry-card">
            <div className="auth-telemetry-header">
              <span className="auth-telemetry-tag">Live Portfolio Snapshot</span>
              <span className="auth-telemetry-badge">
                <TrendingUp size={12} /> +14.2% YoY
              </span>
            </div>

            <div className="auth-telemetry-amount">₹2,45,800.00</div>

            {/* Distribution Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>
                <span>Equity (52%)</span>
                <span>Debt &amp; G-Sec (28%)</span>
                <span>Liquid (20%)</span>
              </div>
              <div className="auth-telemetry-bar">
                <div className="auth-bar-seg-1" title="Equity Index & Mutual Funds (52%)" />
                <div className="auth-bar-seg-2" title="Fixed Income & G-Sec (28%)" />
                <div className="auth-bar-seg-3" title="Emergency Liquid Reserves (20%)" />
              </div>
            </div>

            <div className="auth-telemetry-metrics">
              <div className="auth-telemetry-metric-item">
                <span className="auth-telemetry-metric-label">Monthly Savings</span>
                <span className="auth-telemetry-metric-value" style={{ color: '#15803D' }}>₹48,000</span>
              </div>
              <div className="auth-telemetry-metric-item">
                <span className="auth-telemetry-metric-label">SIP / Recurring</span>
                <span className="auth-telemetry-metric-value">₹15,000/mo</span>
              </div>
              <div className="auth-telemetry-metric-item">
                <span className="auth-telemetry-metric-label">Emergency Cover</span>
                <span className="auth-telemetry-metric-value">6.2 Months</span>
              </div>
            </div>
          </div>

          {/* Key Feature Highlights */}
          <div className="auth-feature-grid">
            <div className="auth-feature-pill">
              <BarChart3 size={16} />
              <span>Deep Financial Analytics</span>
            </div>
            <div className="auth-feature-pill">
              <PieChart size={16} />
              <span>Smart Budget Guards</span>
            </div>
            <div className="auth-feature-pill">
              <Target size={16} />
              <span>Goal Milestones</span>
            </div>
            <div className="auth-feature-pill">
              <Sparkles size={16} />
              <span>FinBot AI Copilot</span>
            </div>
          </div>

          {/* Bottom Security Trust Pledge */}
          <div className="auth-security-pledge">
            <ShieldCheck size={20} />
            <span>256-Bit Cryptographic Vault &bull; Zero Data Selling &bull; Sovereign Privacy</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL (Web & Mobile Auth Form)
         ───────────────────────────────────────────────────────────── */}
      <div className="auth-right-panel">
        <div className="auth-form-card">
          
          {/* Mobile Brand Header */}
          <div className="auth-mobile-brand">
            <FinTrackLogo size={32} />
            <span className="brand-title">FinTrack</span>
          </div>

          {/* Header Copy */}
          <div className="auth-header-text">
            <h2>
              {authView === 'login' && 'Welcome Back'}
              {authView === 'register' && 'Create Your Account'}
              {authView === 'forgot' && 'Reset Password'}
              {authView === 'phone' && 'Phone Sign In'}
              {authView === 'verify' && 'Verify Phone Number'}
            </h2>
            <p>
              {authView === 'login' && 'Sign in to access your wealth dashboard'}
              {authView === 'register' && 'Begin your autonomous personal finance journey'}
              {authView === 'forgot' && 'Enter your email to receive a secure Firebase reset link'}
              {authView === 'phone' && 'Enter your mobile number to receive an SMS code'}
              {authView === 'verify' && 'Enter the 6-digit verification code sent to your phone'}
            </p>
          </div>

          {/* Segmented Mode Switcher (Sign In / Register) */}
          {(authView === 'login' || authView === 'register') && (
            <div className="auth-mode-segmented">
              <button
                type="button"
                className={`auth-mode-tab ${authView === 'login' ? 'active' : ''}`}
                onClick={() => setAuthView('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-mode-tab ${authView === 'register' ? 'active' : ''}`}
                onClick={() => setAuthView('register')}
              >
                Create Account
              </button>
            </div>
          )}

          {/* If there is a cached user session in localStorage, offer 1-click continuation */}
          {storedSession?.user && authView === 'login' && (
            <div className="auth-active-session-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="auth-demo-avatar">
                  {(storedSession.user.name || storedSession.user.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                    {storedSession.user.name || storedSession.user.email}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Previous session saved on this device
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="auth-link-btn"
                style={{ fontSize: '0.82rem', fontWeight: 800 }}
                onClick={() => navigate('/home', { replace: true })}
              >
                Continue &rarr;
              </button>
            </div>
          )}

          {/* Main Auth Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* FULL NAME (Registration only) */}
            {authView === 'register' && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full Name</label>
                <div className="auth-input-box">
                  <User className="field-icon" size={18} />
                  <input
                    id="auth-name"
                    type="text"
                    className="auth-input-element"
                    placeholder="e.g. Karthik Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            {/* EMAIL (Sign In, Register, Forgot) */}
            {(authView === 'login' || authView === 'register' || authView === 'forgot') && (
              <div className="auth-field">
                <label htmlFor="auth-email">Email Address</label>
                <div className="auth-input-box">
                  <Mail className="field-icon" size={18} />
                  <input
                    id="auth-email"
                    type="email"
                    className="auth-input-element"
                    placeholder="you@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>
            )}

            {/* PHONE NUMBER */}
            {authView === 'phone' && (
              <div className="auth-field">
                <label htmlFor="auth-phone">Mobile Phone Number</label>
                <div className="auth-input-box">
                  <Smartphone className="field-icon" size={18} />
                  <input
                    id="auth-phone"
                    type="tel"
                    className="auth-input-element"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoComplete="tel"
                  />
                </div>
                <div id="recaptcha-container" style={{ marginTop: '0.5rem' }}></div>
              </div>
            )}

            {/* OTP CODE BOXES */}
            {authView === 'verify' && (
              <div style={{ margin: '1rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      style={{
                        width: '46px',
                        height: '52px',
                        textAlign: 'center',
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        borderRadius: '10px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                      }}
                      required
                    />
                  ))}
                </div>
              </div>
            )}

            {/* PASSWORD */}
            {(authView === 'login' || authView === 'register') && (
              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>
                <div className="auth-input-box">
                  <Lock className="field-icon" size={18} />
                  <input
                    id="auth-password"
                    type={showPass ? 'text' : 'password'}
                    className="auth-input-element"
                    placeholder={authView === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    required
                    autoComplete={authView === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Meter on Registration */}
                {authView === 'register' && pass.length > 0 && (
                  <div className="auth-strength-wrap">
                    <div className="auth-strength-track">
                      <div
                        className="auth-strength-fill"
                        style={{
                          width: `${passStrength}%`,
                          backgroundColor:
                            passStrength < 50 ? '#B42318' : passStrength < 75 ? '#B45309' : '#15803D',
                        }}
                      />
                    </div>
                    <div className="auth-strength-note">
                      <ShieldCheck size={12} />
                      <span>
                        {passStrength < 50
                          ? 'Weak: include upper & lowercase, digits, and symbols'
                          : passStrength < 75
                          ? 'Good password strength'
                          : 'Strong military-grade password'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONFIRM PASSWORD (Registration only) */}
            {authView === 'register' && (
              <div className="auth-field">
                <label htmlFor="auth-confirm-pass">Confirm Password</label>
                <div className="auth-input-box">
                  <Lock className="field-icon" size={18} />
                  <input
                    id="auth-confirm-pass"
                    type={showPass ? 'text' : 'password'}
                    className="auth-input-element"
                    placeholder="Re-enter password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* Options Row (Remember me, Forgot Password) */}
            {authView === 'login' && (
              <div className="auth-options-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => setAuthView('forgot')}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="auth-submit-action"
              disabled={loading}
            >
              {loading ? (
                'Authenticating with Firebase...'
              ) : authView === 'login' ? (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              ) : authView === 'register' ? (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              ) : authView === 'forgot' ? (
                'Send Password Reset Link'
              ) : authView === 'phone' ? (
                'Send Verification SMS'
              ) : (
                'Verify & Proceed'
              )}
            </button>
          </form>

          {/* BACK TO LOGIN (for secondary views) */}
          {(authView === 'forgot' || authView === 'phone' || authView === 'verify') && (
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => setAuthView('login')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>
          )}

          {/* SOCIAL & ALTERNATIVE AUTH (Login & Register views) */}
          {(authView === 'login' || authView === 'register') && (
            <>
              <div className="auth-separator">
                <span>Or continue with</span>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                className="auth-secondary-btn"
                onClick={handleGoogle}
                disabled={loading}
              >
                <GoogleSVG />
                <span>Continue with Google</span>
              </button>

              {/* Phone Auth Trigger */}
              <button
                type="button"
                className="auth-secondary-btn"
                onClick={() => setAuthView('phone')}
                disabled={loading}
              >
                <Smartphone size={18} color="#A83F55" />
                <span>Continue with Phone SMS</span>
              </button>

              {/* ─────────────────────────────────────────────────────────────
                  QUICK DEMO PROFILES SECTION (Requested Profile Switcher)
                 ───────────────────────────────────────────────────────────── */}
              <div className="auth-demo-section">
                <div className="auth-demo-header">
                  <span className="auth-demo-title">
                    <Sparkles size={14} /> Quick Demo Profiles
                  </span>
                  <span className="auth-demo-subtitle">1-Click Instant Preview</span>
                </div>

                <div className="auth-demo-profiles">
                  {/* Profile 1: Karthik (Demo Pro) */}
                  <div
                    className="auth-demo-pill"
                    onClick={() => handleSelectDemo('karthik')}
                    title="Sign in as Karthik (Full Pro Portfolio)"
                  >
                    <div className="auth-demo-avatar">K</div>
                    <div className="auth-demo-info">
                      <span className="auth-demo-name">Karthik (Demo Pro)</span>
                      <span className="auth-demo-bal">₹2,45,800 &bull; Pro Tier</span>
                    </div>
                  </div>

                  {/* Profile 2: Arjun Sharma */}
                  <div
                    className="auth-demo-pill"
                    onClick={() => handleSelectDemo('arjun')}
                    title="Sign in as Arjun Sharma (Active Investor)"
                  >
                    <div className="auth-demo-avatar" style={{ background: 'linear-gradient(135deg, #A83F55, #E9A3B0)' }}>
                      A
                    </div>
                    <div className="auth-demo-info">
                      <span className="auth-demo-name">Arjun Sharma</span>
                      <span className="auth-demo-bal">₹1,80,000 &bull; SIPs</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Trust Security Footer */}
          <div className="auth-footer-trust">
            <div className="auth-trust-item">
              <Lock size={16} />
              <span>TLS / AES-256</span>
            </div>
            <div className="auth-trust-item">
              <ShieldCheck size={16} />
              <span>Zero-Leak Privacy</span>
            </div>
            <div className="auth-trust-item">
              <Fingerprint size={16} />
              <span>Biometric Vault</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
