// Express application (shared by local server.js and Vercel api/index.js)
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('./middleware/auth');
const { seedDefaultCategories } = require('./utils/firestoreHelpers');
const processRecurringTransactions = require('./utils/recurringProcessor');

const app = express();

app.set('trust proxy', 1);

app.set('json replacer', (key, value) =>
  value && typeof value === 'object' &&
  typeof value._seconds === 'number' && typeof value._nanoseconds === 'number'
    ? new Date(value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6)).toISOString()
    : value
);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = String(process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    if (/\.vercel\.app$/.test(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// URL normalizer: ensures Express routes match whether invoked as standalone server (/api/...) or via Vercel Function
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api') && req.url !== '/health') {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, validate: { xForwardedForHeader: false } }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, validate: { xForwardedForHeader: false } }));

let bootstrapped = false;
let lastRecurringRun = 0;
app.use('/api', async (req, res, next) => {
  try {
    if (!bootstrapped) {
      await seedDefaultCategories();
      bootstrapped = true;
    }
    const now = Date.now();
    if (now - lastRecurringRun > 60 * 60 * 1000) {
      lastRecurringRun = now;
      processRecurringTransactions().catch(() => {});
    }
  } catch (err) {
    console.error('Bootstrap:', err.message);
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));

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

app.get('/health', (req, res) => res.json({
  status: 'ok',
  version: '2.0.0',
  time: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
  persistence: 'firestore',
  auth: 'firebase-id-token',
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

module.exports = app;
