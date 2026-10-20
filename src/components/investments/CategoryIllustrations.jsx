// src/components/investments/CategoryIllustrations.jsx
import React from 'react';

/**
 * Premium 16:9 Vector Illustrations for FinTrack Investment Discovery
 * Designed with bespoke Swiss/Nordic fintech tones that dynamically adapt
 * to light and dark themes without harsh cyberpunk AI stickers.
 */

export function GoldSilverIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gs-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-gold-bg1, #fefce8)" />
          <stop offset="1" stopColor="var(--ill-gold-bg2, #fef08a)" />
        </linearGradient>
        <linearGradient id="gold-bar" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fef08a" />
          <stop offset="0.4" stopColor="#eab308" />
          <stop offset="1" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id="gold-bevel" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fde047" />
          <stop offset="1" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="silver-bar" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f8fafc" />
          <stop offset="0.5" stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <filter id="gs-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="16" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="640" height="360" fill="url(#gs-bg)" rx="16" />
      {/* Background radial glow */}
      <circle cx="320" cy="180" r="140" fill="#eab308" opacity="0.12" filter="url(#gs-glow)" />

      {/* Decorative background grid line */}
      <path d="M40 280 H600" stroke="#ca8a04" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="6 6" />

      {/* Silver Bar in background */}
      <g transform="translate(140, 160)">
        <polygon points="0,60 40,20 220,20 180,60" fill="url(#silver-bar)" opacity="0.9" />
        <polygon points="0,60 180,60 180,95 0,95" fill="#94a3b8" />
        <polygon points="180,60 220,20 220,55 180,95" fill="#64748b" />
        <text x="75" y="75" fill="#1e293b" fontSize="13" fontWeight="bold" letterSpacing="2">SILVER 999</text>
      </g>

      {/* Sovereign Gold Seal */}
      <g transform="translate(430, 90)">
        <circle cx="50" cy="50" r="44" fill="#854d0e" stroke="#facc15" strokeWidth="3" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#fde047" strokeWidth="1" strokeDasharray="3 3" />
        <text x="50" y="44" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="bold">RBI SGB</text>
        <text x="50" y="60" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="bold">+2.5% p.a.</text>
      </g>

      {/* Main Gold Ingots */}
      <g transform="translate(200, 110)">
        {/* Top Gold Ingot */}
        <polygon points="40,50 85,10 245,10 200,50" fill="url(#gold-bevel)" />
        <polygon points="40,50 200,50 200,90 40,90" fill="url(#gold-bar)" />
        <polygon points="200,50 245,10 245,50 200,90" fill="#a16207" />
        <text x="100" y="70" fill="#713f12" fontSize="14" fontWeight="800" letterSpacing="3">AU 999.9</text>
        <text x="110" y="84" fill="#854d0e" fontSize="9" fontWeight="bold">24K PURE</text>

        {/* Base Ingot */}
        <polygon points="0,110 50,70 210,70 160,110" fill="url(#gold-bevel)" />
        <polygon points="0,110 160,110 160,150 0,150" fill="url(#gold-bar)" />
        <polygon points="160,110 210,70 210,110 160,150" fill="#a16207" />
        <text x="60" y="130" fill="#713f12" fontSize="14" fontWeight="800" letterSpacing="3">FINE GOLD</text>
      </g>

      {/* Sparkles */}
      <path d="M130 90 L135 105 L150 110 L135 115 L130 130 L125 115 L110 110 L125 105 Z" fill="#eab308" opacity="0.9" />
      <path d="M480 230 L483 240 L493 243 L483 246 L480 256 L477 246 L467 243 L477 240 Z" fill="#eab308" opacity="0.7" />
    </svg>
  );
}

export function StocksIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="st-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-stocks-bg1, #f0f9ff)" />
          <stop offset="1" stopColor="var(--ill-stocks-bg2, #dbeafe)" />
        </linearGradient>
        <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#1d4ed8" stopOpacity="0.25" />
          <stop offset="1" stopColor="#1d4ed8" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#st-bg)" rx="16" />

      {/* Technical Grid lines */}
      <g stroke="var(--ill-stocks-grid, #cbd5e1)" strokeWidth="1" strokeDasharray="4 4" opacity="0.8">
        <line x1="80" y1="60" x2="560" y2="60" />
        <line x1="80" y1="120" x2="560" y2="120" />
        <line x1="80" y1="180" x2="560" y2="180" />
        <line x1="80" y1="240" x2="560" y2="240" />
        <line x1="160" y1="40" x2="160" y2="280" />
        <line x1="280" y1="40" x2="280" y2="280" />
        <line x1="400" y1="40" x2="400" y2="280" />
        <line x1="520" y1="40" x2="520" y2="280" />
      </g>

      {/* Chart Fill and Trendline */}
      <path d="M80 230 Q 180 210, 260 170 T 400 130 T 520 70 L 520 270 L 80 270 Z" fill="url(#chart-area)" />
      <path d="M80 230 Q 180 210, 260 170 T 400 130 T 520 70" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" />

      {/* Candlestick Markers */}
      <g transform="translate(180, 160)">
        <line x1="10" y1="0" x2="10" y2="50" stroke="#059669" strokeWidth="2" />
        <rect x="5" y="10" width="10" height="25" fill="#059669" rx="2" />
      </g>
      <g transform="translate(260, 130)">
        <line x1="10" y1="0" x2="10" y2="60" stroke="#059669" strokeWidth="2" />
        <rect x="5" y="15" width="10" height="30" fill="#059669" rx="2" />
      </g>
      <g transform="translate(340, 110)">
        <line x1="10" y1="0" x2="10" y2="45" stroke="#dc2626" strokeWidth="2" />
        <rect x="5" y="12" width="10" height="20" fill="#dc2626" rx="2" />
      </g>
      <g transform="translate(420, 80)">
        <line x1="10" y1="0" x2="10" y2="55" stroke="#059669" strokeWidth="2" />
        <rect x="5" y="10" width="10" height="28" fill="#059669" rx="2" />
      </g>

      {/* NSE / BSE Badges */}
      <rect x="420" y="35" width="120" height="32" rx="6" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="480" y="56" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold">NSE • NIFTY 50</text>
    </svg>
  );
}

export function IposIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ipo-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-ipo-bg1, #faf5ff)" />
          <stop offset="1" stopColor="var(--ill-ipo-bg2, #ede9fe)" />
        </linearGradient>
        <linearGradient id="ipo-pillar" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a855f7" />
          <stop offset="1" stopColor="#6b21a8" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#ipo-bg)" rx="16" />

      {/* Modern Financial Exchange Facade */}
      <g transform="translate(180, 80)">
        {/* Roof pediment */}
        <polygon points="140,20 20,60 260,60" fill="#9333ea" opacity="0.9" />
        {/* Architrave */}
        <rect x="20" y="60" width="240" height="18" fill="#7e22ce" rx="2" />
        <text x="140" y="74" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800" letterSpacing="4">STOCK EXCHANGE</text>
        {/* Classical Columns */}
        <rect x="40" y="80" width="22" height="110" fill="url(#ipo-pillar)" rx="3" />
        <rect x="95" y="80" width="22" height="110" fill="url(#ipo-pillar)" rx="3" />
        <rect x="160" y="80" width="22" height="110" fill="url(#ipo-pillar)" rx="3" />
        <rect x="215" y="80" width="22" height="110" fill="url(#ipo-pillar)" rx="3" />
        {/* Steps */}
        <rect x="10" y="190" width="260" height="15" fill="#6b21a8" rx="2" />
        <rect x="0" y="205" width="280" height="20" fill="#581c87" rx="2" />
      </g>

      {/* Floating IPO Bell & Tag */}
      <g transform="translate(380, 60)">
        <rect x="0" y="0" width="160" height="90" rx="12" fill="#581c87" stroke="#d8b4fe" strokeWidth="2" />
        <text x="80" y="32" textAnchor="middle" fill="#e9d5ff" fontSize="12" fontWeight="bold">NEW LISTING</text>
        <text x="80" y="60" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="900" letterSpacing="2">IPO</text>
        <text x="80" y="78" textAnchor="middle" fill="#d8b4fe" fontSize="10" fontWeight="bold">ASBA & UPI VERIFIED</text>
      </g>
    </svg>
  );
}

export function MutualFundsIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mf-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-mf-bg1, #fff1f2)" />
          <stop offset="1" stopColor="var(--ill-mf-bg2, #ffe4e6)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#mf-bg)" rx="16" />

      {/* Sprouting Wealth Plant */}
      <g transform="translate(140, 100)">
        {/* Pot */}
        <polygon points="50,140 110,140 100,190 60,190" fill="#be123c" opacity="0.9" />
        <rect x="45" y="132" width="70" height="10" rx="3" fill="#fb7185" />
        {/* Stacked Rupee Coins */}
        <ellipse cx="80" cy="120" rx="22" ry="7" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
        <ellipse cx="80" cy="110" rx="22" ry="7" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
        <ellipse cx="80" cy="100" rx="22" ry="7" fill="#fef08a" stroke="#d97706" strokeWidth="2" />
        {/* Stem */}
        <path d="M80 100 Q 75 50, 85 20" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
        {/* Leaves */}
        <path d="M80 60 Q 55 50, 60 30 Q 75 40, 80 50" fill="#10b981" />
        <path d="M82 45 Q 110 35, 105 15 Q 90 25, 84 35" fill="#047857" />
      </g>

      {/* Diversification Doughnut Chart */}
      <g transform="translate(380, 160)">
        <circle cx="0" cy="0" r="75" stroke="#be123c" strokeWidth="24" strokeDasharray="140 330" fill="none" />
        <circle cx="0" cy="0" r="75" stroke="#1d4ed8" strokeWidth="24" strokeDasharray="160 310" strokeDashoffset="-140" fill="none" />
        <circle cx="0" cy="0" r="75" stroke="#059669" strokeWidth="24" strokeDasharray="100 370" strokeDashoffset="-300" fill="none" />
        <circle cx="0" cy="0" r="75" stroke="#b45309" strokeWidth="24" strokeDasharray="71 399" strokeDashoffset="-400" fill="none" />
        <circle cx="0" cy="0" r="54" fill="var(--surface, #ffffff)" />
        <text x="0" y="-3" textAnchor="middle" fill="var(--text, #0f172a)" fontSize="16" fontWeight="bold">SIP</text>
        <text x="0" y="16" textAnchor="middle" fill="var(--text-muted, #475569)" fontSize="10">Direct Plan</text>
      </g>
    </svg>
  );
}

export function LicLifeIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lic-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-lic-bg1, #f0fdf4)" />
          <stop offset="1" stopColor="var(--ill-lic-bg2, #dcfce7)" />
        </linearGradient>
        <linearGradient id="shield-g" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#lic-bg)" rx="16" />

      {/* Large Protective Shield */}
      <g transform="translate(320, 170)">
        <path d="M0 -90 L90 -50 C90 35, 45 95, 0 120 C-45 95, -90 35, -90 -50 Z" fill="url(#shield-g)" opacity="0.95" />
        <path d="M0 -78 L75 -44 C75 28, 38 78, 0 102 C-38 78, -75 28, -75 -44 Z" fill="#064e3b" />
        {/* Family Silhouette Motif */}
        <circle cx="-25" cy="-20" r="12" fill="#a7f3d0" />
        <path d="M-40 18 C-40 -5, -10 -5, -10 18 Z" fill="#a7f3d0" />
        <circle cx="25" cy="-20" r="12" fill="#a7f3d0" />
        <path d="M10 18 C10 -5, 40 -5, 40 18 Z" fill="#a7f3d0" />
        <circle cx="0" cy="5" r="8" fill="#fef08a" />
        <path d="M-10 32 C-10 16, 10 16, 10 32 Z" fill="#fef08a" />
      </g>

      {/* Protection Badge */}
      <g transform="translate(120, 90)">
        <rect x="0" y="0" width="130" height="48" rx="8" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
        <text x="65" y="22" textAnchor="middle" fill="#6ee7b7" fontSize="11" fontWeight="bold">PURE TERM</text>
        <text x="65" y="38" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">₹1 CRORE+</text>
      </g>
    </svg>
  );
}

export function HealthInsuranceIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hi-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-health-bg1, #ecfeff)" />
          <stop offset="1" stopColor="var(--ill-health-bg2, #cffafe)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#hi-bg)" rx="16" />

      {/* Hospital ECG Pulse wave */}
      <path d="M60 180 H200 L220 140 L240 220 L260 110 L280 240 L300 170 L320 180 H580" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" opacity="0.5" />

      {/* Medical Cross Centerpiece */}
      <g transform="translate(320, 175)">
        <circle cx="0" cy="0" r="75" fill="#0e7490" stroke="#22d3ee" strokeWidth="3" />
        {/* Cross */}
        <rect x="-14" y="-45" width="28" height="90" fill="#ffffff" rx="6" />
        <rect x="-45" y="-14" width="90" height="28" fill="#ffffff" rx="6" />
      </g>

      {/* Cashless Card */}
      <g transform="translate(420, 80)">
        <rect x="0" y="0" width="140" height="80" rx="8" fill="#155e75" stroke="#67e8f9" strokeWidth="1.5" />
        <rect x="15" y="15" width="30" height="20" rx="4" fill="#facc15" />
        <text x="15" y="55" fill="#e0f2fe" fontSize="10" fontWeight="bold">CASHLESS TPA</text>
        <text x="15" y="68" fill="#67e8f9" fontSize="9">NETWORK HOSPITALS</text>
      </g>
    </svg>
  );
}

export function FixedDepositsIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fd-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-fd-bg1, #f0fdfa)" />
          <stop offset="1" stopColor="var(--ill-fd-bg2, #ccfbf1)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#fd-bg)" rx="16" />

      {/* Bank Building Vault */}
      <g transform="translate(240, 90)">
        <polygon points="80,10 0,45 160,45" fill="#0d9488" />
        <rect x="0" y="45" width="160" height="15" fill="#14b8a6" rx="2" />
        {/* Pillars */}
        <rect x="15" y="60" width="18" height="85" fill="#0f766e" rx="2" />
        <rect x="52" y="60" width="18" height="85" fill="#0f766e" rx="2" />
        <rect x="90" y="60" width="18" height="85" fill="#0f766e" rx="2" />
        <rect x="127" y="60" width="18" height="85" fill="#0f766e" rx="2" />
        <rect x="0" y="145" width="160" height="18" fill="#115e59" rx="2" />
      </g>

      {/* DICGC ₹5 Lakh Insurance Seal */}
      <g transform="translate(420, 110)">
        <circle cx="50" cy="50" r="44" fill="#134e4a" stroke="#5eead4" strokeWidth="2.5" />
        <text x="50" y="42" textAnchor="middle" fill="#99f6e4" fontSize="10" fontWeight="bold">DICGC INSURED</text>
        <text x="50" y="62" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">₹5,00,000</text>
        <text x="50" y="76" textAnchor="middle" fill="#5eead4" fontSize="9">PER BANK SAFETY</text>
      </g>
    </svg>
  );
}

export function GovernmentSecuritiesIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gsec-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-gsec-bg1, #f0f9ff)" />
          <stop offset="1" stopColor="var(--ill-gsec-bg2, #e0f2fe)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#gsec-bg)" rx="16" />

      {/* Sovereign Bond Certificate */}
      <g transform="translate(180, 70)">
        <rect x="0" y="0" width="280" height="180" rx="8" fill="#0f2b48" stroke="#1d4ed8" strokeWidth="2" />
        <rect x="10" y="10" width="260" height="160" rx="4" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
        <text x="140" y="40" textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="bold" letterSpacing="2">GOVERNMENT OF INDIA</text>
        <text x="140" y="65" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900">TREASURY BILLS & G-SECS</text>
        <text x="140" y="95" textAnchor="middle" fill="#7dd3fc" fontSize="12">RBI RETAIL DIRECT SCHEME</text>
        {/* Ashoka Wheel Silhouette */}
        <circle cx="140" cy="130" r="18" fill="none" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="140" cy="130" r="3" fill="#38bdf8" />
      </g>
    </svg>
  );
}

export function ReitsInvitsIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="reit-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-reit-bg1, #fffbeb)" />
          <stop offset="1" stopColor="var(--ill-reit-bg2, #fef3c7)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#reit-bg)" rx="16" />

      {/* Commercial Tech Park Skyline */}
      <g transform="translate(120, 70)">
        {/* Tower 1 */}
        <rect x="40" y="50" width="60" height="160" fill="#92400e" rx="2" />
        <g fill="#fde68a" opacity="0.8">
          <rect x="48" y="60" width="10" height="10" />
          <rect x="65" y="60" width="10" height="10" />
          <rect x="82" y="60" width="10" height="10" />
          <rect x="48" y="80" width="10" height="10" />
          <rect x="65" y="80" width="10" height="10" />
          <rect x="82" y="80" width="10" height="10" />
          <rect x="48" y="100" width="10" height="10" />
          <rect x="65" y="100" width="10" height="10" />
          <rect x="82" y="100" width="10" height="10" />
        </g>
        {/* Tower 2 (Center Glass Landmark) */}
        <rect x="120" y="10" width="90" height="200" fill="#b45309" rx="3" />
        <polygon points="120,10 165,-15 210,10" fill="#d97706" />
        {/* Infrastructure Pylon (InvITs) */}
        <polygon points="260,210 280,70 300,210" stroke="#d97706" strokeWidth="2" fill="none" />
        <line x1="265" y1="120" x2="295" y2="120" stroke="#d97706" strokeWidth="2" />
        <line x1="270" y1="160" x2="290" y2="160" stroke="#d97706" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function RetirementPensionIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ret-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-ret-bg1, #eef2ff)" />
          <stop offset="1" stopColor="var(--ill-ret-bg2, #e0e7ff)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#ret-bg)" rx="16" />

      {/* Golden Nest Egg & Hourglass */}
      <g transform="translate(320, 170)">
        {/* Nest */}
        <ellipse cx="0" cy="50" rx="90" ry="25" fill="#4338ca" stroke="#818cf8" strokeWidth="2" />
        {/* Golden Egg */}
        <ellipse cx="0" cy="10" rx="45" ry="60" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />
        <text x="0" y="16" textAnchor="middle" fill="#78350f" fontSize="16" fontWeight="900">NPS</text>
      </g>

      <g transform="translate(120, 80)">
        <rect x="0" y="0" width="150" height="55" rx="8" fill="#312e81" stroke="#a5b4fc" strokeWidth="1.5" />
        <text x="75" y="24" textAnchor="middle" fill="#c7d2fe" fontSize="11" fontWeight="bold">SEC 80CCD(1B)</text>
        <text x="75" y="44" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">+₹50,000 SHIELD</text>
      </g>
    </svg>
  );
}

export function EmergencySavingsIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="em-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-em-bg1, #ecfdf5)" />
          <stop offset="1" stopColor="var(--ill-em-bg2, #d1fae5)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#em-bg)" rx="16" />

      {/* Protective Umbrella */}
      <g transform="translate(320, 160)">
        <path d="M-80 -20 Q 0 -110, 80 -20 Q 40 -15, 0 -20 Q -40 -15, -80 -20 Z" fill="#059669" />
        <line x1="0" y1="-20" x2="0" y2="40" stroke="#047857" strokeWidth="4" />
        <path d="M0 40 Q 0 55, -15 55" stroke="#047857" strokeWidth="4" fill="none" />
      </g>

      {/* Runway Gauge Indicator */}
      <g transform="translate(200, 240)">
        <rect x="0" y="0" width="240" height="32" rx="16" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
        <rect x="3" y="3" width="140" height="26" rx="13" fill="#10b981" />
        <text x="70" y="20" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">3-6 MONTHS BUFFER</text>
        <text x="190" y="20" textAnchor="middle" fill="#a7f3d0" fontSize="11">INSTANT ACCESS</text>
      </g>
    </svg>
  );
}

export function OtherInvestmentsIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 640 360" className={`category-vector-img ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="oth-bg" x1="0" y1="0" x2="640" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--ill-oth-bg1, #f8fafc)" />
          <stop offset="1" stopColor="var(--ill-oth-bg2, #e2e8f0)" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#oth-bg)" rx="16" />

      {/* Green Sovereign Bond Leaf and Certificate */}
      <g transform="translate(320, 160)">
        <circle cx="0" cy="0" r="70" fill="var(--surface, #ffffff)" stroke="var(--border, #cbd5e1)" strokeWidth="2" />
        <path d="M-30 20 Q 0 -40, 30 20 Q 0 5, -30 20 Z" fill="#059669" />
        <text x="0" y="45" textAnchor="middle" fill="var(--text, #0f172a)" fontSize="12" fontWeight="bold">GREEN BONDS & OBPP</text>
      </g>
    </svg>
  );
}

export function InvestmentHeroIllustration({ className = '' }) {
  return (
    <svg viewBox="0 0 800 360" className={`hero-vector-art ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hero-grad" x1="0" y1="0" x2="800" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--bg-soft, #f1f5f9)" />
          <stop offset="1" stopColor="var(--surface-strong, #f8fafc)" />
        </linearGradient>
      </defs>
      <rect width="800" height="360" fill="url(#hero-grad)" rx="20" stroke="var(--border, #e2e8f0)" strokeWidth="1" />
      {/* Dynamic Compounding Wave Lines */}
      <path d="M0 280 C 200 280, 280 200, 420 180 C 560 160, 650 90, 800 50" stroke="var(--blue, #1d4ed8)" strokeWidth="3" fill="none" opacity="0.6" />
      <path d="M0 320 C 240 320, 320 250, 480 230 C 640 210, 700 140, 800 100" stroke="var(--text-soft, #94a3b8)" strokeWidth="2" strokeDasharray="6 6" fill="none" opacity="0.5" />

      {/* Target Compass Star */}
      <g transform="translate(680, 120)">
        <circle cx="0" cy="0" r="35" fill="var(--text, #0f172a)" stroke="var(--border, #cbd5e1)" strokeWidth="2" />
        <path d="M0 -22 L6 -6 L22 0 L6 6 L0 22 L-6 6 L-22 0 L-6 -6 Z" fill="var(--bg, #f8fafc)" />
      </g>
    </svg>
  );
}

/**
 * Registry mapping category IDs to their vector illustrations
 */
export const CATEGORY_ILLUSTRATION_MAP = {
  'gold-silver': GoldSilverIllustration,
  'stocks': StocksIllustration,
  'ipos': IposIllustration,
  'mutual-funds': MutualFundsIllustration,
  'lic-life-insurance': LicLifeIllustration,
  'health-insurance': HealthInsuranceIllustration,
  'fixed-deposits': FixedDepositsIllustration,
  'government-securities': GovernmentSecuritiesIllustration,
  'etfs-reits-invits': ReitsInvitsIllustration,
  'retirement-pension': RetirementPensionIllustration,
  'emergency-savings': EmergencySavingsIllustration,
  'other-investments': OtherInvestmentsIllustration,
};
