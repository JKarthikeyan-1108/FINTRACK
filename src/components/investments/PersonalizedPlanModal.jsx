// src/components/investments/PersonalizedPlanModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  Compass,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { generateBeginnerRoadmap, generateSmartSuggestions } from '../../lib/investmentPlanEngine';
import { triggerHaptic } from '../../lib/haptics';

export default function PersonalizedPlanModal({ isOpen, onClose, onSelectCategory }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('fintrack_user_investor_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      hasRegularIncome: true,
      monthlyIncome: 60000,
      monthlyExpenses: 35000,
      hasHighInterestDebt: false,
      emergencyMonths: 2,
      hasDependents: false,
      hasHealthInsurance: false,
      hasTermInsurance: false,
      timeHorizon: 'long',
      riskTolerance: 'moderate',
      monthlyInvestableAmount: 10000,
      primaryGoal: 'wealth_growth',
    };
  });

  const [hasCalculated, setHasCalculated] = useState(false);
  const [activeTab, setActiveTab] = useState('roadmap'); // 'roadmap' | 'suggestions'

  const roadmap = React.useMemo(() => generateBeginnerRoadmap(profile), [profile]);
  const suggestions = React.useMemo(() => generateSmartSuggestions(profile), [profile]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCalculate = () => {
    triggerHaptic('success');
    localStorage.setItem('fintrack_user_investor_profile', JSON.stringify(profile));
    setHasCalculated(true);
  };

  const handleReset = () => {
    triggerHaptic('light');
    setHasCalculated(false);
    setStep(1);
  };

  return (
    <div className="discovery-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="discovery-modal-card plan-modal-wide"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="discovery-modal-header">
          <div className="plan-header-title-wrap">
            <div className="plan-icon-badge">
              <Compass size={22} className="text-primary" />
            </div>
            <div>
              <h2>Personalized Investment & Protection Plan</h2>
              <p className="modal-subtitle">
                {hasCalculated
                  ? 'Your customized 8-step roadmap & transparent product rankings'
                  : `Step ${step} of 4: Discover your ideal starting sequence from zero`}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="discovery-modal-close"
            onClick={onClose}
            aria-label="Close Plan Dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Question Steps or Results View */}
        <div className="discovery-modal-body">
          {!hasCalculated ? (
            <div className="wizard-step-container">
              {/* Step indicator */}
              <div className="wizard-step-progress">
                {[1, 2, 3, 4].map(num => (
                  <div
                    key={num}
                    className={`step-bubble ${step === num ? 'active' : step > num ? 'completed' : ''}`}
                  >
                    <span>{step > num ? '✓' : num}</span>
                  </div>
                ))}
              </div>

              {/* Step 1: Cash Flow & Debt */}
              {step === 1 && (
                <div className="wizard-step-content">
                  <h3>Financial Foundation & Liabilities</h3>
                  <p className="step-explainer">
                    Let's understand your foundation. High-interest debt (such as unpaid credit cards or personal loans) must always be resolved before investing.
                  </p>

                  <div className="plan-field-group">
                    <label className="plan-label">Do you have a regular monthly income?</label>
                    <div className="plan-toggle-row">
                      <button
                        type="button"
                        className={`plan-toggle-btn ${profile.hasRegularIncome ? 'active' : ''}`}
                        onClick={() => setProfile({ ...profile, hasRegularIncome: true })}
                      >
                        Yes, Salaried / Steady Business
                      </button>
                      <button
                        type="button"
                        className={`plan-toggle-btn ${!profile.hasRegularIncome ? 'active' : ''}`}
                        onClick={() => setProfile({ ...profile, hasRegularIncome: false })}
                      >
                        Irregular / Freelance / Gig
                      </button>
                    </div>
                  </div>

                  <div className="plan-fields-dual">
                    <div className="plan-field-group">
                      <label className="plan-label">Monthly Inflow (₹ Approx, Optional)</label>
                      <input
                        type="number"
                        className="plan-input"
                        placeholder="e.g. 60000"
                        value={profile.monthlyIncome || ''}
                        onChange={e => setProfile({ ...profile, monthlyIncome: Number(e.target.value) || null })}
                      />
                    </div>
                    <div className="plan-field-group">
                      <label className="plan-label">Monthly Essential Expenses (₹ Approx)</label>
                      <input
                        type="number"
                        className="plan-input"
                        placeholder="e.g. 35000"
                        value={profile.monthlyExpenses || ''}
                        onChange={e => setProfile({ ...profile, monthlyExpenses: Number(e.target.value) || null })}
                      />
                    </div>
                  </div>

                  <div className="plan-field-group highlight-danger-box">
                    <label className="plan-label text-bold">
                      Do you have high-interest debt? (Credit cards with rolled-over balances or personal loans @ 14%+)
                    </label>
                    <div className="plan-toggle-row">
                      <button
                        type="button"
                        className={`plan-toggle-btn ${!profile.hasHighInterestDebt ? 'active-good' : ''}`}
                        onClick={() => setProfile({ ...profile, hasHighInterestDebt: false })}
                      >
                        No high-interest debt (Good!)
                      </button>
                      <button
                        type="button"
                        className={`plan-toggle-btn ${profile.hasHighInterestDebt ? 'active-danger' : ''}`}
                        onClick={() => setProfile({ ...profile, hasHighInterestDebt: true })}
                      >
                        Yes, I have high-interest debt
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Emergency Savings & Protection */}
              {step === 2 && (
                <div className="wizard-step-content">
                  <h3>Safety Cushion & Insurance Defense</h3>
                  <p className="step-explainer">
                    Investment returns take years to compound. Without insurance and emergency runway, sudden medical bills or disruptions will destroy your progress.
                  </p>

                  <div className="plan-field-group">
                    <label className="plan-label">How many months of essential living expenses are saved in liquid bank/cash?</label>
                    <div className="plan-options-grid">
                      {[
                        { val: 0, label: '0 Months (No buffer)' },
                        { val: 2, label: '1 - 2 Months (Low buffer)' },
                        { val: 4, label: '3 - 5 Months (Good foundation)' },
                        { val: 6, label: '6+ Months (Fully fortified)' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          className={`plan-grid-card ${profile.emergencyMonths === opt.val ? 'selected' : ''}`}
                          onClick={() => setProfile({ ...profile, emergencyMonths: opt.val })}
                        >
                          <strong>{opt.label}</strong>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="plan-fields-dual">
                    <div className="plan-field-group">
                      <label className="plan-label">Do you have financial dependents?</label>
                      <div className="plan-toggle-row">
                        <button
                          type="button"
                          className={`plan-toggle-btn ${profile.hasDependents ? 'active' : ''}`}
                          onClick={() => setProfile({ ...profile, hasDependents: true })}
                        >
                          Yes (Family depends on me)
                        </button>
                        <button
                          type="button"
                          className={`plan-toggle-btn ${!profile.hasDependents ? 'active' : ''}`}
                          onClick={() => setProfile({ ...profile, hasDependents: false })}
                        >
                          No dependents
                        </button>
                      </div>
                    </div>

                    <div className="plan-field-group">
                      <label className="plan-label">Do you have adequate Health Insurance?</label>
                      <div className="plan-toggle-row">
                        <button
                          type="button"
                          className={`plan-toggle-btn ${profile.hasHealthInsurance ? 'active-good' : ''}`}
                          onClick={() => setProfile({ ...profile, hasHealthInsurance: true })}
                        >
                          Yes (Personal / Family Floater)
                        </button>
                        <button
                          type="button"
                          className={`plan-toggle-btn ${!profile.hasHealthInsurance ? 'active-danger' : ''}`}
                          onClick={() => setProfile({ ...profile, hasHealthInsurance: false })}
                        >
                          No / Employer Only
                        </button>
                      </div>
                    </div>
                  </div>

                  {profile.hasDependents && (
                    <div className="plan-field-group">
                      <label className="plan-label">Do you have Pure Term Life Insurance (10x-20x annual income)?</label>
                      <div className="plan-toggle-row">
                        <button
                          type="button"
                          className={`plan-toggle-btn ${profile.hasTermInsurance ? 'active-good' : ''}`}
                          onClick={() => setProfile({ ...profile, hasTermInsurance: true })}
                        >
                          Yes, have Term cover
                        </button>
                        <button
                          type="button"
                          className={`plan-toggle-btn ${!profile.hasTermInsurance ? 'active-danger' : ''}`}
                          onClick={() => setProfile({ ...profile, hasTermInsurance: false })}
                        >
                          No term insurance
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Horizon & Goal */}
              {step === 3 && (
                <div className="wizard-step-content">
                  <h3>Investment Time Horizon & Goals</h3>
                  <p className="step-explainer">
                    Matching your time horizon to the right asset class is the single most important rule in investing.
                  </p>

                  <div className="plan-field-group">
                    <label className="plan-label">When will you need this money?</label>
                    <div className="plan-options-grid">
                      {[
                        { val: 'short', title: 'Short Term (<1 Year)', desc: 'Vacation, tax bill, emergency fund' },
                        { val: 'medium', title: 'Medium Term (1 - 4 Years)', desc: 'Car purchase, wedding, home down payment' },
                        { val: 'long', title: 'Long Term (5+ Years)', desc: 'Wealth compounding, retirement, financial freedom' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          className={`plan-grid-card ${profile.timeHorizon === opt.val ? 'selected' : ''}`}
                          onClick={() => setProfile({ ...profile, timeHorizon: opt.val })}
                        >
                          <strong>{opt.title}</strong>
                          <small>{opt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-label">What is your primary financial goal?</label>
                    <select
                      className="plan-select"
                      value={profile.primaryGoal}
                      onChange={e => setProfile({ ...profile, primaryGoal: e.target.value })}
                    >
                      <option value="wealth_growth">Long-Term Wealth Growth (Outpace Inflation)</option>
                      <option value="tax_saving">Tax Optimization (Section 80C & 80CCD)</option>
                      <option value="emergency_cushion">Build Safe Emergency Runway</option>
                      <option value="retirement">Retirement Corpus (NPS / Pension)</option>
                      <option value="child_education">Child's Higher Education</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 4: Risk Appetite & Amount */}
              {step === 4 && (
                <div className="wizard-step-content">
                  <h3>Risk Appetite & Monthly Allocation</h3>
                  <p className="step-explainer">
                    How comfortable are you with short-term market fluctuations in exchange for higher potential long-term returns?
                  </p>

                  <div className="plan-field-group">
                    <label className="plan-label">Your Risk Tolerance</label>
                    <div className="plan-options-grid">
                      {[
                        { val: 'conservative', title: 'Conservative (Low Risk)', desc: 'Preserve capital. Cannot tolerate market drops. Prefer FDs & G-Secs.' },
                        { val: 'moderate', title: 'Moderate (Balanced)', desc: 'Accept mild drops (10-15%) for balanced inflation-beating growth.' },
                        { val: 'aggressive', title: 'Aggressive (High Growth)', desc: 'Comfortable with bear markets (20-30% drops) to maximize 7+ year compounding.' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          className={`plan-grid-card ${profile.riskTolerance === opt.val ? 'selected' : ''}`}
                          onClick={() => setProfile({ ...profile, riskTolerance: opt.val })}
                        >
                          <strong>{opt.title}</strong>
                          <small>{opt.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="plan-field-group">
                    <label className="plan-label">Comfortable Monthly Investable Amount (₹)</label>
                    <input
                      type="number"
                      className="plan-input"
                      placeholder="e.g. 5000"
                      value={profile.monthlyInvestableAmount || ''}
                      onChange={e => setProfile({ ...profile, monthlyInvestableAmount: Number(e.target.value) || 0 })}
                    />
                    <small className="field-hint">
                      Start with what you can comfortably sustain every month without stress. You can begin an SIP from as low as ₹100 or digital gold from ₹10.
                    </small>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results View */
            <div className="plan-results-container">
              {/* Profile Summary Strip */}
              <div className="plan-summary-strip">
                <div className="summary-pill">
                  <span>Horizon:</span>
                  <strong>{profile.timeHorizon === 'long' ? '5+ Years' : profile.timeHorizon === 'medium' ? '1-4 Years' : '<1 Year'}</strong>
                </div>
                <div className="summary-pill">
                  <span>Risk Appetite:</span>
                  <strong className="capitalize">{profile.riskTolerance}</strong>
                </div>
                <div className="summary-pill">
                  <span>Emergency Runway:</span>
                  <strong>{profile.emergencyMonths} Months</strong>
                </div>
                <div className="summary-pill">
                  <span>Monthly Target:</span>
                  <strong>₹{profile.monthlyInvestableAmount?.toLocaleString('en-IN') || 0}</strong>
                </div>
                <button type="button" className="plan-edit-btn" onClick={handleReset}>
                  <RotateCcw size={14} />
                  <span>Modify Answers</span>
                </button>
              </div>

              {/* Tab Switcher: Roadmap vs Ranked Suggestions */}
              <div className="plan-tabs-row">
                <button
                  type="button"
                  className={`plan-tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
                  onClick={() => setActiveTab('roadmap')}
                >
                  <Layers size={16} />
                  <span>Your 8-Step Financial Roadmap</span>
                </button>
                <button
                  type="button"
                  className={`plan-tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('suggestions')}
                >
                  <Sparkles size={16} />
                  <span>Personalized Product Suggestions ({suggestions.length})</span>
                </button>
              </div>

              {/* View 1: 8-Step Roadmap */}
              {activeTab === 'roadmap' && (
                <div className="roadmap-timeline-wrap">
                  <div className="roadmap-disclaimer-banner">
                    <Info size={18} />
                    <span>
                      This roadmap follows time-tested financial engineering: fortify cash flow & debt first, build liquidity, shield against catastrophe, and only then invest in wealth compounding assets.
                    </span>
                  </div>

                  <div className="roadmap-steps-list">
                    {roadmap.map(item => (
                      <div
                        key={item.stepNumber}
                        className={`roadmap-step-card status-${item.status}`}
                      >
                        <div className="step-card-header">
                          <div className="step-num-badge">Step {item.stepNumber}</div>
                          <div className="step-title-box">
                            <h4>{item.title}</h4>
                            <span className="step-cat-label">{item.category}</span>
                          </div>
                          <div className={`step-status-pill status-pill-${item.status}`}>
                            {item.status === 'completed' && '✓ Completed'}
                            {item.status === 'critical_action' && '⚠ Priority Action'}
                            {item.status === 'in_progress' && '⏳ In Progress'}
                            {item.status === 'recommended' && '💡 Recommended'}
                            {item.status === 'action_required' && '⚡ Action Required'}
                            {item.status === 'ongoing' && '🔄 Ongoing'}
                          </div>
                        </div>

                        <p className="step-rationale">{item.rationale}</p>

                        <div className="step-actions-box">
                          <strong>Key Action Items:</strong>
                          <ul>
                            {item.actionItems.map((act, idx) => (
                              <li key={idx}>{act}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="step-target-footer">
                          <span>Target Outcome:</span>
                          <strong>{item.estimatedTarget}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 2: Ranked Suggestions */}
              {activeTab === 'suggestions' && (
                <div className="plan-suggestions-wrap">
                  <div className="suggestions-intro-text">
                    Ranked strictly using your stated goals, horizon, cash flow, and risk tolerance. No sponsored products or fabricated returns.
                  </div>

                  <div className="suggestions-cards-grid">
                    {suggestions.map((sug, idx) => (
                      <div key={sug.categoryId} className="suggestion-detail-card">
                        <div className="suggestion-card-top">
                          <div className="sug-rank-badge">#{idx + 1} Best Fit</div>
                          <div className="sug-match-pill">{sug.matchScore}% Profile Match</div>
                          <div className="sug-priority-label">{sug.priority}</div>
                        </div>

                        <h3>{sug.title}</h3>

                        <div className="sug-why-box">
                          <strong>Why it appears for you:</strong>
                          <p>{sug.whyAppears}</p>
                        </div>

                        <div className="sug-pros-cons-grid">
                          <div className="sug-pro-col">
                            <span className="col-header text-success">Main Benefits:</span>
                            <ul>
                              {sug.keyBenefits.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="sug-con-col">
                            <span className="col-header text-danger">Risks & Limitations:</span>
                            <ul>
                              {sug.importantRisks.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="sug-meta-row">
                          <div>
                            <span className="meta-sub">Fees & Liquidity:</span>
                            <span className="meta-val">{sug.feesAndLimitations}</span>
                          </div>
                          <div>
                            <span className="meta-sub">When Unsuitable:</span>
                            <span className="meta-val text-warning">{sug.whenUnsuitable}</span>
                          </div>
                        </div>

                        <div className="sug-card-actions">
                          <button
                            type="button"
                            className="sug-explore-btn"
                            onClick={() => {
                              onClose();
                              onSelectCategory?.(sug.categoryId);
                            }}
                          >
                            <span>Explore Category Products</span>
                            <ArrowRight size={16} />
                          </button>
                          <a
                            href={sug.officialPortal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sug-direct-link"
                          >
                            <span>{sug.providerLabel}</span>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        {!hasCalculated && (
          <div className="discovery-modal-footer">
            {step > 1 ? (
              <button
                type="button"
                className="plan-nav-btn btn-secondary"
                onClick={() => setStep(s => s - 1)}
              >
                <ChevronLeft size={18} />
                <span>Previous</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                className="plan-nav-btn btn-primary"
                onClick={() => setStep(s => s + 1)}
              >
                <span>Continue</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="plan-nav-btn btn-success"
                onClick={handleCalculate}
              >
                <Sparkles size={18} />
                <span>Generate My Personalized Plan</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
