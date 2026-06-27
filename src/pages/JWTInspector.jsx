import toast from 'react-hot-toast';
import { Clipboard, KeyRound, RefreshCw, ShieldCheck } from 'lucide-react';
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
      toast.success('Token copied');
    } catch {
      toast.error('Copy failed');
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Security"
        title="JWT Inspector"
        subtitle="Inspect the active access token, claims, and expiry state."
        action={<Button variant="soft" onClick={refreshToken}><RefreshCw size={18} /> Refresh</Button>}
      />

      <Card tone={statusTone} style={{ marginBottom: 14 }}>
        <div className="transaction-row" style={{ borderBottom: 0, padding: 0 }}>
          <div className="transaction-icon"><ShieldCheck size={21} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="transaction-title">
              {tokenStatus === 'critical' ? 'Token expiring now' : tokenStatus === 'warning' ? 'Session expiring soon' : 'JWT token active'}
            </div>
            <div className="transaction-meta">Expires in {fmtCountdown(secsLeft)}</div>
          </div>
        </div>
      </Card>

      <SectionTitle>Full Token</SectionTitle>
      <CodeCard>
        <span style={{ color: '#4b82b8' }}>{parts[0]}</span>
        <span>.</span>
        <span style={{ color: '#c58a21' }}>{parts[1]}</span>
        <span>.</span>
        <span style={{ color: '#315f3b' }}>{parts[2]}</span>
      </CodeCard>
      <Button variant="soft" className="ui-button-full" onClick={handleCopy} style={{ marginBottom: 16 }}>
        <Clipboard size={18} /> Copy token
      </Button>

      <SectionTitle>Header</SectionTitle>
      <CodeCard>{`{\n  "alg": "HS256",\n  "typ": "JWT"\n}`}</CodeCard>

      <SectionTitle>Payload Claims</SectionTitle>
      <Card className="list-card">
        {tokenPayload && Object.entries(tokenPayload).map(([key, value]) => {
          const isTime = key === 'exp' || key === 'iat' || key === 'nbf';
          return (
            <div key={key} className="transaction-row">
              <Chip tone={key === 'exp' ? 'amber' : 'blue'}>{key}</Chip>
              <code style={{ wordBreak: 'break-all', color: '#455049', lineHeight: 1.5 }}>
                {isTime ? `${new Date(value * 1000).toLocaleString('en-IN')}${key === 'exp' ? ` (${fmtCountdown(secsLeft)})` : ''}` : String(value)}
              </code>
            </div>
          );
        })}
      </Card>

      <SectionTitle>Signature</SectionTitle>
      <CodeCard tone="amber">{parts[2]}</CodeCard>

      <SectionTitle>How JWT Works In FINTRACK</SectionTitle>
      <Card className="list-card" style={{ marginBottom: 20 }}>
        {[
          ['1', 'Login issues token', 'Server validates credentials and signs the JWT.'],
          ['2', 'Requests attach token', 'Axios sends Authorization: Bearer on API calls.'],
          ['3', 'Server verifies signature', 'HMAC-SHA256 protects token integrity.'],
          ['4', '401 triggers refresh', 'The API client renews the token when possible.'],
          ['5', 'Expiry is enforced', 'Expired sessions redirect to login.'],
        ].map(([step, title, detail]) => (
          <div key={step} className="transaction-row">
            <Chip tone="mint">{step}</Chip>
            <div>
              <div className="transaction-title">{title}</div>
              <div className="transaction-meta">{detail}</div>
            </div>
          </div>
        ))}
      </Card>
    </Page>
  );
}

function CodeCard({ children, tone = 'plain' }) {
  return (
    <Card tone={tone} style={{ marginBottom: 10 }}>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 12, lineHeight: 1.7, color: '#26312a' }}>
        {children}
      </pre>
    </Card>
  );
}
