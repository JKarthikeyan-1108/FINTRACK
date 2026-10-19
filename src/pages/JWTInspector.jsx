import toast from 'react-hot-toast';
import { Clipboard, KeyRound, RefreshCw, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card, Chip, EmptyState, Page, PageHeader, SectionTitle } from '../components/ui/CashewUI';

export default function JWTInspector() {
  const { token, tokenPayload, tokenStatus, secsLeft, fmtCountdown, refreshToken } = useAuth();

  if (!token) {
    return (
      <Page>
        <EmptyState icon={<KeyRound />} title="No active token" text="Sign in to inspect your JWT session." />
      </Page>
    );
  }

  const parts = token.split('.');
  const statusTone = tokenStatus === 'critical' ? 'pink' : tokenStatus === 'warning' ? 'amber' : 'mint';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Security & Diagnostics"
        title="JWT Session Inspector"
        subtitle="Inspect active JSON Web Token claims, signing algorithm, and expiration boundaries."
        action={
          <Button variant="soft" onClick={refreshToken}>
            <RefreshCw size={16} /> Renew Session
          </Button>
        }
      />

      {/* Session Health Card */}
      <div
        className="data-card"
        style={{
          marginBottom: 20,
          background: tokenStatus === 'critical' ? 'rgba(244, 63, 94, 0.08)' : tokenStatus === 'warning' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.06)',
          borderColor: tokenStatus === 'critical' ? 'rgba(244, 63, 94, 0.3)' : tokenStatus === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.25)',
        }}
      >
        <div className="data-card-body" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: tokenStatus === 'critical' ? '#f43f5e' : tokenStatus === 'warning' ? '#f59e0b' : '#10b981',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text)' }}>
                  {tokenStatus === 'critical' ? 'Token Expiring Now' : tokenStatus === 'warning' ? 'Session Expiring Soon' : 'JWT Token Valid & Signed'}
                </strong>
                <span className={`badge-pill ${tokenStatus === 'critical' ? 'badge-pill-pink' : tokenStatus === 'warning' ? 'badge-pill-amber' : 'badge-pill-mint'}`}>
                  {typeof fmtCountdown === 'function' ? fmtCountdown(secsLeft) : '1h'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Algorithm: HMAC-SHA256 (HS256) • Bearer Authorization Header
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="badge-pill badge-pill-neutral"
            style={{ cursor: 'pointer', padding: '8px 14px', fontSize: '0.8rem', border: '1px solid var(--border)' }}
          >
            <Clipboard size={14} /> Copy Raw Token
          </button>
        </div>
      </div>

      {/* Raw Token Breakdown */}
      <div className="data-card" style={{ marginBottom: 20 }}>
        <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
          <div className="data-card-title">
            <KeyRound size={16} color="#0ea5e9" /> Raw Token Structure (Header . Payload . Signature)
          </div>
          <span className="badge-pill badge-pill-blue">3 Segments</span>
        </div>
        <div className="data-card-body" style={{ padding: '16px 20px' }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'var(--surface-strong)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.78rem',
              lineHeight: 1.8,
              wordBreak: 'break-all',
            }}
          >
            <span style={{ color: '#0ea5e9', fontWeight: 700 }}>{parts[0]}</span>
            <span style={{ color: 'var(--text-muted)' }}>.</span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>{parts[1]}</span>
            <span style={{ color: 'var(--text-muted)' }}>.</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>{parts[2]}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: '0.74rem' }}>
            <span style={{ color: '#0ea5e9' }}>● Header</span>
            <span style={{ color: '#f59e0b' }}>● Claims Payload</span>
            <span style={{ color: '#10b981' }}>● HMAC Signature</span>
          </div>
        </div>
      </div>

      {/* Payload Claims */}
      <div className="data-card" style={{ marginBottom: 20 }}>
        <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
          <div className="data-card-title">
            <Sparkles size={16} color="#8b5cf6" /> Decoded Claims Payload
          </div>
          <span className="badge-pill badge-pill-purple">{tokenPayload ? Object.keys(tokenPayload).length : 0} Claims</span>
        </div>
        <div className="data-card-body" style={{ padding: '8px 20px 14px' }}>
          {tokenPayload && Object.entries(tokenPayload).map(([key, value]) => {
            const isTime = key === 'exp' || key === 'iat' || key === 'nbf';
            return (
              <div key={key} className="modern-row" style={{ padding: '12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge-pill ${key === 'exp' ? 'badge-pill-amber' : key === 'userId' || key === 'id' ? 'badge-pill-mint' : 'badge-pill-blue'}`}>
                    {key}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem', color: 'var(--text)', wordBreak: 'break-all' }}>
                  {isTime
                    ? `${new Date(value * 1000).toLocaleString('en-IN')}${key === 'exp' && typeof fmtCountdown === 'function' ? ` (${fmtCountdown(secsLeft)} left)` : ''}`
                    : String(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Protocol Overview */}
      <div className="data-card" style={{ marginBottom: 24 }}>
        <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
          <div className="data-card-title">
            <ShieldCheck size={16} color="#10b981" /> FinTrack Token Security Lifecycle
          </div>
          <span className="badge-pill badge-pill-mint">Stateless Auth</span>
        </div>
        <div className="data-card-body" style={{ padding: '8px 20px 14px' }}>
          {[
            ['1', 'Issue & Cryptographic Signing', 'Upon verified credentials/OTP, backend signs JWT using server-side secret key.'],
            ['2', 'Bearer Transport Protocol', 'Axios client injects Authorization: Bearer <token> into every outbound API request.'],
            ['3', 'Zero-Database Request Verification', 'Node.js middleware verifies HMAC-SHA256 signature instantly in memory.'],
            ['4', 'Graceful 401 Interception', 'Expired tokens trigger automatic refresh or secure redirect without data corruption.'],
            ['5', 'Strict Expiration Enforcement', 'Token lifespan is strictly enforced to minimize replay attack vulnerabilities.'],
          ].map(([step, title, detail]) => (
            <div key={step} className="modern-row" style={{ padding: '12px 0' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                {step}
              </div>
              <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                <strong style={{ fontSize: '0.86rem', color: 'var(--text)' }}>{title}</strong>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
