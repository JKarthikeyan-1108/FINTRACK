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
import { triggerHaptic } from '../lib/haptics';

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
      triggerHaptic('warning');
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
        total_emi: Number(prev.total_emi || 0) + Math.round(finalEmi),
      }));
      setModal(false);
      setForm(blankForm());
      triggerHaptic('success');
      toast.success('Loan added');
    } catch (error) {
      triggerHaptic('warning');
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
      triggerHaptic('success');
      toast.success(done ? '🎉 Congratulations! Loan fully paid off!' : 'EMI payment recorded');
    } catch {
      triggerHaptic('warning');
      toast.error('Failed to mark EMI paid');
    }
  }

  async function deleteLoan(id) {
    try {
      triggerHaptic('heavy');
      await loanAPI.remove(id);
      setLoans(prev => prev.filter(loan => loan.id !== id));
      toast.success('Loan deleted');
    } catch {
      triggerHaptic('warning');
      toast.error('Failed to delete loan');
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Liabilities & Debt"
        title="Loans & EMI"
        subtitle="Track outstanding principal balance, monthly EMI burden, and payoff timeline."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="soft" onClick={() => setCalcMode(value => !value)}>
              <Calculator size={16} /> {calcMode ? 'Hide Calculator' : 'EMI Calculator'}
            </Button>
            <Button variant="primary" onClick={() => setModal(true)}>
              <Plus size={16} /> Add Loan
            </Button>
          </div>
        }
      />

      {calcMode && (
        <div className="data-card" style={{ marginBottom: 20 }}>
          <div className="data-card-header" style={{ background: 'var(--surface-strong)' }}>
            <span className="data-card-title"><Calculator size={16} /> Loan EMI Estimator</span>
          </div>
          <div className="data-card-body" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 16 }}>
              <TextInput label="Principal (₹)" type="number" value={calc.principal} onChange={event => setCalc(prev => ({ ...prev, principal: event.target.value }))} placeholder="1000000" />
              <TextInput label="Interest Rate (% p.a.)" type="number" value={calc.rate} onChange={event => setCalc(prev => ({ ...prev, rate: event.target.value }))} placeholder="8.5" />
              <TextInput label="Tenure (Months)" type="number" value={calc.months} onChange={event => setCalc(prev => ({ ...prev, months: event.target.value }))} placeholder="60" />
            </div>
            {calcResult && (
              <div className="metric-grid" style={{ marginBottom: 0 }}>
                <MetricCard label="Monthly EMI" value={money(Math.round(calcResult.emi))} helper="Committed per month" tone="mint" icon={<WalletCards />} />
                <MetricCard label="Total Outflow" value={money(Math.round(calcResult.total))} helper="Principal + total interest" tone="blue" icon={<Calculator />} />
                <MetricCard label="Interest Cost" value={money(Math.round(calcResult.interest))} helper="Borrowing premium" tone="pink" icon={<Landmark />} />
              </div>
            )}
          </div>
        </div>
      )}

      {loans.length > 0 && (
        <div className="metric-grid" style={{ marginBottom: 20 }}>
          <div className="card-stagger">
            <MetricCard
              label="Total Outstanding"
              value={money(summary.total_remaining || 0)}
              helper="Remaining liabilities"
              tone="pink"
              icon={<Landmark />}
            />
          </div>
          <div className="card-stagger">
            <MetricCard
              label="Committed Monthly EMI"
              value={money(summary.total_emi || 0)}
              helper="Cashflow deduction"
              tone="amber"
              icon={<WalletCards />}
            />
          </div>
          <div className="card-stagger">
            <MetricCard
              label="Active Facilities"
              value={String(loans.filter(loan => loan.is_active).length)}
              helper="Ongoing debt lines"
              tone="blue"
              icon={<Home />}
            />
          </div>
          <div className="card-stagger">
            <MetricCard
              label="Paid / Completed"
              value={String(loans.filter(loan => !loan.is_active).length)}
              helper="Fully retired"
              tone="mint"
              icon={<Calculator />}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={<Landmark />}
          title="No debt liabilities tracked"
          text="Track home loans, car loans, or education loans to plan accelerated payoffs."
          action={<Button onClick={() => setModal(true)}><Plus size={16} /> Add loan</Button>}
        />
      ) : (
        <div className="category-grid-animate" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {loans.map(loan => {
            const info = TYPE_INFO[loan.type] || TYPE_INFO.other;
            const Icon = info.Icon;
            const paidPct = loan.tenure_months > 0 ? Math.min((Number(loan.paid_months || 0) / Number(loan.tenure_months)) * 100, 100) : 0;
            const done = !loan.is_active || paidPct >= 100;
            const left = Number(loan.tenure_months || 0) - Number(loan.paid_months || 0);

            return (
              <div key={loan.id} className="data-card card-stagger" style={{ opacity: done ? 0.75 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="data-card-header" style={{ padding: '14px 18px', background: 'var(--surface-strong)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: '1.1rem' }}>
                      {info.icon || '💳'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                        {loan.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {loan.lender || 'Direct Lender'} • {loan.interest_rate}% p.a.
                      </div>
                    </div>
                  </div>
                  <span className={`badge-pill ${done ? 'badge-pill-mint' : 'badge-pill-amber'}`}>
                    {done ? 'Paid Off 🎉' : `${left} EMIs Left`}
                  </span>
                </div>

                <div className="data-card-body" style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: done ? 'var(--status-positive)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                        {money(loan.remaining)}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        EMI {money(loan.emi_amount)}/mo • Due on day {loan.emi_date || 1}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {paidPct.toFixed(0)}% Repaid
                      </span>
                    </div>
                  </div>

                  <ProgressBar value={paidPct} tone={done ? 'mint' : 'amber'} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {loan.paid_months || 0} of {loan.tenure_months} installments
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!done && (
                        <button
                          onClick={() => setPayModal(loan)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-mint, rgba(21, 128, 61, 0.3))', background: 'var(--mint-subtle, rgba(21, 128, 61, 0.08))', color: 'var(--status-positive)', borderRadius: 6, padding: '4px 10px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          <WalletCards size={12} /> Pay EMI
                        </button>
                      )}
                      <button
                        onClick={() => deleteLoan(loan.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, border: '1px solid var(--border-danger, rgba(180, 35, 24, 0.25))', background: 'var(--bg-danger-subtle, rgba(180, 35, 24, 0.08))', color: 'var(--status-negative)', borderRadius: 6, padding: '4px 8px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FAB icon={<Plus size={22} />} label="Add loan" onClick={() => setModal(true)} />

      {modal && (
        <BottomSheet title="Add Loan" onClose={() => setModal(false)}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Loan Type
            </label>
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
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Loan Facility Name
            </label>
            <input 
              type="text"
              className="input"
              placeholder="E.g., HDFC Home Loan, SBI Auto Loan"
              value={form.name}
              onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
              autoFocus
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Principal Amount
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 34, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}
                placeholder="0.00"
                value={form.principal}
                onChange={event => setForm(prev => ({ ...prev, principal: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Annual Interest Rate (% p.a.)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>%</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 34, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}
                placeholder="8.5"
                value={form.interest_rate}
                onChange={event => setForm(prev => ({ ...prev, interest_rate: event.target.value }))}
              />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Monthly EMI Amount
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                className="input"
                style={{ paddingLeft: 34, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}
                placeholder={emiPreview > 0 ? String(Math.round(emiPreview)) : "0.00"}
                value={form.emi_amount || ''}
                onChange={event => setForm(prev => ({ ...prev, emi_amount: event.target.value }))}
              />
            </div>
            {emiPreview > 0 && !form.emi_amount && (
              <small style={{ color: 'var(--status-positive)', marginTop: 4, display: 'block', fontWeight: 600 }}>
                Computed EMI: {money(Math.round(emiPreview))}/month
              </small>
            )}
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tenure in Months
            </label>
            <input 
              type="number"
              className="input"
              style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}
              placeholder="E.g., 60, 120, 240"
              value={form.tenure_months}
              onChange={event => setForm(prev => ({ ...prev, tenure_months: event.target.value }))}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lender / Institution
            </label>
            <input 
              type="text"
              className="input"
              placeholder="E.g., HDFC Bank, ICICI, Axis"
              value={form.lender}
              onChange={event => setForm(prev => ({ ...prev, lender: event.target.value }))}
            />
          </div>

          <Button variant="primary" className="ui-button-full" onClick={addLoan} style={{ padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, marginTop: 8 }}>
            Add Loan Facility
          </Button>
        </BottomSheet>
      )}

      {payModal && (
        <BottomSheet title="Record EMI Payment" onClose={() => setPayModal(null)}>
          <div className="data-card" style={{ marginBottom: 16 }}>
            <div className="data-card-body" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{payModal.name}</div>
              <strong style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', display: 'block', margin: '4px 0', fontVariantNumeric: 'tabular-nums' }}>
                {money(payModal.emi_amount)}
              </strong>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Recording installment #{Number(payModal.paid_months || 0) + 1} of {payModal.tenure_months}
              </div>
            </div>
          </div>
          <Button variant="primary" className="ui-button-full" onClick={() => payEMI(payModal)} style={{ padding: '12px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
            Confirm EMI Paid
          </Button>
        </BottomSheet>
      )}
    </Page>
  );
}
