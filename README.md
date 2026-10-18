# 💚 FinTrack — Premium Personal Finance Management Platform

FinTrack is a full-stack, enterprise-grade personal finance application with a Cashew-inspired modern UI, Firebase Authentication, secure serverless/standalone Node.js backend, and Cloud Firestore persistence.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Chart.js, Lucide Icons, Framer Motion.
- **Backend**: Node.js & Express, configured for dual deployment:
  - **Standalone Mode**: `backend/server.js` (local dev, Docker, VPS).
  - **Serverless Mode**: `api/index.js` (Vercel Serverless Functions).
- **Authentication**: Firebase Authentication (Email/Password, Google OAuth, Phone OTP via reCAPTCHA, Password Reset, Email Verification).
- **Security & Authorization**: Firebase Admin SDK server-side token verification (`verifyIdToken`), user-scoped queries (`req.user.id`), Helmet HTTP security headers, CORS origin filtering, rate limiting, and spreadsheet formula injection protection.
- **Persistence**: Google Cloud Firestore with ACID transactional operations for contributions, EMI payments, user provisioning, and category seeding.
- **Deployment**: Vercel ready via `vercel.json` (SPA client routing + serverless API rewrites).

---

## 🗺️ Feature Map

| Module | Route | Capabilities | Status |
|---|---|---|---|
| **Auth** | `/login` | Email/Password, Google OAuth, Phone OTP with reCAPTCHA, Password Reset | ✅ Verified |
| **Dashboard** | `/home` | Net worth, monthly income/expense totals, cash flow trends, category breakdown, account balances, recent transactions | ✅ Verified |
| **Transactions** | `/transactions` | CRUD, income/expense types, category/account linking, pagination, date & category filters, search, CSV export with formula injection escaping | ✅ Verified |
| **Calculators** | `/calculators` | 6 financial planning tools: Loan EMI, SIP / Mutual Fund, Compound Interest, Simple Interest, Savings Goal, 50/30/20 Budget | ✅ Verified |
| **Budgets** | `/budgets` | Category limits, monthly/yearly/custom period spending tracking, utilization percentage, exceeded warnings | ✅ Verified |
| **Savings Goals** | `/goals` | Target amounts & dates, deposit/withdraw transaction history, automated progress tracking | ✅ Verified |
| **Investments** | `/investments` | Portfolio allocation, asset tracking (Stocks, Mutual Funds, Gold, PPF, NPS), invested capital vs current valuation, P&L | ✅ Verified |
| **Loans & EMI** | `/loans` | Principal, interest rate, tenure, reducing-balance EMI schedule, monthly repayment tracking (`payEmi`) | ✅ Verified |
| **Subscriptions** | `/subscriptions` | Recurring expenses, billing intervals (monthly/yearly/weekly), active/paused toggles, monthly burn projection | ✅ Verified |
| **Categories** | `/categories` | Default system categories + custom user categories with color and emoji support | ✅ Verified |
| **Settings** | `/settings` | Profile details, currency preferences, date formatting, dark mode toggle, secure account deletion | ✅ Verified |
| **Security / JWT** | `/jwt` | Developer token inspector, decoded payload, countdown timer, force refresh | ✅ Verified |
| **AI Assistant** | Floating widget | FinTrack financial chatbot analyzing monthly cash flow and budgets | ✅ Verified |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node v22)
- npm 9+

### 1. Backend Setup
```bash
cd backend
npm install
npm test            # Run automated unit and integration tests (17 tests)
npm run dev         # Starts backend on http://localhost:5000
```

### 2. Frontend Setup
```bash
# In project root
npm install
npm test            # Runs backend test suite from root
npm run build       # Validates production build (Vite)
npm run dev         # Starts frontend on http://localhost:5173
```

---

## 🔐 Environment Variables

### Frontend (`.env` in root)
```env
VITE_API_URL=/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Firebase Admin SDK Credentials (Choose one of the three options):
# Option 1: File path (git-ignored)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Option 2: JSON string (Recommended for Vercel / Cloud environment variables)
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Option 3: Individual environment variables
# FIREBASE_PROJECT_ID=your_project_id
# FIREBASE_CLIENT_EMAIL=your_service_account_email
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## ☁️ Vercel Deployment

FinTrack is pre-configured for Vercel with single-repository deployment:

- **Root Directory**: `.`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install && npm install --prefix backend`

### Vercel Environment Variables:
1. `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
2. `FIREBASE_SERVICE_ACCOUNT_JSON`: Complete minified service account JSON.
3. `NODE_ENV`: `production`

---

## 🧪 Testing

FinTrack uses Node's native test runner (`node --test`), providing sub-second test execution without third-party test runners:

```bash
npm test
```

### Coverage includes:
- **Finance Utilities**: Reducing-balance EMI, zero-interest loans, amortization schedules, compound interest with varied compounding frequencies, simple interest, monthly SIP projections, savings goal requirements, budget period matching (weekly, monthly, yearly, custom).
- **Money & Decimal Safety**: Strict 2-decimal place rounding and floating-point arithmetic protection.
- **Security & Data Sanitization**: Formula injection neutralization on CSV exports (escaping `=`, `+`, `-`, `@`), and BOM insertion.
- **API Health & Route Integrity**: System status reporting, version checks, and 404 handlers.
- **Authentication & Authorization**: Strict 401 rejection on unauthenticated requests across all 11 protected routes, and rejection of invalid / expired tokens.
