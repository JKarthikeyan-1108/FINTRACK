// src/components/investments/DiscoveryWatchlistDrawer.jsx
import React from 'react';
import {
  X,
  Bookmark,
  Trash2,
  ExternalLink,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { triggerHaptic } from '../../lib/haptics';

export default function DiscoveryWatchlistDrawer({
  isOpen,
  onClose,
  watchlist = [],
  onUpdateWatchlist,
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleRemove = (productId) => {
    triggerHaptic('light');
    const updated = watchlist.filter(item => item.id !== productId);
    localStorage.setItem('fintrack_discovery_watchlist', JSON.stringify(updated));
    onUpdateWatchlist?.(updated);
    toast.success('Removed from discovery watchlist');
  };

  const handleClearAll = () => {
    triggerHaptic('medium');
    localStorage.removeItem('fintrack_discovery_watchlist');
    onUpdateWatchlist?.([]);
    toast.success('Watchlist cleared');
  };

  return (
    <div className="discovery-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="discovery-drawer-panel"
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <Bookmark size={20} className="text-primary" />
            <div>
              <h3>Research Watchlist ({watchlist.length})</h3>
              <small className="text-muted">Separate from your actual portfolio holdings</small>
            </div>
          </div>
          <button
            type="button"
            className="discovery-modal-close"
            onClick={onClose}
            aria-label="Close Watchlist Drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {watchlist.length === 0 ? (
            <div className="drawer-empty-state">
              <Bookmark size={40} className="empty-icon" />
              <h4>Your Watchlist is Empty</h4>
              <p>
                Browse categories and bookmark genuine investment or insurance products to keep track of options you are researching.
              </p>
            </div>
          ) : (
            <div className="drawer-items-list">
              {watchlist.map(item => (
                <div key={item.id} className="drawer-item-card">
                  <div className="item-card-top">
                    <div>
                      <span className="item-cat-badge">{item.categoryTitle || 'Investment'}</span>
                      <h4 className="item-title">{item.name}</h4>
                      <small className="item-entity">{item.entityName}</small>
                    </div>
                    <button
                      type="button"
                      className="item-remove-btn"
                      onClick={() => handleRemove(item.id)}
                      title="Remove from Watchlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="item-specs-strip">
                    <span>Min: {item.minInvestment}</span>
                    <span>•</span>
                    <span className="text-truncate">{item.liquidity}</span>
                  </div>

                  <div className="item-actions-row">
                    <a
                      href={item.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="drawer-action-link"
                    >
                      <span>Official Portal</span>
                      <ExternalLink size={13} />
                    </a>
                    <button
                      type="button"
                      className="drawer-portfolio-btn"
                      onClick={() => {
                        onClose();
                        navigate('/investments');
                      }}
                    >
                      <span>Add to My Portfolio</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {watchlist.length > 0 && (
          <div className="drawer-footer">
            <button
              type="button"
              className="drawer-clear-btn"
              onClick={handleClearAll}
            >
              Clear Watchlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
