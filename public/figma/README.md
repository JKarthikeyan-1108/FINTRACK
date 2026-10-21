# FinTrack • Figma Design System & Artboard Suite

This directory contains the production-grade **Figma Design System**, **W3C Design Tokens**, and **High-Fidelity Vector Artboards** for FinTrack Wealth Intelligence, covering both **Desktop Web (`1440 × 900`)** and **Mobile Android APK (`390 × 844`)**.

---

## 📁 Directory Structure

```
fintrack/figma/
├── tokens.json               # W3C DTCG / Token Studio compatible JSON tokens
├── preview.html              # Interactive browser previewer & token inspector
├── README.md                 # Complete Figma setup and import handbook
└── artboards/
    ├── desktop-web-dashboard.svg        # Desktop Web Light Mode (1440 × 900)
    ├── desktop-web-dashboard-dark.svg   # Desktop Web Dark Mode (1440 × 900)
    ├── mobile-app-overview.svg          # Mobile APK Light Mode (390 × 844)
    ├── mobile-app-overview-dark.svg     # Mobile APK Dark Mode (390 × 844)
    └── mobile-quick-add-sheet.svg       # Mobile APK Quick Add Sheet (390 × 844)
```

---

## 🚀 Quick Start: Importing into Figma

### Method 1: Instant Native Vector Import (Drag & Drop)
Figma converts SVG files directly into **native editable vector layers, frames, texts, shapes, and gradients**:
1. Open your project in **Figma Desktop** or **Figma Web**.
2. Simply **drag and drop** any `.svg` file from `fintrack/figma/artboards/` onto your Figma canvas.
3. Figma will immediately instantiate the full artboard:
   - `desktop-web-dashboard.svg` will create a `1440 × 900` frame.
   - `mobile-app-overview.svg` will create a `390 × 844` frame.
4. All layers (Sidebar, Header, Metric Cards, Spline Curves, Donut segments, Ledger rows, and Docked Navigation) will be fully editable groups and vector layers.

### Method 2: Design Tokens Import (Tokens Studio / Figma Variables)
1. Install the **Tokens Studio for Figma** plugin (formerly Figma Tokens).
2. Open the plugin inside your Figma file.
3. Click **Settings** → **Load from JSON** (or **Tools** → **Import**).
4. Select `fintrack/figma/tokens.json`.
5. All color styles, typography scales, spacing tokens, border radii, and drop shadows will populate into your Figma Variables and Style Library!

### Method 3: Visual Inspection (`preview.html`)
Double-click `fintrack/figma/preview.html` in your file explorer to open the interactive viewer in any browser. You can:
- Switch seamlessly between Desktop (1440x900) and Mobile (390x844).
- Toggle between Light and Dark mode variants.
- Inspect exact Hex color values and copy tokens with one click.

---

## 🎨 Design Tokens & Brand System

### 1. Brand Palette
| Token Name | Hex Value | Figma Style Name | Usage |
|---|---|---|---|
| `brand-primary` | `#702632` | `Brand / Primary` | Deep Royal Wine; Primary buttons, active nav, key metrics |
| `brand-primary-hover` | `#5A1E29` | `Brand / Primary Hover` | Hover state for buttons and clickable chips |
| `brand-accent` | `#A83F55` | `Brand / Accent` | Crimson Rose; Secondary badges, chart line 2, interactive accents |
| `brand-highlight` | `#E9A3B0` | `Brand / Highlight` | Champagne Blush; Subdued labels, progress bar tracks |
| `brand-soft` (Light) | `#FFF1F2` | `Surface / Brand Soft Light` | Active nav pill background, light category tags |
| `brand-soft` (Dark) | `#38232D` | `Surface / Brand Soft Dark` | Dark mode active containers and hero card backgrounds |

### 2. Semantic Financial Status
| Token Name | Light Mode | Dark Mode | Semantic Meaning |
|---|---|---|---|
| `status-positive` | `#15803D` | `#4ADE80` | Income inflows, net worth surplus, cleared transactions |
| `status-negative` | `#B42318` | `#FDA4AF` | Outflows, expense deductions, deficit indicators |
| `status-warning` | `#B45309` | `#FBBF24` | Budget threshold warnings, pending clearing status |
| `status-info` | `#2563EB` | `#93C5FD` | General notices, investment brokerage tags |

### 3. Surface & Canvas Colors
| Token Name | Light Canvas | Dark Obsidian Canvas |
|---|---|---|
| `bg-page` | `#FFF8F8` | `#191219` |
| `bg-surface` | `#FFFFFF` | `#241B23` |
| `bg-surface-muted` | `#FFF1F2` | `#30212B` |
| `bg-sidebar` | `#FFFFFF` | `#201720` |
| `border-default` | `#E9DDE1` | `#493540` |
| `border-focus` | `#A83F55` | `#F2B7C3` |

---

## 📐 Frame Architecture & Auto-Layout Rules

### Desktop Web (`1440 × 900`)
```
Frame: Desktop Web [1440 x 900] (Layout: None / Fixed Grid)
├── Sidebar [240 x 900] (Auto-layout: Vertical, Padding: 20px, Gap: 4px)
│   ├── Brand Header [240 x 72]
│   ├── Navigation Section [216 x Auto]
│   └── User Profile Card [212 x 58] (Pinned to Bottom)
├── Top Command Bar [1200 x 64] (Auto-layout: Horizontal, Align: Center, Space-Between)
│   ├── Breadcrumb Trail
│   ├── Search Bar + ⌘K Badge [280 x 36]
│   └── Header Actions (+ New Entry CTA)
└── Content Canvas [1200 x 836] (Scrollable)
    ├── KPI Grid [1144 x 120] (Auto-layout: Horizontal, 4 equal columns)
    ├── Middle Row [1144 x 310] (Grid: 716px Chart + 406px Donut)
    └── Master Ledger Table [1144 x 324] (Auto-layout: Vertical)
```

### Mobile Android APK (`390 × 844`)
```
Frame: Mobile APK [390 x 844] (Layout: Vertical Auto-layout)
├── System Status Bar [390 x 44] (Fixed Top)
├── Top App Bar [390 x 56] (Auto-layout: Horizontal, Padding: 16px, Space-Between)
├── Scrollable Feed [390 x 656] (Padding: 16px, Gap: 16px)
│   ├── Safe-to-Spend Hero Card [358 x 152] (Radius: 20px, Burgundy Gradient)
│   ├── 3-Button Action Strip [358 x 42] (Auto-layout: 3 equal columns)
│   ├── Accounts Carousel [358 x 104] (Horizontal Scrolling)
│   └── Grouped Daily Feed [358 x Auto] (Radius: 16px Card with 2-line ledger items)
└── Docked Bottom Navigation Bar [390 x 88] (Fixed Bottom, Z-Index: 30)
    ├── 5 Equal Navigation Slots (Width: 78px each)
    ├── Center Elevated Action Button [48 x 48 Circle] (TranslateY: -12px, Wine Shadow)
    └── Native Gesture Indicator Bar [136 x 5 Pill]
```

---

## 🖋 Typography Standards

- **Primary Font Family**: `Inter` (Google Fonts or Apple SF Pro)
- **Numeric Font Feature**: `font-variant-numeric: tabular-nums` (Critical for aligned currency decimals)
- **Monospace Font**: `SF Mono`, `JetBrains Mono`, or `Fira Code`

| Style Name | Size | Weight | Line Height | Tracking |
|---|---|---|---|---|
| `Display / Hero` | 34px | 800 (ExtraBold) | 1.1 | `-0.02em` |
| `Stat / Large Metric` | 26px | 800 (ExtraBold) | 1.15 | `-0.02em` (Tabular) |
| `Heading / Section` | 18px | 800 (ExtraBold) | 1.2 | `-0.015em` |
| `Heading / Card Title`| 16px | 800 (ExtraBold) | 1.25 | `-0.01em` |
| `Body / Tabular Row` | 13.5px | 700 / 800 | 1.3 | `-0.01em` (Tabular) |
| `Body / Regular` | 13px | 500 / 600 | 1.4 | `0` |
| `Caption / Micro` | 11px | 600 / 700 | 1.3 | `+0.05em` |
