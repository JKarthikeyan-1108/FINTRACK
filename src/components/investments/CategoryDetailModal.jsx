// src/components/investments/CategoryDetailModal.jsx
import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Lock,
  Layers,
  ArrowRight,
  TrendingUp,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CATEGORY_ILLUSTRATION_MAP } from './CategoryIllustrations';
import { triggerHaptic } from '../../lib/haptics';

export default function CategoryDetailModal({ category, isOpen, onClose, onWatchlistChange, isWatchedFn }) {
  if (!isOpen || !category) return null;

  const IllustrationComponent = CATEGORY_ILLUSTRATION_MAP[category.id];

  const handleToggleWatch = (product) => {
    triggerHaptic('medium');
    try {
      const saved = JSON.parse(localStorage.getItem('fintrack_discovery_watchlist') || '[]');
      const exists = saved.some(p => p.id === product.id);
      let updated;
      if (exists) {
        updated = saved.filter(p => p.id !== product.id);
        toast.success(`Removed ${product.name} from discovery watchlist`);
      } else {
        updated = [...saved, { ...product, categoryId: category.id, categoryTitle: category.title }];
        toast.success(`Saved ${product.name} to discovery watchlist`);
      }
      localStorage.setItem('fintrack_discovery_watchlist', JSON.stringify(updated));
      onWatchlistChange?.(updated);
    } catch (e) {
      toast.error('Failed to update watchlist');
    }
  };

  return (
    <div className="discovery-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="discovery-modal-card category-detail-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="discovery-modal-header">
          <div className="cat-modal-header-left">
            <span className="cat-type-pill">{category.categoryType}</span>
            <h2>{category.title}</h2>
          </div>
          <button
            type="button"
            className="discovery-modal-close"
            onClick={onClose}
            aria-label="Close Category Details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="discovery-modal-body">
          {/* 16:9 Category Vector Hero Banner */}
          <div className="cat-modal-banner-wrap">
            {IllustrationComponent ? (
              <IllustrationComponent className="cat-modal-hero-art" />
            ) : (
              <div className="cat-modal-art-fallback" style={{ backgroundColor: category.accentColor }}>
                <TrendingUp size={48} />
              </div>
            )}
            <div className="cat-modal-banner-badge">{category.badge}</div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="cat-modal-metrics-bar">
            <div className="metric-pill-item">
              <span className="pill-label">Risk Profile</span>
              <strong className={`pill-val risk-${category.riskLevel}`}>{category.risk}</strong>
            </div>
            <div className="metric-pill-item">
              <span className="pill-label">Horizon</span>
              <strong className="pill-val">{category.horizon}</strong>
            </div>
            <div className="metric-pill-item">
              <span className="pill-label">Starting Entry</span>
              <strong className="pill-val">{category.minAmount}</strong>
            </div>
            <div className="metric-pill-item">
              <span className="pill-label">Lock-in / Liquidity</span>
              <strong className="pill-val">{category.lockIn}</strong>
            </div>
          </div>

          {/* Detailed Beginner Guide */}
          <div className="cat-guide-section">
            <h3>Beginner-Friendly Explanation</h3>
            <p className="cat-full-desc">{category.fullDesc}</p>
            {category.regulatoryNote && (
              <div className="cat-regulatory-box">
                <ShieldCheck size={18} className="text-primary flex-shrink-0" />
                <span>
                  <strong>Regulatory Framework: </strong>
                  {category.regulatoryNote}
                </span>
              </div>
            )}
          </div>

          {/* Special Verification Callout for Gold & Silver Category */}
          {category.id === 'gold-silver' && (
            <div className="special-notice-card">
              <div className="notice-card-header">
                <AlertTriangle size={20} className="text-warning" />
                <h4>Important: Digital Gold vs SGB vs Gold ETFs</h4>
              </div>
              <p>
                <strong>Digital Gold (e.g. Aura Gold)</strong> is a convenient fintech micro-savings tool allowing you to buy from ₹10. However, it is an <em>unregulated fintech product</em> unbacked by SEBI or RBI, carries a 3% GST deduction on purchase, and has buy/sell spreads.
              </p>
              <p>
                In contrast, <strong>Sovereign Gold Bonds (SGBs)</strong> are sovereign debt issued directly by the Reserve Bank of India with an extra 2.50% annual interest and zero tax on maturity. <strong>Gold ETFs</strong> are SEBI-regulated exchange-traded mutual funds listed on NSE/BSE. Always select the right instrument for your time horizon.
              </p>
            </div>
          )}

          {/* Products Breakdown Section */}
          <div className="cat-products-section">
            <div className="section-header-row">
              <h3>Verified Instruments & Product Comparators ({category.products?.length || 0})</h3>
              <small className="text-muted">Direct Official Destinations Only</small>
            </div>

            <div className="products-stack-list">
              {category.products?.map(product => {
                const isWatched = isWatchedFn ? isWatchedFn(product.id) : false;

                return (
                  <div key={product.id} className="product-deep-card">
                    <div className="product-card-top">
                      <div className="product-title-group">
                        <div className="prod-name-row">
                          <h4>{product.name}</h4>
                          <span className="prod-type-tag">{product.type}</span>
                        </div>
                        <span className="prod-entity-text">
                          Issued / Managed by: <strong>{product.entityName}</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`watchlist-toggle-btn ${isWatched ? 'active' : ''}`}
                        onClick={() => handleToggleWatch(product)}
                        title={isWatched ? 'Remove from Watchlist' : 'Save to Research Watchlist'}
                      >
                        {isWatched ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        <span>{isWatched ? 'Saved' : 'Watchlist'}</span>
                      </button>
                    </div>

                    {/* Product Specs Grid */}
                    <div className="product-specs-grid">
                      <div className="spec-item">
                        <span className="spec-label">Min. Investment</span>
                        <span className="spec-val">{product.minInvestment}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Liquidity & Payout</span>
                        <span className="spec-val">{product.liquidity}</span>
                      </div>
                      <div className="spec-item full-span">
                        <span className="spec-label">Custody & Storage</span>
                        <span className="spec-val">{product.custodyStorage}</span>
                      </div>
                      <div className="spec-item full-span">
                        <span className="spec-label">Charges, Taxes & Spreads</span>
                        <span className="spec-val">{product.spreadCharges}</span>
                      </div>
                    </div>

                    {/* Pros & Cons */}
                    <div className="product-pros-cons">
                      <div className="pro-column">
                        <span className="pro-heading">Key Strengths:</span>
                        <ul>
                          {product.pros?.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="con-column">
                        <span className="con-heading">Risks & Considerations:</span>
                        <ul>
                          {product.cons?.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                          {product.riskFactors?.map((rf, i) => (
                            <li key={`rf-${i}`} className="text-warning-sub">{rf}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Verification and Link Footer */}
                    <div className="product-card-footer">
                      <div className="verification-status-box">
                        <CheckCircle2 size={15} className="text-success" />
                        <div>
                          <span className="status-title">{product.verificationStatus}</span>
                          <span className="status-sub">
                            Source: {product.source} • Updated {product.lastUpdated}
                          </span>
                        </div>
                      </div>

                      <div className="product-links-group">
                        {product.appStoreUrl && (
                          <a
                            href={product.appStoreUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="prod-link-btn btn-secondary"
                          >
                            <span>Google Play App</span>
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <a
                          href={product.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="prod-link-btn btn-primary"
                        >
                          <span>Visit Official Portal</span>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="discovery-modal-footer">
          <button
            type="button"
            className="plan-nav-btn btn-secondary"
            onClick={onClose}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
