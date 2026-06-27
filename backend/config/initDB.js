// config/initDB.js — Run: node config/initDB.js
const db = require('./db');
require('dotenv').config();

async function initDB() {
  console.log('📦  Initializing SQLite database...');

  // ── USERS ──────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid          TEXT NOT NULL UNIQUE DEFAULT (lower(hex(randomblob(16)))),
      name          TEXT NOT NULL,
      email         TEXT UNIQUE,
      phone         TEXT UNIQUE,
      password_hash TEXT,
      auth_method   TEXT DEFAULT 'phone',
      google_id     TEXT UNIQUE,
      avatar_url    TEXT,
      currency      TEXT DEFAULT 'INR',
      is_active     BOOLEAN DEFAULT 1,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── REFRESH TOKENS ─────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked    BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── OTP RECORDS ────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS otp_records (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      phone      TEXT NOT NULL UNIQUE,
      otp_hash   TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      verified   BOOLEAN DEFAULT 0,
      attempts   INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_phone ON otp_records (phone)`);

  // ── ACCOUNTS ───────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      name       TEXT NOT NULL,
      type       TEXT DEFAULT 'savings',
      balance    REAL DEFAULT 0.00,
      color      TEXT DEFAULT '#4a9eff',
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── CATEGORIES ─────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER,
      name       TEXT NOT NULL,
      type       TEXT DEFAULT 'expense',
      icon       TEXT DEFAULT '💰',
      color      TEXT DEFAULT '#2db87d',
      is_default BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── TRANSACTIONS ───────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      account_id   INTEGER NOT NULL,
      category_id  INTEGER,
      type         TEXT NOT NULL,
      amount       REAL NOT NULL,
      title        TEXT NOT NULL,
      note         TEXT,
      date         DATE NOT NULL,
      is_recurring BOOLEAN DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)     REFERENCES users(id)       ON DELETE CASCADE,
      FOREIGN KEY (account_id)  REFERENCES accounts(id)    ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)  ON DELETE SET NULL
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_user_date ON transactions (user_id, date)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_type ON transactions (type)`);

  // ── BUDGETS ────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      category_id INTEGER,
      name        TEXT NOT NULL,
      amount      REAL NOT NULL,
      period      TEXT DEFAULT 'monthly',
      start_date  DATE NOT NULL,
      end_date    DATE,
      color       TEXT DEFAULT '#2db87d',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // ── GOALS ──────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      name         TEXT NOT NULL,
      emoji        TEXT DEFAULT '🎯',
      target_amount REAL NOT NULL,
      saved_amount  REAL DEFAULT 0.00,
      deadline     DATE,
      note         TEXT,
      is_achieved  BOOLEAN DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── LOANS ──────────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS loans (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      name            TEXT NOT NULL,
      type            TEXT DEFAULT 'personal',
      principal       REAL NOT NULL,
      remaining       REAL NOT NULL,
      emi_amount      REAL NOT NULL,
      interest_rate   REAL NOT NULL,
      tenure_months   INTEGER NOT NULL,
      paid_months     INTEGER DEFAULT 0,
      emi_date        INTEGER DEFAULT 1,
      lender          TEXT,
      is_active       BOOLEAN DEFAULT 1,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── SUBSCRIPTIONS ──────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      name        TEXT NOT NULL,
      icon        TEXT DEFAULT '📱',
      amount      REAL NOT NULL,
      period      TEXT DEFAULT 'monthly',
      next_due    DATE NOT NULL,
      category    TEXT,
      is_active   BOOLEAN DEFAULT 1,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── INVESTMENTS ────────────────────────────────────────
  await db.query(`
    CREATE TABLE IF NOT EXISTS investments (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      name          TEXT NOT NULL,
      category      TEXT NOT NULL,
      instrument    TEXT,
      invested_amount REAL DEFAULT 0.00,
      current_value   REAL DEFAULT 0.00,
      units         REAL DEFAULT 0.0000,
      sip_amount    REAL DEFAULT 0.00,
      sip_date      INTEGER,
      start_date    DATE,
      maturity_date DATE,
      notes         TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── SEED DEFAULT CATEGORIES ────────────────────────────
  await db.query(`
    INSERT OR IGNORE INTO categories (user_id, name, type, icon, color, is_default) VALUES
    (NULL, 'Salary',        'income',     '💼', '#2db87d', 1),
    (NULL, 'Freelance',     'income',     '💻', '#4a9eff', 1),
    (NULL, 'Business',      'income',     '🏢', '#ef9f27', 1),
    (NULL, 'Groceries',     'expense',    '🛒', '#2db87d', 1),
    (NULL, 'Dining',        'expense',    '🍽️', '#e24b4a', 1),
    (NULL, 'Transport',     'expense',    '🚗', '#4a9eff', 1),
    (NULL, 'Shopping',      'expense',    '🛍️', '#ef9f27', 1),
    (NULL, 'Entertainment', 'expense',    '🎬', '#9b59b6', 1),
    (NULL, 'Utilities',     'expense',    '⚡', '#1abc9c', 1),
    (NULL, 'Health',        'expense',    '❤️', '#e74c3c', 1),
    (NULL, 'Insurance',     'expense',    '🛡️', '#3498db', 1),
    (NULL, 'Education',     'expense',    '📚', '#2ecc71', 1),
    (NULL, 'Mutual Fund',   'investment', '💹', '#2db87d', 1),
    (NULL, 'Stocks',        'investment', '📈', '#e24b4a', 1),
    (NULL, 'Gold',          'investment', '🪙', '#ef9f27', 1),
    (NULL, 'PPF',           'investment', '🏦', '#4a9eff', 1),
    (NULL, 'NPS',           'investment', '🌅', '#9b59b6', 1),
    (NULL, 'SGB',           'investment', '🪙', '#ef9f27', 1)
  `);

  console.log('✅  All tables created & seeded');
  // Just exit process gracefully
  setTimeout(() => process.exit(0), 500);
}

initDB().catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
