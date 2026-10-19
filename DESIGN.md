---
version: 1.0.0
name: FinTrack Design System
description: |
  A financial-intelligence design system synthesized from the fintech craftsmanship
  of Mercury and Stripe, the dark-mode precision of Linear and Raycast, and the
  accessibility and interface ergonomics codified by Vercel Labs Web Interface Guidelines.
  Built for high-density financial data, real-time portfolio metrics, tabular numeric accuracy,
  fluid page transitions, and cross-platform native mobile touch responsiveness.

# ─── COLOR PALETTE TOKENS ──────────────────────────────────────────────────
colors:
  # Primary Brand (Emerald Wealth Chroma)
  primary: "#10b981"
  primary-bright: "#34d399"
  primary-deep: "#059669"
  primary-press: "#047857"
  primary-soft: "rgba(16, 185, 129, 0.12)"
  primary-glow: "rgba(16, 185, 129, 0.25)"
  on-primary: "#ffffff"

  # Dark Mode Surfaces (Linear & Raycast Inspired Obsidian Palette)
  canvas-dark: "#090d16"
  canvas-deep: "#060910"
  surface-1: "#0f172a"
  surface-2: "#172033"
  surface-3: "#1e293b"
  surface-elevated: "rgba(23, 32, 51, 0.85)"
  surface-popover: "rgba(20, 26, 29, 0.96)"
  
  # Light Mode Surfaces (Mercury Inspired Canvas)
  canvas-light: "#f8fafc"
  canvas-soft: "#f1f5f9"
  surface-light: "#ffffff"
  surface-light-raised: "#ffffff"
  surface-light-tint: "#fbfcfd"

  # Typography Neutrals (Ink Hierarchy)
  ink-primary: "#0f172a"
  ink-secondary: "#64748b"
  ink-subtle: "#94a3b8"
  on-dark-primary: "#f8fafc"
  on-dark-secondary: "#94a3b8"
  on-dark-subtle: "#64748b"

  # Hairlines & Dividers
  hairline-dark: "rgba(255, 255, 255, 0.08)"
  hairline-dark-subtle: "rgba(255, 255, 255, 0.04)"
  hairline-dark-hover: "rgba(255, 255, 255, 0.16)"
  hairline-light: "#e2e8f0"
  hairline-light-subtle: "#f1f5f9"
  hairline-light-hover: "#cbd5e1"

  # Semantic Accents (Revolut Multicolored Ledger Standard)
  semantic-income: "#10b981"
  semantic-expense: "#ef4444"
  semantic-investment: "#8b5cf6"
  semantic-savings: "#0284c7"
  semantic-warning: "#f59e0b"
  semantic-info: "#38bdf8"

# ─── TYPOGRAPHY TOKENS (STRIPE & MERCURY STANDARD) ─────────────────────────
typography:
  font-family-sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font-family-mono: "'SF Mono', 'Fira Code', 'Roboto Mono', monospace"

  # Display & Headlines (Balanced Negative Tracking)
  display-xl:
    fontSize: "48px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.035em"
    textWrap: "balance"

  display-lg:
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.025em"
    textWrap: "balance"

  heading-1:
    fontSize: "24px"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.02em"
    textWrap: "balance"

  heading-2:
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"

  heading-3:
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"

  # Tabular Financial Figures (Stripe #1 Rule for Numeric Ledgers)
  stat-metric:
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariantNumeric: "tabular-nums"
    fontFeatureSettings: "'tnum' 1, 'cv05' 1"

  body-tabular:
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
    fontVariantNumeric: "tabular-nums"
    fontFeatureSettings: "'tnum' 1"

  body:
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"

  caption:
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"

# ─── BORDER RADII (MERCURY & REVOLUT PILL STANDARDS) ───────────────────────
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
  pill: "9999px"

# ─── ELEVATION & SHADOWS ───────────────────────────────────────────────────
elevation:
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -4px rgba(0, 0, 0, 0.08)"
  glow-mint: "0 8px 24px rgba(16, 185, 129, 0.35)"
  popover: "0 24px 54px -8px rgba(0, 0, 0, 0.65)"
  backdrop-blur: "blur(18px)"

# ─── INTERACTION & MOTION (VERCEL & LINEAR PRINCIPLES) ─────────────────────
motion:
  curve-standard: "cubic-bezier(0.16, 1, 0.3, 1)"
  duration-fast: "0.15s"
  duration-normal: "0.24s"
  duration-smooth: "0.32s"
  active-scale: "scale(0.98)"
  hover-elevation: "translateY(-1.5px)"
  prefers-reduced-motion: "Respect system accessibility preference by disabling long transitions"

# ─── CORE COMPONENT ARCHITECTURE ───────────────────────────────────────────
components:
  # Metric Indicator Cards (Mercury & Linear)
  metric-card:
    border: "1px solid var(--border)"
    borderRadius: "16px"
    padding: "16px 18px"
    background: "var(--surface)"
    statStyle: "font-variant-numeric: tabular-nums; font-weight: 800;"
    hoverStyle: "border-color: var(--border-hover); transform: translateY(-1.5px);"

  # Ledger Rows (Stripe & Revolut)
  ledger-row:
    padding: "12px 14px"
    borderBottom: "1px solid var(--border-subtle)"
    display: "flex"
    alignItems: "center"
    justifyContent: "space-between"
    amountStyle: "font-variant-numeric: tabular-nums; font-weight: 700;"

  # Action Buttons & Pills
  button-primary:
    background: "#10b981"
    color: "#ffffff"
    borderRadius: "12px"
    padding: "10px 18px"
    fontWeight: 650
    activeTransform: "scale(0.98)"
    focusRing: "2px solid #10b981, outline-offset: 2px"

  # Command Palette & Floating AI Modal (Raycast Inspired)
  command-palette:
    overlay: "rgba(0, 0, 0, 0.65) with backdrop-filter: blur(8px)"
    dialog: "background: var(--surface), border: 1px solid var(--border), borderRadius: 20px"
    shortcut-badge: "background: var(--surface-strong), borderRadius: 6px, font-family: mono"

  # Mobile App Bottom Navigation (Safe Area Inset Aware)
  mobile-bottom-nav:
    height: "calc(58px + env(safe-area-inset-bottom))"
    backdropFilter: "blur(18px)"
    background: "var(--surface)"
    borderTop: "1px solid var(--border)"
    safeAreaPadding: "max(env(safe-area-inset-bottom), 8px)"
---
