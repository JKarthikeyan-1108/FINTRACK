// src/pages/ExploreInvestmentsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Compass,
  Bookmark,
  ShieldCheck,
  TrendingUp,
  SlidersHorizontal,
  ArrowRight,
  Calculator,
  ExternalLink,
  RotateCcw,
  Info,
  CheckCircle2,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  INVESTMENT_CATEGORIES,
  FILTER_OPTIONS,
} from '../data/investmentDiscoveryData';
import InvestmentCategoryCard from '../components/investments/InvestmentCategoryCard';
import CategoryDetailModal from '../components/investments/CategoryDetailModal';
import PersonalizedPlanModal from '../components/investments/PersonalizedPlanModal';
import DiscoveryWatchlistDrawer from '../components/investments/DiscoveryWatchlistDrawer';
import { InvestmentHeroIllustration } from '../components/investments/CategoryIllustrations';
import { triggerHaptic } from '../lib/haptics';

export default function ExploreInvestmentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  // Watchlist stored in localStorage (strictly separate from real portfolio holdings)
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fintrack_discovery_watchlist') || '[]');
    } catch {
      return [];
    }
  });

  // Check URL query params for direct category links (e.g. ?cat=gold-silver or ?plan=true)
  useEffect(() => {
    const catParam = searchParams.get('cat');
    if (catParam) {
      const match = INVESTMENT_CATEGORIES.find(c => c.id === catParam);
      if (match) setSelectedCategory(match);
    }
    if (searchParams.get('plan') === 'true') {
      setIsPlanModalOpen(true);
    }
  }, [searchParams]);

  // Filter and Search computation
  const filteredCategories = useMemo(() => {
    let result = INVESTMENT_CATEGORIES;

    // Filter by type
    if (activeFilter !== 'all') {
      if (activeFilter === 'low-risk') {
        result = result.filter(c => c.riskLevel === 'low');
      } else if (activeFilter === 'moderate-risk') {
        result = result.filter(c => c.riskLevel === 'moderate');
      } else if (activeFilter === 'high-risk') {
        result = result.filter(c => c.riskLevel === 'high');
      } else if (activeFilter === 'short-term') {
        result = result.filter(c => c.horizon.toLowerCase().includes('short') || c.id === 'emergency-savings' || c.id === 'fixed-deposits');
      } else if (activeFilter === 'long-term') {
        result = result.filter(c => c.horizon.toLowerCase().includes('long') || c.id === 'stocks' || c.id === 'retirement-pension' || c.id === 'mutual-funds');
      } else if (activeFilter === 'tax-saving') {
        result = result.filter(c => c.taxBenefit);
      } else if (activeFilter === 'insurance') {
        result = result.filter(c => c.id === 'lic-life-insurance' || c.id === 'health-insurance');
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const matchesCategory =
          c.title.toLowerCase().includes(q) ||
          c.shortDesc.toLowerCase().includes(q) ||
          c.tags.some(t => t.toLowerCase().includes(q));

        const matchesProduct = c.products?.some(p =>
          p.name.toLowerCase().includes(q) ||
          p.entityName.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q)
        );

        return matchesCategory || matchesProduct;
      });
    }

    return result;
  }, [activeFilter, searchQuery]);

  const isWatched = (productId) => {
    return watchlist.some(item => item.id === productId);
  };

  const handleOpenCategory = (cat) => {
    setSelectedCategory(cat);
    setSearchParams({ cat: cat.id });
  };

  const handleCloseCategory = () => {
    setSelectedCategory(null);
    setSearchParams({});
  };

  const scrollToCategories = () => {
    triggerHaptic('light');
    const el = document.getElementById('discovery-catalog-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="explore-page-container">
      {/* Top Context & Action Bar */}
      <div className="explore-top-bar">
        <div className="explore-title-group">
          <div className="explore-icon-circle">
            <Compass size={22} className="text-primary" />
          </div>
          <div>
            <h1>Explore & Suggest</h1>
            <p className="explore-subtitle">
              Verified Indian investment and financial protection discovery from zero
            </p>
          </div>
        </div>

        <div className="explore-top-actions">
          {/* Watchlist Counter Button */}
          <button
            type="button"
            className="explore-watchlist-btn"
            onClick={() => {
              triggerHaptic('selection');
              setIsWatchlistOpen(true);
            }}
            title="View Research Watchlist"
          >
            <Bookmark size={18} />
            <span>Watchlist</span>
            {watchlist.length > 0 && (
              <span className="watchlist-count-badge">{watchlist.length}</span>
            )}
          </button>

          {/* Personalized Plan CTA */}
          <button
            type="button"
            className="explore-plan-cta-btn"
            onClick={() => {
              triggerHaptic('selection');
              setIsPlanModalOpen(true);
            }}
          >
            <Sparkles size={17} />
            <span>Get Personalized Plan</span>
          </button>
        </div>
      </div>

      {/* Hero Banner Section */}
      <section className="explore-hero-card">
        <div className="hero-content-col">
          <span className="hero-pill-badge">
            <ShieldCheck size={14} className="text-primary" />
            100% Genuine Regulators & Official Platforms
          </span>
          <h2 className="hero-heading">Build a Brighter Financial Future</h2>
          <p className="hero-description">
            Explore, compare, and learn about investment and financial protection options tailored for Indian investors. Start from zero with verified official links, transparent fee disclosures, and zero sales bias.
          </p>

          <div className="hero-actions-row">
            <button
              type="button"
              className="hero-primary-btn"
              onClick={() => {
                triggerHaptic('selection');
                setIsPlanModalOpen(true);
              }}
            >
              <Sparkles size={18} />
              <span>Get Personalized Suggestions</span>
            </button>
            <button
              type="button"
              className="hero-secondary-btn"
              onClick={scrollToCategories}
            >
              <span>Explore Categories</span>
              <ChevronRight size={17} />
            </button>
          </div>

          {/* Value Proposition Micro-Grid */}
          <div className="hero-features-bar">
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-success" />
              <span>Beginner Friendly</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-success" />
              <span>Compare Options</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-success" />
              <span>Verified Provider Links</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-success" />
              <span>Personalized Guidance</span>
            </div>
          </div>
        </div>

        {/* Hero Vector Graphic */}
        <div className="hero-art-col">
          <InvestmentHeroIllustration className="hero-vector-display" />
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="explore-controls-section" id="discovery-catalog-grid">
        <div className="explore-search-input-wrap">
          <Search size={18} className="search-lead-icon" />
          <input
            type="text"
            className="explore-search-input"
            placeholder="Search investments, providers, SIP, IPO, gold, LIC, health, NPS..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear Search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chips Bar */}
        <div className="filter-chips-scroll" role="tablist">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.id}
              type="button"
              className={`filter-chip-btn ${activeFilter === opt.id ? 'active' : ''}`}
              onClick={() => {
                triggerHaptic('selection');
                setActiveFilter(opt.id);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Categories Grid (12 Categories) */}
      <section className="explore-catalog-section">
        <div className="catalog-status-header">
          <h3>
            Investment Categories ({filteredCategories.length} of {INVESTMENT_CATEGORIES.length})
          </h3>
          {activeFilter !== 'all' || searchQuery ? (
            <button
              type="button"
              className="reset-filters-link"
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
            >
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          ) : null}
        </div>

        {filteredCategories.length === 0 ? (
          <div className="discovery-empty-state">
            <Info size={44} className="empty-state-icon" />
            <h4>No Categories Matching "{searchQuery}"</h4>
            <p>Try searching for terms like "Gold", "LIC", "SIP", "FD", "IPO", or "NPS".</p>
            <button
              type="button"
              className="empty-state-btn"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
            >
              Clear Search & Show All
            </button>
          </div>
        ) : (
          <div className="discovery-grid-layout">
            {filteredCategories.map(category => (
              <InvestmentCategoryCard
                key={category.id}
                category={category}
                onExplore={handleOpenCategory}
              />
            ))}
          </div>
        )}
      </section>

      {/* Supporting Calculators & Planning Quick Links */}
      <section className="explore-calculators-banner">
        <div className="calc-banner-header">
          <div className="calc-badge-row">
            <Calculator size={18} className="text-primary" />
            <h4>Interactive Financial Calculators</h4>
          </div>
          <p>
            Project your wealth compounding, loan EMIs, and monthly SIP requirements before committing capital.
          </p>
        </div>

        <div className="calc-shortcuts-grid">
          <div
            className="calc-shortcut-card"
            onClick={() => navigate('/calculators')}
            role="button"
            tabIndex={0}
          >
            <h5>SIP & Wealth Compounding</h5>
            <p>Calculate future value with rupee cost averaging and inflation adjustment.</p>
            <span className="calc-card-link">
              Launch SIP Engine <ArrowRight size={14} />
            </span>
          </div>

          <div
            className="calc-shortcut-card"
            onClick={() => navigate('/calculators')}
            role="button"
            tabIndex={0}
          >
            <h5>Fixed Deposit & Simple Interest</h5>
            <p>Determine quarterly compounding yield, maturity payouts, and DICGC limits.</p>
            <span className="calc-card-link">
              Launch FD Calculator <ArrowRight size={14} />
            </span>
          </div>

          <div
            className="calc-shortcut-card"
            onClick={() => navigate('/calculators')}
            role="button"
            tabIndex={0}
          >
            <h5>Tax Optimizer & Regime Engine</h5>
            <p>Compare Old vs New Tax Regime with 80C, 80D, and 80CCD deductions.</p>
            <span className="calc-card-link">
              Compare Tax Slabs <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </section>

      {/* Category Deep Detail Modal */}
      <CategoryDetailModal
        category={selectedCategory}
        isOpen={Boolean(selectedCategory)}
        onClose={handleCloseCategory}
        onWatchlistChange={setWatchlist}
        isWatchedFn={isWatched}
      />

      {/* Interactive Personalized Investment Plan Modal */}
      <PersonalizedPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSelectCategory={catId => {
          const match = INVESTMENT_CATEGORIES.find(c => c.id === catId);
          if (match) setSelectedCategory(match);
        }}
      />

      {/* Research Watchlist Drawer */}
      <DiscoveryWatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        watchlist={watchlist}
        onUpdateWatchlist={setWatchlist}
      />
    </div>
  );
}
