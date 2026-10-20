// src/components/investments/InvestmentCategoryCard.jsx
import React from 'react';
import { ArrowRight, ShieldCheck, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { CATEGORY_ILLUSTRATION_MAP } from './CategoryIllustrations';
import { triggerHaptic } from '../../lib/haptics';

export default function InvestmentCategoryCard({
  category,
  onExplore,
  featured = false,
}) {
  const {
    id,
    title,
    shortDesc,
    risk,
    riskLevel,
    minAmount,
    horizon,
    badge,
    tags = [],
    accentColor,
    products = [],
  } = category;

  const IllustrationComponent = CATEGORY_ILLUSTRATION_MAP[id];

  const handleClick = () => {
    triggerHaptic('selection');
    onExplore?.(category);
  };

  return (
    <div
      className={`discovery-category-card ${featured ? 'card-featured' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Explore ${title} investment category`}
    >
      {/* 16:9 Aspect Ratio Illustration Banner */}
      <div className="card-illustration-wrap">
        {IllustrationComponent ? (
          <IllustrationComponent className="card-vector-art" />
        ) : (
          <div className="card-art-fallback" style={{ backgroundColor: accentColor || '#2563eb' }}>
            <TrendingUp size={36} />
          </div>
        )}
        {badge && <span className="card-top-badge">{badge}</span>}
      </div>

      {/* Card Content Area */}
      <div className="card-body-content">
        <div className="card-meta-top">
          <span className={`card-risk-pill risk-${riskLevel}`}>{risk}</span>
          <span className="card-horizon-tag">{horizon}</span>
        </div>

        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{shortDesc}</p>

        {/* Feature Badges / Tags */}
        <div className="card-tags-row">
          <span className="card-spec-badge">Min: {minAmount}</span>
          <span className="card-spec-badge">{products.length} Products</span>
        </div>

        {/* Card Footer Action */}
        <div className="card-footer-action">
          <span className="action-text">Explore & Compare</span>
          <div className="action-circle-icon">
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
