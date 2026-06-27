# 💚 FinTrack v2.0 — Premium Finance Platform

A production-ready, full-stack personal finance app with Cashew-inspired UI, JWT auth, and complete feature set.

---

## 🚀 Quick Start

### Option A — Docker (Recommended)
```bash
cp .env.deploy .env
# Edit .env and change all CHANGE_ME values

docker-compose up --build -d
# App runs at http://localhost
```

### Option B — Local Development
```bash
# 1. Start MySQL (or use Docker for just the DB)
docker-compose up mysql -d

# 2. Backend
cd backend
cp .env.example .env          # fill in your values
npm install
node config/initDB.js         # create tables + seed categories
npm run dev                   # http://localhost:5000

# 3. Frontend (new terminal)
cd ..
npm install
npm run dev                   # http://localhost:5173
```

---

## 🔐 Authentication

### Demo mode (out of the box)
| Method | How to test |
|---|---|
| Phone OTP | Any 10-digit number → OTP shown on screen |
| Google | Click button → demo payload used |
| Email Login | Register first, then login |

### Production mode
1. Set `DEMO_OTP=false` in `.env`
2. Integrate [Twilio](https://twilio.com) or [MSG91](https://msg91.com) in `authController.js` → `sendOTP()`
3. For real Google OAuth: validate `id_token` with `google-auth-library` in `googleLogin()`
4. For Firebase auth: uncomment `src/firebase/config.js` and `authService.js`

---

## 🗺️ Feature Map

| Route | Feature | Status |
|---|---|---|
| `/login` | Google + Email + Phone OTP auth | ✅ |
| `/home` | Net worth, trends chart, recent transactions | ✅ |
| `/transactions` | Add/edit/delete, filters, search, monthly summary | ✅ |
| `/investments` | 6 categories, 12 plans, portfolio tracker, charts | ✅ |
| `/budgets` | Create/edit budgets with progress rings | ✅ |
| `/goals` | Goals with deposit flow, progress tracking | ✅ |
| `/loans` | EMI tracker + built-in calculator | ✅ |
| `/subscriptions` | Recurring payment tracker with pause/resume | ✅ |
| `/settings` | Profile, JWT status, dark mode prefs | ✅ |
| `/jwt` | JWT decoder + token inspector | ✅ |

---

## 🏗️ Architecture

```
fintrack-upgraded/
├── backend/                    # Node.js + Express + MySQL API
│   ├── config/
│   │   ├── db.js               # MySQL2 connection pool
│   │   ├── jwt.js              # Sign/verify tokens
│   │   └── initDB.js           # Schema + seed (run once)
│   ├── controllers/            # Business logic (10 modules)
│   ├── routes/                 # REST endpoints (10 modules)
│   ├── middleware/auth.js      # JWT authentication guard
│   └── server.js               # Express app entry point
├── src/                        # React 18 frontend
│   ├── pages/                  # 10 full-feature pages
│   ├── components/layout/      # AppShell + bottom nav
│   ├── context/AuthContext.jsx # Auth state + token refresh
│   ├── services/api.js         # Axios client + auto-refresh
│   ├── firebase/               # Firebase config (optional)
│   └── index.css               # Design system (CSS vars)
├── Dockerfile                  # Frontend multi-stage build
├── nginx.conf                  # Production nginx config
└── docker-compose.yml          # Full stack orchestration
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Body |
|---|---|---|
| POST | `/api/auth/send-otp` | `{ phone }` |
| POST | `/api/auth/verify-otp` | `{ phone, otp }` |
| POST | `/api/auth/google` | `{ name, email, google_id }` |
| POST | `/api/auth/email/register` | `{ name, email, password }` |
| POST | `/api/auth/email/login` | `{ email, password }` |
| POST | `/api/auth/refresh` | — (uses cookie) |
| POST | `/api/auth/logout` | — |
| GET  | `/api/auth/me` | — |

### Protected (Bearer token required)
| Method | Endpoint | Notes |
|---|---|---|
| GET  | `/api/dashboard/overview` | Net worth, income, expenses, recent txns |
| GET  | `/api/dashboard/trends` | 6-month income/expense chart data |
| CRUD | `/api/transactions` | `?page&limit&search&type&from&to` |
| GET  | `/api/transactions/summary` | `?month&year` → category breakdown |
| CRUD | `/api/accounts` | Bank accounts, wallet |
| CRUD | `/api/categories` | Default + custom categories |
| CRUD | `/api/budgets` | Spending limits with auto-tracking |
| CRUD | `/api/goals` | Savings goals with deposit tracking |
| CRUD | `/api/investments` | Portfolio positions |
| CRUD | `/api/loans` | EMI tracking |
| CRUD | `/api/subscriptions` | Recurring bills |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#020204` |
| Card | `#0d0d0f` |
| Border | `#111116` |
| Accent green | `#4ade80` |
| Heading font | Clash Display |
| Body font | Plus Jakarta Sans |
| Border radius | 14–24px |

---

## 🔒 Security

- JWT HS256 with 30-min access + 7-day rotating refresh tokens
- Refresh tokens hashed (SHA-256) before DB storage
- HTTP-only SameSite=Strict cookie for refresh token
- Rate limiting: 30 auth req/15min, 500 API req/15min
- Helmet.js security headers
- Non-root Docker user (`fintrack`)
- Input validation on all endpoints
- User isolation: all queries scoped to `user_id`

---

## ☁️ Deployment Checklist

- [ ] Change all `CHANGE_ME` values in `.env`
- [ ] Generate JWT secrets: `openssl rand -hex 32`
- [ ] Set `DEMO_OTP=false` in production
- [ ] Integrate real SMS provider (Twilio/MSG91)
- [ ] Point `FRONTEND_URL` to your domain
- [ ] Set up HTTPS (Certbot/Cloudflare)
- [ ] Configure MySQL backups
- [ ] Set up monitoring (PM2/Uptime Robot)

---

## 📦 Tech Stack

- **Frontend**: React 18, React Router v6, Chart.js, React Hot Toast
- **Backend**: Node.js 20, Express 4, MySQL 8, JWT (jsonwebtoken)
- **Auth**: Phone OTP, Google OAuth, Email/Password
- **Container**: Docker, Nginx, MySQL 8
- **Fonts**: Clash Display, Plus Jakarta Sans (Google Fonts)
