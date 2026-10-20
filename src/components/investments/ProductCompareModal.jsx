// src/components/investments/ProductCompareModal.jsx
import React, { useState } from 'react';
import {
  X,
  Scale,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { INVESTMENT_CATEGORIES } from '../../data/investmentDiscoveryData';
import { triggerHaptic } from '../../lib/haptics';

// Flatten all products across all categories for universal comparison
const ALL_CATALOG_PRODUCTS = INVESTMENT_CATEGORIES.flatMap(cat =>
  (cat.products || []).map(prod => ({
    ...prod,
    categoryTitle: cat.title,
    categoryId: cat.id,
    risk: cat.risk,
    riskLevel: cat.riskLevel,
  }))
);

const PRESET_COMPARISONS = [
  {
    label: 'Precious Metals: Aura Gold vs SGB vs Gold ETF',
    productIds: ['aura-gold', 'sovereign-gold-bonds', 'gold-etfs'],
  },
  {
    label: 'Life Insurance: Pure Term Cover vs Traditional Endowment',
    productIds: ['pure-term-insurance', 'lic-endowment-distinction'],
  },
  {
    label: 'Fixed Income: Bank FD vs PPF vs RBI Retail Direct',
    productIds: ['scheduled-bank-fd', 'ppf-scheme', 'rbi-retail-direct'],
  },
  {
    label: 'Wealth Compounding: Index Fund vs Direct Bluechips',
    productIds: ['nifty-index-fund', 'nifty50-largecap'],
  },
];

export default function ProductCompareModal({
  isOpen,
  onClose,
  initialProductIds = ['aura-gold', 'sovereign-gold-bonds', 'gold-etfs'],
  onAddToPortfolio,
}) {
  const [selectedIds, setSelectedIds] = useState(initialProductIds);

  if (!isOpen) return null;

  const comparedProducts = selectedIds
    .map(id => ALL_CATALOG_PRODUCTS.find(p => p.id === id))
    .filter(Boolean);

  const handleSelectPreset = (preset) => {
    triggerHaptic('selection');
    setSelectedIds(preset.productIds);
  };

  const handleRemoveProduct = (id) => {
    triggerHaptic('light');
    if (selectedIds.length > 2) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    }
  };

  return (
    <div className="discovery-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="discovery-modal-card compare-modal-wide"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="discovery-modal-header">
          <div className="plan-header-title-wrap">
            <div className="plan-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Scale size={22} />
            </div>
            <div>
              <h2>Direct Financial Product Comparator</h2>
              <p className="modal-subtitle">
                Side-by-side analysis of costs, liquidity, taxation, and statutory protections
              </p>
            </div>
          </div>
          <button
            type="button"
            className="discovery-modal-close"
            onClick={onClose}
            aria-label="Close Comparison Dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="discovery-modal-body">
          {/* Quick Preset Selector Buttons */}
          <div className="compare-presets-bar">
            <span className="preset-label">Popular Comparisons:</span>
            <div className="preset-buttons-scroll">
              {PRESET_COMPARISONS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  className="preset-btn"
                  onClick={() => handleSelectPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="compare-table-wrapper">
            <table className="compare-matrix-table">
              <thead>
                <tr>
                  <th className="feature-col-th">Key Comparison Attribute</th>
                  {comparedProducts.map(prod => (
                    <th key={prod.id} className="product-col-th">
                      <div className="th-product-header">
                        <span className="th-cat-tag">{prod.categoryTitle}</span>
                        <h4>{prod.name}</h4>
                        <small>{prod.entityName}</small>
                        <span className={`th-risk-pill risk-${prod.riskLevel}`}>{prod.risk}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Product Type & Structure */}
                <tr>
                  <td className="feature-name">Legal Structure & Type</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <strong>{prod.type}</strong>
                    </td>
                  ))}
                </tr>

                {/* Regulatory Status */}
                <tr>
                  <td className="feature-name">Regulatory Oversight</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <div className="reg-status-cell">
                        {prod.id === 'aura-gold' ? (
                          <div className="badge-warning-pill">
                            <AlertTriangle size={14} />
                            <span>Unregulated Fintech (Vault Trust Deed)</span>
                          </div>
                        ) : (
                          <div className="badge-success-pill">
                            <ShieldCheck size={14} />
                            <span>{prod.verificationStatus}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Minimum Investment */}
                <tr>
                  <td className="feature-name">Minimum Investment</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <span className="spec-val-highlight">{prod.minInvestment}</span>
                    </td>
                  ))}
                </tr>

                {/* Costs, Spreads & Taxes */}
                <tr>
                  <td className="feature-name">Charges, Taxes & Friction</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <div className="cell-text-block">{prod.spreadCharges}</div>
                    </td>
                  ))}
                </tr>

                {/* Liquidity & Exit Window */}
                <tr>
                  <td className="feature-name">Liquidity & Exit Timing</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <div className="cell-text-block">{prod.liquidity}</div>
                    </td>
                  ))}
                </tr>

                {/* Custody & Counterparty Safety */}
                <tr>
                  <td className="feature-name">Custody & Default Risk</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <div className="cell-text-block">{prod.custodyStorage}</div>
                    </td>
                  ))}
                </tr>

                {/* Key Risk Factors */}
                <tr>
                  <td className="feature-name">Critical Risk Factors</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <ul className="compare-risks-list">
                        {prod.riskFactors?.map((rf, idx) => (
                          <li key={idx}>{rf}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Primary Pros */}
                <tr>
                  <td className="feature-name">Core Advantages</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <ul className="compare-pros-list">
                        {prod.pros?.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* Official Links & Actions */}
                <tr className="actions-row">
                  <td className="feature-name">Verified Actions</td>
                  {comparedProducts.map(prod => (
                    <td key={prod.id}>
                      <div className="compare-actions-cell">
                        <a
                          href={prod.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="compare-link-btn"
                        >
                          <span>Official Portal</span>
                          <ExternalLink size={13} />
                        </a>
                        <button
                          type="button"
                          className="compare-portfolio-btn"
                          onClick={() => {
                            onClose();
                            onAddToPortfolio?.(prod);
                          }}
                        >
                          <span>Track in Portfolio</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="discovery-modal-footer">
          <button
            type="button"
            className="plan-nav-btn btn-secondary"
            onClick={onClose}
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
