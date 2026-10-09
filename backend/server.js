// server.js — FinTrack API v2
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const { authenticate } = require('./middleware/auth');
const { seedDefaultCategories } = require('./utils/firestoreHelpers');

const app  = express();
const PORT = process.env.PORT || 5000;

// Firestore Timestamps → ISO strings in every res.json()
app.set('json replacer', (key, value) =>
  value && typeof value === 'object' &&
  typeof value._seconds === 'number' && typeof value._nanoseconds === 'number'
    ? new Date(value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6)).toISOString()
    : value
);

// ── Security ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ──────────────────────────────────────
app.use('/api',      rateLimit({ windowMs: 15*60*1000, max: 500 }));

// ── Auth (profile only — sign-in is handled by Firebase Auth) ──
app.use('/api/auth', require('./routes/auth'));

// ── Protected routes ───────────────────────────────────
const auth = authenticate;
app.use('/api/dashboard',     auth, require('./routes/dashboard'));
app.use('/api/transactions',  auth, require('./routes/transactions'));
app.use('/api/budgets',       auth, require('./routes/budgets'));
app.use('/api/goals',         auth, require('./routes/goals'));
app.use('/api/investments',   auth, require('./routes/investments'));
app.use('/api/loans',         auth, require('./routes/loans'));
app.use('/api/subscriptions', auth, require('./routes/subscriptions'));
app.use('/api/categories',    auth, require('./routes/categories'));
app.use('/api/accounts',      auth, require('./routes/accounts'));
app.use('/api/recurring',     auth, require('./routes/recurring'));
app.post('/api/chat',         auth, require('./controllers/chatController').chat);

// ── Health ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok', version: '2.0.0',
  time: new Date(), env: process.env.NODE_ENV,
}));

// ── 404 ────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// ── Global error handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀  FinTrack API v2  →  http://localhost:${PORT}`);
  console.log(`🌍  Env: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔥  Database: Cloud Firestore · Auth: Firebase ID tokens\n');

  seedDefaultCategories()
    .then(() => {
      // Setup recurring transaction processor
      const processRecurringTransactions = require('./utils/recurringProcessor');
      processRecurringTransactions(); // Run on startup
      setInterval(processRecurringTransactions, 60 * 60 * 1000); // Run every hour
    })
    .catch(err => {
      console.error('❌  Could not reach Firestore:', err.message);
      console.error('    Check that Cloud Firestore is enabled for your Firebase project and the service account has access.');
    });
});
