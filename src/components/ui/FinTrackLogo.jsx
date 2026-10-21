import React from 'react';

/**
 * FinTrackLogo
 * Sovereign Wealth & Financial Intelligence Mark
 * 
 * Features:
 * - Dynamic geometric monogram combining compounding upward growth curve + diamond wealth facet
 * - Emerald & Crimson-Wine luminous gradients
 * - Scalable from 20px micro-favicons to 256px showcase badges
 */
export default function FinTrackLogo({
  size = 32,
  className = '',
  style = {},
  glow = false,
  showText = false,
  textStyle = {},
}) {
  return (
    <div
      className={`fintrack-logo-wrapper ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.max(8, Math.round(size * 0.28)),
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: glow ? 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.28))' : 'none',
          flexShrink: 0,
          borderRadius: Math.round(size * 0.26),
        }}
        aria-label="FinTrack Logo"
      >
        <defs>
          {/* Base squircle gradient */}
          <linearGradient id="ftBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A1320" />
            <stop offset="55%" stopColor="#250912" />
            <stop offset="100%" stopColor="#120409" />
          </linearGradient>

          {/* Golden Emerald Growth Gradient */}
          <linearGradient id="ftGrowth" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E11D48" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>

          {/* Gem Facet Highlight */}
          <linearGradient id="ftFacet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
          </linearGradient>

          {/* Outer Border Stroke */}
          <linearGradient id="ftBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
            <stop offset="50%" stopColor="rgba(225, 29, 72, 0.4)" />
            <stop offset="100%" stopColor="rgba(16, 185, 129, 0.35)" />
          </linearGradient>

          {/* Ambient Glow */}
          <radialGradient id="ftOrb" cx="70%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#E11D48" stopOpacity="0.12" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Squircle Container */}
        <rect
          x="4"
          y="4"
          width="120"
          height="120"
          rx="32"
          fill="url(#ftBg)"
        />
        <rect
          x="4"
          y="4"
          width="120"
          height="120"
          rx="32"
          fill="url(#ftOrb)"
        />
        <rect
          x="4.5"
          y="4.5"
          width="119"
          height="119"
          rx="31.5"
          stroke="url(#ftBorder)"
          strokeWidth="1.5"
        />

        {/* 2. Geometric Asset Ledger Grid Lines (Subtle Architecture) */}
        <line x1="28" y1="92" x2="100" y2="92" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="3 3" />
        <line x1="28" y1="64" x2="100" y2="64" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* 3. Primary Compounding Growth Vector (Upward Curve + Facets) */}
        {/* Foundation Base Pillar */}
        <rect x="28" y="70" width="10" height="22" rx="4" fill="rgba(255, 255, 255, 0.22)" />
        <rect x="44" y="52" width="10" height="40" rx="4" fill="rgba(255, 255, 255, 0.38)" />
        <rect x="60" y="40" width="10" height="52" rx="4" fill="url(#ftGrowth)" fillOpacity="0.65" />

        {/* Dynamic Continuous Rising Ribbon ("F" & Trend) */}
        <path
          d="M 28 86 Q 44 82 56 62 T 84 34 L 98 24"
          fill="none"
          stroke="url(#ftGrowth)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Precision Arrow Head / Wealth Peak */}
        <path
          d="M 76 24 H 98 V 46"
          fill="none"
          stroke="#34D399"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4. Top-Right Investment Diamond Star (Yield Facet) */}
        <path
          d="M 98 24 L 105 17 L 98 10 L 91 17 Z"
          fill="#34D399"
        />
        <circle cx="98" cy="24" r="3.5" fill="#FFFFFF" />

        {/* 5. Sovereign Capital Core Dot */}
        <circle cx="56" cy="62" r="4.5" fill="#F59E0B" />
        <circle cx="28" cy="86" r="4" fill="#E11D48" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', ...textStyle }}>
          <span
            style={{
              fontSize: `${Math.round(size * 0.54)}px`,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'var(--text, #1E0C13)',
            }}
          >
            FinTrack
          </span>
          <span
            style={{
              fontSize: `${Math.max(10, Math.round(size * 0.24))}px`,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--brand-primary, #E11D48)',
              marginTop: -2,
            }}
          >
            Wealth Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
