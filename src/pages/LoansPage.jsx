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
  SelectInput,
  TextInput,
} from '../components/ui/CashewUI';
import { money } from '../lib/format';

const TYPES = ['home', 'car', 'personal', 'education', 'other'];
const TYPE_INFO = {
  home: { Icon: Home, tone: 'blue' },
  car: { Icon: Car, tone: 'amber' },
  personal: { Icon: WalletCards, tone: 'purple' },
  education: { Icon: GraduationCap, tone: 'mint' },
  other: { Icon: Landmark, tone: 'plain' },
};

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
    const { name, type, principal, interest_rate, tenure_months, emi_date, lender } = form;
    if (!name || !principal || !tenure_months) {
      toast.error('Name, principal, and tenure are required');
      return;
    }

    try {
      const emi = calcEMI(Number(principal), Number(interest_rate || 0), Number(tenure_months));
      const { data } = await loanAPI.create({
        name,
        type,
        principal: Number(principal),
        remaining: Number(principal),
        emi_amount: Math.round(emi),
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
          <TextInput label="Loan name" value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="Home loan, car loan" />
          <SelectInput label="Loan type" value={form.type} onChange={event => setForm(prev => ({ ...prev, type: event.target.value }))}>
            {TYPES.map(type => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}
          </SelectInput>
          <div className="field-row">
            <TextInput label="Principal" type="number" value={form.principal} onChange={event => setForm(prev => ({ ...prev, principal: event.target.value }))} placeholder="0" />
            <TextInput label="Rate" type="number" value={form.interest_rate} onChange={event => setForm(prev => ({ ...prev, interest_rate: event.target.value }))} placeholder="%/yr" />
          </div>
          <div className="field-row">
            <TextInput label="Tenure months" type="number" value={form.tenure_months} onChange={event => setForm(prev => ({ ...prev, tenure_months: event.target.value }))} placeholder="60" />
            <TextInput label="EMI date" type="number" value={form.emi_date} onChange={event => setForm(prev => ({ ...prev, emi_date: event.target.value }))} placeholder="1" />
          </div>
          <TextInput label="Lender" value={form.lender} onChange={event => setForm(prev => ({ ...prev, lender: event.target.value }))} placeholder="Bank or lender" />
          {emiPreview > 0 && (
            <Card tone="mint" style={{ marginBottom: 14 }}>
              <span className="hero-balance-label">Estimated EMI</span>
              <strong>{money(Math.round(emiPreview))}<span style={{ fontSize: 14, color: '#66706a' }}>/mo</span></strong>
              <p>Total payment {money(Math.round(emiPreview * Number(form.tenure_months)))}</p>
            </Card>
          )}
          <Button className="ui-button-full" onClick={addLoan}>Add loan</Button>
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
