import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, Phone, ShieldCheck, WalletCards } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, IconButton, SegmentedControl, TextInput } from '../components/ui/CashewUI';

const GoogleSVG = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M5.27 9.77A7 7 0 0112 5c1.76 0 3.35.66 4.57 1.73l3.38-3.38A11.8 11.8 0 0012 .5C7.31.5 3.26 3.07 1.27 6.93l4 2.84z" />
    <path fill="#34A853" d="M16.04 18.01A7 7 0 015.27 14.23l-4 2.84C3.26 20.93 7.31 23.5 12 23.5c3.19 0 6.22-1.14 8.49-3.29l-4.45-2.2z" />
    <path fill="#4A90D9" d="M20.49 20.21A11.8 11.8 0 0023.5 12c0-.81-.09-1.6-.23-2.37H12v4.76h6.46a5.5 5.5 0 01-2.38 3.62l4.41 2.2z" />
    <path fill="#FBBC05" d="M5.27 14.23A6.97 6.97 0 015 12c0-.77.13-1.52.27-2.23L1.27 6.93A11.75 11.75 0 00.5 12c0 1.86.44 3.61 1.2 5.18l3.57-2.95z" />
  </svg>
);

export default function AuthPage() {
  const { sendOTP, verifyOTP, googleLogin, emailLogin, emailRegister, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('home');
  const [emailMode, setEmailMode] = useState('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const otpRefs = useRef([]);

  useEffect(() => {
    if (isAuthenticated) navigate('/home', { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleGoogle() {
    setLoading(true);
    try {
      await googleLogin({ name: 'Arjun Kumar', email: 'arjun.kumar@gmail.com', google_id: 'google_demo_001' });
      navigate('/home', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail() {
    if (!email || !pass) {
      toast.error('Enter email and password');
      return;
    }
    if (emailMode === 'register' && !name) {
      toast.error('Enter your name');
      return;
    }
    if (emailMode === 'register' && pass.length < 8) {
      toast.error('Password must be 8+ characters');
      return;
    }

    setLoading(true);
    try {
      if (emailMode === 'register') await emailRegister(name, email, pass);
      else await emailLogin(email, pass);
      navigate('/home', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || (emailMode === 'register' ? 'Registration failed' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOTP() {
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Enter a 10-digit number');
      return;
    }

    setLoading(true);
    try {
      const data = await sendOTP(phone);
      if (data.demo_otp) setDemoOtp(data.demo_otp);
      setMode('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 120);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < 6) {
      toast.error('Enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP(phone, code);
      navigate('/home', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid OTP');
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function onOtpChange(value, index) {
    const digit = value.replace(/\D/, '');
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function onOtpKey(event, index) {
    if (event.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-brand">
          <div className="auth-logo"><WalletCards size={30} /></div>
          <div>
            <h1>FinTrack</h1>
            <p>Money, budgets, and goals in one calm place.</p>
          </div>
        </div>

        <Card className="auth-card" tone="plain">
          {mode === 'home' && (
            <>
              <h2>Welcome back</h2>
              <p style={{ marginTop: 6, marginBottom: 18 }}>Sign in to continue tracking your personal finances.</p>

              <Button variant="soft" className="ui-button-full" onClick={handleGoogle} disabled={loading} style={{ marginBottom: 12 }}>
                <GoogleSVG /> {loading ? 'Connecting...' : 'Continue with Google'}
              </Button>

              <div className="auth-divider"><span>or continue with</span></div>

              <button className="auth-choice" onClick={() => setMode('email')}>
                <Mail size={20} />
                <span>Email & Password</span>
              </button>
              <button className="auth-choice" onClick={() => setMode('phone')}>
                <Phone size={20} />
                <span>Phone OTP</span>
              </button>

              <div className="auth-footnote"><ShieldCheck size={15} /> Encrypted sessions</div>
            </>
          )}

          {mode === 'email' && (
            <>
              <BackButton onClick={() => setMode('home')} />
              <SegmentedControl
                value={emailMode}
                onChange={setEmailMode}
                options={[
                  { value: 'login', label: 'Sign In', icon: <Mail /> },
                  { value: 'register', label: 'Create', icon: <KeyRound /> },
                ]}
              />
              <h2 style={{ marginTop: 18 }}>{emailMode === 'login' ? 'Sign in' : 'Create account'}</h2>
              <p style={{ marginTop: 6, marginBottom: 12 }}>{emailMode === 'login' ? 'Use your email and password.' : 'Register with email and password.'}</p>
              {emailMode === 'register' && <TextInput label="Full name" value={name} onChange={event => setName(event.target.value)} />}
              <TextInput label="Email address" type="email" value={email} onChange={event => setEmail(event.target.value)} />
              <PasswordInput value={pass} show={showPass} onToggle={() => setShowPass(value => !value)} onChange={event => setPass(event.target.value)} onEnter={handleEmail} />
              <Button className="ui-button-full" onClick={handleEmail} disabled={loading}>
                {loading ? 'Please wait...' : emailMode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </>
          )}

          {mode === 'phone' && (
            <>
              <BackButton onClick={() => setMode('home')} />
              <h2>Phone sign in</h2>
              <p style={{ marginTop: 6, marginBottom: 16 }}>We'll send a 6-digit OTP to your number.</p>
              <div className="field-row">
                <label className="field">
                  <span>Code</span>
                  <select>
                    <option>+91</option>
                    <option>+1</option>
                    <option>+44</option>
                  </select>
                </label>
                <TextInput
                  label="Phone"
                  type="tel"
                  value={phone}
                  maxLength={10}
                  onChange={event => setPhone(event.target.value.replace(/\D/, ''))}
                  onKeyDown={event => event.key === 'Enter' && handleSendOTP()}
                />
              </div>
              <Button className="ui-button-full" onClick={handleSendOTP} disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          )}

          {mode === 'otp' && (
            <>
              <BackButton onClick={() => { setMode('phone'); setOtp(Array(6).fill('')); }} />
              <h2>Enter OTP</h2>
              <p style={{ marginTop: 6 }}>Sent to +91 {phone.slice(0, 2)}****{phone.slice(-2)}</p>
              {demoOtp && <Card tone="mint" style={{ margin: '14px 0' }}>Demo OTP: <strong>{demoOtp}</strong></Card>}
              <div className="otp-grid">
                {otp.map((value, index) => (
                  <input
                    key={index}
                    ref={el => { otpRefs.current[index] = el; }}
                    type="tel"
                    maxLength={1}
                    value={value}
                    onChange={event => onOtpChange(event.target.value, index)}
                    onKeyDown={event => onOtpKey(event, index)}
                  />
                ))}
              </div>
              <Button className="ui-button-full" onClick={handleVerify} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & continue'}
              </Button>
            </>
          )}
        </Card>

        <p className="auth-version">Secured with JWT HS256 - FinTrack v2.0</p>
      </section>
    </main>
  );
}

function BackButton({ onClick }) {
  return (
    <button className="auth-back" onClick={onClick}>
      <ArrowLeft size={16} /> Back
    </button>
  );
}

function PasswordInput({ value, show, onToggle, onChange, onEnter }) {
  return (
    <label className="field">
      <span>Password</span>
      <div style={{ position: 'relative' }}>
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} onKeyDown={event => event.key === 'Enter' && onEnter()} />
        <IconButton
          icon={show ? <EyeOff size={17} /> : <Eye size={17} />}
          label={show ? 'Hide password' : 'Show password'}
          onClick={onToggle}
          style={{ position: 'absolute', right: 4, top: 3, width: 42, height: 42 }}
        />
      </div>
    </label>
  );
}
