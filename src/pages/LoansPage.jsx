import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calculator, Car, GraduationCap, Home, Landmark, Plus, Trash2, WalletCards } from 'lucide-react';
import { loanAPI } from '../services/api';
import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  FAB,
  IconButton,
  MetricCard,
  Page,
  PageHeader,
  ProgressBar,
  SegmentedControl,
  SelectInput,
  TextInput,
  VisualCategorySelect,
} from '../components/ui/CashewUI';
import { money } from '../lib/format';

const TYPES = ['home', 'car', 'personal', 'education', 'other'];
const TYPE_INFO = {
  home: { id: 'home', name: 'Home Loan', Icon: Home, icon: '🏠', tone: 'blue' },
  car: { id: 'car', name: 'Vehicle Loan', Icon: Car, icon: '🚗', tone: 'amber' },
  personal: { id: 'personal', name: 'Personal Loan', Icon: WalletCards, icon: '💳', tone: 'purple' },
  education: { id: 'education', name: 'Education Loan', Icon: GraduationCap, icon: '🎓', tone: 'mint' },
  other: { id: 'other', name: 'Other', Icon: Landmark, icon: '💰', tone: 'plain' },
};
const LOAN_CATEGORIES = Object.values(TYPE_INFO);

const blankForm = () => ({
  name: '',
  type: 'personal',
  principal: '',
  interest_rate: '',
  tenure_months: '',
  emi_date: '1',
  lender: '',
});

function calcEMI(principal, annualRate, months) {
  if (!months) return 0;
  if (!annualRate) return principal / months;
  const rate = annualRate / 1200;
  return (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
}

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [calcMode, setCalcMode] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [calc, setCalc] = useState({ principal: '', rate: '', months: '' });

  useEffect(() => {
    loanAPI.getAll()
      .then(({ data }) => {
        setLoans(data.data || []);
        setSummary(data.summary || {});
      })
      .catch(() => toast.error('Failed to load loans'))
      .finally(() => setLoading(false));
  }, []);

  const emiPreview = form.principal && form.tenure_months
    ? calcEMI(Number(form.principal), Number(form.interest_rate || 0), Number(form.tenure_months))
    : 0;

  const calcEmi = calc.principal && calc.months ? calcEMI(Number(calc.principal), Number(calc.rate || 0), Number(calc.months)) : 0;
  const calcResult = calcEmi ? {
    emi: calcEmi,
    total: calcEmi * Number(calc.months),
    interest: calcEmi * Number(calc.months) - Number(calc.principal),
  } : null;

  async function addLoan() {
    const { name, type, principal, interest_rate, tenure_months, emi_date, lender, emi_amount } = form;
    if (!name || !principal || !tenure_months) {
      toast.error('Name, principal, and tenure are required');
      return;
    }

    try {
      const calculatedEmi = calcEMI(Number(principal), Number(interest_rate || 0), Number(tenure_months));
      const finalEmi = emi_amount ? Number(emi_amount) : Math.round(calculatedEmi);
      
      const { data } = await loanAPI.create({
        name,
        type,
        principal: Number(principal),
        remaining: Number(principal),
        emi_amount: finalEmi,
        interest_rate: Number(interest_rate || 0),
        tenure_months: Number(tenure_months),
        emi_date: Number(emi_date || 1),
        lender,
      });
      setLoans(prev => [data.data, ...prev]);
      setSummary(prev => ({
        ...prev,
        total_remaining: Number(prev.total_remaining || 0) + Number(principal),
        total_emi: Number(prev.total_emi || 0) + Math.round(emi),
      }));
      setModal(false);
      setForm(blankForm());
      toast.success('Loan added');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add loan');
    }
  }

  async function payEMI(loan) {
    const newPaid = Number(loan.paid_months || 0) + 1;
    const newRemaining = Math.max(0, Number(loan.remaining) - Number(loan.emi_amount));
    const done = newPaid >= Number(loan.tenure_months);

    try {
      const { data } = await loanAPI.update(loan.id, {
        ...loan,
        remaining: newRemaining,
        paid_months: newPaid,
        is_active: !done,
      });
      setLoans(prev => prev.map(item => item.id === loan.id ? data.data : item));
      setPayModal(null);
      toast.success(done ? 'Loan fully paid' : 'EMI paid');
    } catch {
      toast.error('Failed to mark EMI paid');
    }
  }

  async function deleteLoan(id) {
    try {
      await loanAPI.remove(id);
      setLoans(prev => prev.filter(loan => loan.id !== id));
      toast.success('Loan deleted');
    } catch {
      toast.error('Failed to delete loan');
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Liabilities"
        title="Loans & EMI"
        subtitle="Track remaining debt, EMI rhythm, and payoff progress."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <IconButton icon={<Calculator size={19} />} label="EMI calculator" onClick={() => setCalcMode(value => !value)} />
            <Button onClick={() => setModal(true)}><Plus size={18} /> Add</Button>
          </div>
        }
      />

      {calcMode && (
        <Card tone="blue" style={{ marginBottom: 14 }}>
          <div className="section-title" style={{ marginTop: 0 }}><span>EMI Calculator</span></div>
          <div className="field-row">
            <TextInput label="Principal" type="number" value={calc.principal} onChange={event => setCalc(prev => ({ ...prev, principal: event.target.value }))} placeholder="0" />
            <TextInput label="Rate" type="number" value={calc.rate} onChange={event => setCalc(prev => ({ ...prev, rate: event.target.value }))} placeholder="%/yr" />
          </div>
          <TextInput label="Months" type="number" value={calc.months} onChange={event => setCalc(prev => ({ ...prev, months: event.target.value }))} placeholder="60" />
          {calcResult && (
            <div className="metric-grid">
              <MetricCard label="EMI" value={money(Math.round(calcResult.emi))} helper="Per month" tone="mint" icon={<WalletCards />} />
              <MetricCard label="Total" value={money(Math.round(calcResult.total))} helper="Principal + interest" tone="blue" icon={<Calculator />} />
              <MetricCard label="Interest" value={money(Math.round(calcResult.interest))} helper="Estimated" tone="pink" icon={<Landmark />} />
            </div>
          )}
        </Card>
      )}

      {loans.length > 0 && (
        <div className="metric-grid" style={{ marginBottom: 14 }}>
          <MetricCard label="Total Debt" value={money(summary.total_remaining)} helper="Remaining" tone="pink" icon={<Landmark />} />
          <MetricCard label="Monthly EMI" value={money(summary.total_emi)} helper="Committed" tone="amber" icon={<WalletCards />} />
          <MetricCard label="Loans" value={String(loans.length)} helper="Tracked" tone="blue" icon={<Calculator />} />
          <MetricCard label="Active" value={String(loans.filter(loan => loan.is_active).length)} helper="Still paying" tone="mint" icon={<Home />} />
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={<Landmark />}
          title="No loans tracked"
          text="Add loans to see EMI totals, remaining balance, and payoff progress."
          action={<Button onClick={() => setModal(true)}><Plus size={18} /> Add loan</Button>}
        />
      ) : (
        <div className="budget-list">
          {loans.map(loan => {
            const info = TYPE_INFO[loan.type] || TYPE_INFO.other;
            const Icon = info.Icon;
            const paidPct = loan.tenure_months > 0 ? Math.min((Number(loan.paid_months || 0) / Number(loan.tenure_months)) * 100, 100) : 0;
            const done = !loan.is_active || paidPct >= 100;
            const left = Number(loan.tenure_months || 0) - Number(loan.paid_months || 0);

            return (
              <Card key={loan.id} tone={done ? 'mint' : 'plain'} style={{ opacity: done ? .75 : 1 }}>
                <div className="transaction-row" style={{ borderBottom: 0, padding: 0 }}>
                  <div className="transaction-icon">
                    <Icon size={21} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="transaction-title">{loan.name}</div>
                    <div className="transaction-meta">{loan.lender || 'Lender'} - {loan.type} - {loan.interest_rate}% p.a.</div>
                    <div style={{ marginTop: 8 }}>
                      <ProgressBar value={paidPct} tone={done ? 'mint' : 'amber'} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="transaction-amount amount-expense">{money(loan.remaining)}</div>
                    <div className="transaction-meta">remaining</div>
                  </div>
                </div>
                <div className="budget-row-meta" style={{ marginTop: 10 }}>
                  <span>{loan.paid_months || 0}/{loan.tenure_months} EMIs paid</span>
                  <span>EMI {money(loan.emi_amount)}/mo</span>
                </div>
                {!done && <p style={{ marginTop: 8 }}>{left} EMIs left at the current schedule.</p>}
                <div className="row-actions">
                  {!done && <button onClick={() => setPayModal(loan)}><WalletCards size={13} /> Pay EMI</button>}
                  <button onClick={() => deleteLoan(loan.id)}><Trash2 size={13} /> Delete</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <FAB icon={<Plus size={24} />} label="Add loan" onClick={() => setModal(true)} />

      {modal && (
        <BottomSheet title="Add Loan" onClose={() => setModal(false)}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Loan Type</label>
            <SegmentedControl
              value={form.type}
              onChange={val => setForm(prev => ({ ...prev, type: val }))}
              options={[
                { value: 'personal', label: 'Personal' },
                { value: 'home', label: 'Home' },
                { value: 'car', label: 'Car' },
              ]}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Loan Name</label>
            <input 
              type="text"
              className="input"
              placeholder="E.g., HDFC Home Loan"
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Principal Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: '#64748b', fontWeight: 600, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 32, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}
                placeholder="0.00"
                value={form.principal}
                onChange={event => setForm(prev => ({ ...prev, principal: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Interest Rate</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: '#64748b', fontWeight: 600, fontSize: '1.1rem' }}>%</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 32, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}
                placeholder="0.00"
                value={form.interest_rate}
                onChange={event => setForm(prev => ({ ...prev, interest_rate: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>EMI Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: '#64748b', fontWeight: 600, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 32, fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}
                placeholder={emiPreview > 0 ? String(Math.round(emiPreview)) : "0.00"}
                value={form.emi_amount || ''}
                onChange={event => setForm(prev => ({ ...prev, emi_amount: event.target.value }))}
              />
            </div>
            {emiPreview > 0 && !form.emi_amount && <small style={{ color: '#64748b', marginTop: 4, display: 'block' }}>Estimated: {money(Math.round(emiPreview))}</small>}
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Tenure (Months)</label>
            <input 
              type="number"
              className="input"
              style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}
              placeholder="0"
              value={form.tenure_months}
              onChange={event => setForm(prev => ({ ...prev, tenure_months: event.target.value }))}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Start Date</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 13, color: '#64748b' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </span>
              <input 
                type="date"
                className="input"
                style={{ paddingLeft: 40, color: '#0f172a', fontWeight: 500 }}
                value={form.start_date || new Date().toISOString().split('T')[0]}
                onChange={event => setForm(prev => ({ ...prev, start_date: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Next EMI Date</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 13, color: '#64748b' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </span>
              <input 
                type="date"
                className="input"
                style={{ paddingLeft: 40, color: '#0f172a', fontWeight: 500 }}
                placeholder="Select date"
                value={form.emi_date_full || ''}
                onChange={event => {
                  const dateVal = event.target.value;
                  const day = dateVal ? parseInt(dateVal.split('-')[2], 10) : '';
                  setForm(prev => ({ ...prev, emi_date_full: dateVal, emi_date: String(day) }));
                }}
              />
            </div>
          </div>
          
          <div className="field" style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'block' }}>Note (Optional)</label>
            <input 
              type="text"
              className="input"
              placeholder="Add a note..."
              value={form.lender}
              onChange={event => setForm(prev => ({ ...prev, lender: event.target.value }))}
            />
          </div>

          <Button className="ui-button-full" onClick={addLoan} style={{ background: '#10b981', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '1rem', fontWeight: 600 }}>
            Add Loan
          </Button>
        </BottomSheet>
      )}

      {payModal && (
        <BottomSheet title="Confirm EMI Payment" onClose={() => setPayModal(null)}>
          <Card tone="amber" style={{ marginBottom: 14, textAlign: 'center' }}>
            <span className="hero-balance-label">{payModal.name}</span>
            <strong style={{ fontSize: 34 }}>{money(payModal.emi_amount)}</strong>
            <p>EMI #{Number(payModal.paid_months || 0) + 1} of {payModal.tenure_months}</p>
          </Card>
          <Button className="ui-button-full" onClick={() => payEMI(payModal)}>Confirm payment</Button>
        </BottomSheet>
      )}
    </Page>
  );
}
