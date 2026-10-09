import React, { useEffect, useState } from 'react';
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
  PieChart, 
  Shield, 
  ShieldCheck, 
  Target, 
  TrendingUp,
  WalletCards,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const GoogleSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M5.27 9.77A7 7 0 0112 5c1.76 0 3.35.66 4.57 1.73l3.38-3.38A11.8 11.8 0 0012 .5C7.31.5 3.26 3.07 1.27 6.93l4 2.84z" />
    <path fill="#34A853" d="M16.04 18.01A7 7 0 015.27 14.23l-4 2.84C3.26 20.93 7.31 23.5 12 23.5c3.19 0 6.22-1.14 8.49-3.29l-4.45-2.2z" />
    <path fill="#4A90D9" d="M20.49 20.21A11.8 11.8 0 0023.5 12c0-.81-.09-1.6-.23-2.37H12v4.76h6.46a5.5 5.5 0 01-2.38 3.62l4.41 2.2z" />
    <path fill="#FBBC05" d="M5.27 14.23A6.97 6.97 0 015 12c0-.77.13-1.52.27-2.23L1.27 6.93A11.75 11.75 0 00.5 12c0 1.86.44 3.61 1.2 5.18l3.57-2.95z" />
  </svg>
);

import { setupRecaptcha } from '../firebase/authService';

export default function AuthPage() {
  const { googleLogin, emailLogin, emailRegister, forgotPassword, resetPassword, isAuthenticated, phoneLogin, verifyOtp: verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();
  
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot' | 'verify' | 'reset' | 'success'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [verifyMode, setVerifyMode] = useState('email'); // 'email' | 'phone'
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = React.useRef([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleGoogle() {
    setLoading(true);
    try {
      await googleLogin();
      navigate('/home', { replace: true });
    } catch (error) {
      toast.error(error.message || error.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (authView === 'login') {
        if (!email || !pass) throw new Error('Enter email and password');
        await emailLogin(email, pass);
        navigate('/home', { replace: true });
      } 
      else if (authView === 'register') {
        if (!name || !email || !pass) throw new Error('All fields are required');
        if (pass.length < 8) throw new Error('Password must be 8+ characters');
        if (pass !== confirmPass) throw new Error('Passwords do not match');
        await emailRegister(name, email, pass);
        navigate('/home', { replace: true });
      }
      else if (authView === 'forgot') {
        if (!email) throw new Error('Enter your email');
        await forgotPassword(email);
        setAuthView('verify');
        toast.success('Verification code sent to ' + email);
      }
      else if (authView === 'verify') {
        const code = otp.join('');
        if (code.length < 6) throw new Error('Enter the 6-digit code');
        if (verifyMode === 'phone') {
          await verifyPhoneOtp(code);
          navigate('/home', { replace: true });
        } else {
          setAuthView('reset');
        }
      }
      else if (authView === 'reset') {
        const code = otp.join('');
        if (pass.length < 8) throw new Error('Password must be 8+ characters');
        if (pass !== confirmPass) throw new Error('Passwords do not match');
        await resetPassword(email, code, pass);
        setAuthView('success');
      }
      else if (authView === 'phone') {
        if (!phone) throw new Error('Enter your phone number (e.g. +1234567890)');
        setupRecaptcha('recaptcha-container');
        await phoneLogin(phone);
        setVerifyMode('phone');
        setAuthView('verify');
        toast.success('Verification code sent to ' + phone);
      }
    } catch (error) {
      toast.error(error.message || error.response?.data?.error || 'Operation failed');
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

  return (
    <div className="auth-split-container">
      {/* --- Left Panel --- */}
      <div className="auth-left-panel">
        <div className="mockup-leaf leaf-1" />
        <div className="mockup-leaf leaf-2" />
        
        <div className="auth-logo-brand">
          <div className="auth-logo-text">
            <TrendingUp size={28} className="logo-icon" /> FINTRACK
          </div>
          <div className="auth-logo-tagline">Track &middot; Plan &middot; Grow</div>
        </div>

        <div className="auth-hero-content">
          <h1>Take Control of Your Finances</h1>
          <p>Track expenses, set budgets, achieve goals and build a better financial future.</p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="auth-feature-icon-box green"><BarChart3 size={20} /></div>
              <div className="auth-feature-text">
                <h3>Track & Analyze</h3>
                <p>Get a complete view of your income and expenses</p>
              </div>
            </div>
            
            <div className="auth-feature-item">
              <div className="auth-feature-icon-box blue"><PieChart size={20} /></div>
              <div className="auth-feature-text">
                <h3>Set Budgets</h3>
                <p>Stay on track with smart budgeting</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon-box orange"><Target size={20} /></div>
              <div className="auth-feature-text">
                <h3>Achieve Goals</h3>
                <p>Save for what matters to you</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon-box purple"><TrendingUp size={20} /></div>
              <div className="auth-feature-text">
                <h3>Plan Investments</h3>
                <p>Explore investment options and grow your wealth</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-security-banner">
          <Lock className="lock-icon" size={32} />
          <div>
            <h4>Your Financial Data is Safe with Us</h4>
            <p>We use industry-standard encryption, secure authentication and best practices to protect your information.</p>
          </div>
        </div>

        {/* Fake UI Mockup */}
        <div className="mockup-container">
          <div className="mockup-balance-section">
            <div className="mockup-header">Total Balance</div>
            <div className="mockup-row">
              <div className="mockup-balance">₹ 1,24,500</div>
              <div className="mockup-badge"><TrendingUp size={12}/> 12%</div>
            </div>
          </div>
          
          <div className="mockup-chart" />

          <div className="mockup-items">
            <div className="mockup-item">
              <div className="mockup-item-icon" style={{background: '#10b981'}}><TrendingUp size={16}/></div>
              <div className="mockup-item-details">Income</div>
              <div className="mockup-item-value">₹ 80,000</div>
            </div>
            <div className="mockup-item">
              <div className="mockup-item-icon" style={{background: '#f43f5e'}}><TrendingUp size={16} style={{transform: 'rotate(180deg)'}}/></div>
              <div className="mockup-item-details">Expenses</div>
              <div className="mockup-item-value">₹ 32,500</div>
            </div>
            <div className="mockup-item">
              <div className="mockup-item-icon" style={{background: '#3b82f6'}}><WalletCards size={16}/></div>
              <div className="mockup-item-details">Savings</div>
              <div className="mockup-item-value">₹ 47,500</div>
            </div>
          </div>

          <div className="floating-card floating-card-1">
            <div className="mockup-header">Monthly Budget</div>
            <div className="monthly-budget-ring mt-2">
              <div className="ring-placeholder">
                <span className="ring-text">72%</span>
              </div>
              <div>
                <div style={{fontWeight: 700, color: '#0f172a'}}>₹ 18,000</div>
                <div style={{fontSize: '0.75rem', color: '#64748b'}}>of ₹ 25,000</div>
              </div>
            </div>
          </div>

          <div className="floating-card floating-card-2">
            <div className="mockup-header">Financial Goals</div>
            <div className="mt-2" style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
              <div style={{background: '#e0f2fe', color: '#0ea5e9', padding: '0.5rem', borderRadius: '8px'}}>
                <Target size={20} />
              </div>
              <div>
                <div style={{fontWeight: 600, color: '#0f172a', fontSize: '0.9rem'}}>Dream Home</div>
                <div style={{fontWeight: 700, color: '#0f172a', fontSize: '0.95rem'}}>₹ 8,50,000</div>
              </div>
            </div>
            <div style={{background: '#f1f5f9', height: '6px', borderRadius: '3px', marginTop: '1rem', position: 'relative'}}>
              <div style={{background: '#10b981', height: '100%', width: '45%', borderRadius: '3px'}} />
            </div>
            <div style={{textAlign: 'right', fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 600}}>45%</div>
          </div>
        </div>
      </div>

      {/* --- Right Panel --- */}
      <div className="auth-right-panel">
        <div className="auth-right-content">
          
          {(authView !== 'success') && (
            <div className="auth-right-header" style={{ marginBottom: authView === 'login' || authView === 'register' ? '2.5rem' : '1.5rem' }}>
              <div className="logo" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '2rem' }}>
                <TrendingUp size={32} style={{ color: '#10b981' }} /> FINTRACK
              </div>
              
              {authView === 'login' && (
                <>
                  <h2>Welcome Back</h2>
                  <p style={{ color: '#64748b' }}>Sign in to continue to your account</p>
                </>
              )}
              {authView === 'register' && (
                <>
                  <h2>Create Your Account</h2>
                  <p style={{ color: '#64748b' }}>Join FINTRACK and start your financial journey</p>
                </>
              )}
              {authView === 'forgot' && (
                <>
                  <h2>Forgot Password?</h2>
                  <p style={{ color: '#64748b', maxWidth: '320px', margin: '0 auto' }}>Enter your email address and we'll send you a verification code to reset your password.</p>
                </>
              )}
              {authView === 'verify' && (
                <>
                  <h2>Verify Your Identity</h2>
                  <p style={{ color: '#64748b', maxWidth: '320px', margin: '0 auto' }}>We have sent a 6-digit verification code to <strong>{email}</strong></p>
                </>
              )}
              {authView === 'reset' && (
                <>
                  <h2>Set a New Password</h2>
                  <p style={{ color: '#64748b' }}>Create a new password for your account.</p>
                </>
              )}
            </div>
          )}

          {/* Login / Register Toggle */}
          {(authView === 'login' || authView === 'register') && (
            <div className="auth-toggle">
              <button 
                type="button"
                className={`auth-toggle-btn ${authView === 'login' ? 'active' : ''}`}
                onClick={() => setAuthView('login')}
              >
                Login
              </button>
              <button 
                type="button"
                className={`auth-toggle-btn ${authView === 'register' ? 'active' : ''}`}
                onClick={() => setAuthView('register')}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* FORMS */}
          <form onSubmit={handleSubmit}>
            
            {/* EMAIL */}
            {(authView === 'login' || authView === 'register' || authView === 'forgot') && (
              <div className="auth-form-group">
                <label>Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail className="input-icon" />
                  <input 
                    type="email" 
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* NAME (Register only) */}
            {authView === 'register' && (
              <div className="auth-form-group" style={{ order: -1 }}>
                <label>Full Name</label>
                <div className="auth-input-wrapper">
                  <div className="input-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <input 
                    type="text" 
                    className="auth-input"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* PASSWORD */}
            {(authView === 'login' || authView === 'register' || authView === 'reset') && (
              <div className="auth-form-group">
                <label>{authView === 'reset' ? 'New Password' : 'Password'}</label>
                <div className="auth-input-wrapper">
                  <Lock className="input-icon" />
                  <input 
                    type={showPass ? "text" : "password"} 
                    className="auth-input"
                    placeholder={authView === 'reset' ? "Enter new password" : (authView === 'register' ? "Create a strong password" : "Enter your password")}
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    required
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Strength Meter for Register/Reset */}
                {(authView === 'register' || authView === 'reset') && pass.length > 0 && (
                  <div className="password-strength">
                    <div className="strength-bar-container">
                      <div className="strength-bar" style={{ 
                        width: `${calculateStrength(pass)}%`,
                        background: calculateStrength(pass) < 50 ? '#ef4444' : calculateStrength(pass) < 75 ? '#eab308' : '#22c55e'
                      }}></div>
                    </div>
                    <div className="strength-text" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#166534', background: '#dcfce7', padding: '0.5rem', borderRadius: '6px' }}>
                      <ShieldCheck size={14} /> Use at least 8 characters with a mix of letters, numbers and symbols.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CONFIRM PASSWORD (Register / Reset) */}
            {(authView === 'register' || authView === 'reset') && (
              <div className="auth-form-group">
                <label>Confirm {authView === 'reset' ? 'New Password' : 'Password'}</label>
                <div className="auth-input-wrapper">
                  <Lock className="input-icon" />
                  <input 
                    type={showPass ? "text" : "password"} 
                    className="auth-input"
                    placeholder="Confirm your password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* OTP BOXES */}
            {authView === 'verify' && (
              <div className="otp-container" style={{ margin: '2rem 0', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => otpRefs.current[index] = el}
                    type="text"
                    maxLength={1}
                    className="otp-input"
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(index, e)}
                    style={{ width: '45px', height: '55px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                    required
                  />
                ))}
              </div>
            )}

            {/* Options Row (Remember me, Forgot Password) */}
            {authView === 'login' && (
              <div className="auth-options">
                <label className="auth-checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Remember me
                </label>
                <button type="button" className="auth-forgot-link" onClick={() => setAuthView('forgot')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Forgot Password?</button>
              </div>
            )}

            {/* Terms (Register) */}
            {authView === 'register' && (
              <div className="auth-options" style={{ marginBottom: '1.5rem' }}>
                <label className="auth-checkbox-label">
                  <input type="checkbox" required />
                  <span>I agree to the Terms of Service and Privacy Policy</span>
                </label>
              </div>
            )}
            
            {/* Resend OTP */}
            {authView === 'verify' && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                Didn't receive the code? <button type="button" style={{ color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Resend in 00:28</button>
              </div>
            )}

            {/* PHONE */}
            {authView === 'phone' && (
              <div className="auth-form-group">
                <label>Phone Number</label>
                <div className="auth-input-wrapper">
                  <div className="input-icon" style={{ display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <input 
                    type="tel" 
                    className="auth-input"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div id="recaptcha-container" style={{ marginTop: '1rem' }}></div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            {authView !== 'success' && (
              <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: '#10b981', color: 'white' }}>
                {loading ? 'Please wait...' : 
                  authView === 'login' ? 'Sign In' : 
                  authView === 'register' ? 'Create Account' : 
                  authView === 'forgot' ? 'Send Verification Code' : 
                  authView === 'phone' ? 'Send SMS Code' :
                  authView === 'verify' ? 'Verify Code' : 'Reset Password'} 
                {!loading && (authView === 'login' ? <ArrowRight size={18} /> : null)}
              </button>
            )}
          </form>

          {/* BACK LINKS */}
          {(authView === 'forgot' || authView === 'verify' || authView === 'phone') && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => { setAuthView('login'); setVerifyMode('email'); }} style={{ color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowLeft size={16} /> Back to Login
              </button>
            </div>
          )}
          
          {authView === 'reset' && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setAuthView('verify')} style={{ color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          )}

          {/* SUCCESS VIEW */}
          {authView === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <CheckCircle size={48} style={{ color: '#166534' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>Password Reset Successfully!</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.5 }}>Your password has been updated.<br/>You can now sign in with your new password.</p>
              <button onClick={() => setAuthView('login')} className="auth-submit-btn" style={{ background: '#10b981', color: 'white', width: '100%' }}>
                Go to Login
              </button>
            </div>
          )}

          {/* OR CONTINUE WITH (Login / Register only) */}
          {(authView === 'login' || authView === 'register') && (
            <>
              <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
              </div>
              <button type="button" className="auth-google-btn" onClick={handleGoogle} disabled={loading}>
                <GoogleSVG /> Continue with Google
              </button>
              <button type="button" className="auth-google-btn" onClick={() => setAuthView('phone')} disabled={loading} style={{ marginTop: '0.75rem', background: '#f8fafc' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Continue with Phone
              </button>
              
              {authView === 'register' && (
                 <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                   Already have an account? <button type="button" onClick={() => setAuthView('login')} style={{ color: '#2563eb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign In</button>
                 </div>
              )}
            </>
          )}

          {/* Footer Features (Login only) */}
          {authView === 'login' && (
            <div className="auth-footer-features">
              <div className="auth-footer-item">
                <div className="icon green"><Lock size={16} /></div>
                <strong>Secure Login</strong>
                <span>Encrypted & protected</span>
              </div>
              <div className="auth-footer-item">
                <div className="icon blue"><ShieldCheck size={16} /></div>
                <strong>Your Data Stays Private</strong>
                <span>Never shared with third parties</span>
              </div>
              <div className="auth-footer-item">
                <div className="icon teal"><Fingerprint size={16} /></div>
                <strong>Bank-level Security</strong>
                <span>Industry standard protection</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
