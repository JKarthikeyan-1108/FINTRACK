// utils/firestoreHelpers.js — shared Firestore helpers
const db = require('../config/db');

// Shared categories every user sees (user_id = null). Doc IDs are fixed so seeding is idempotent.
const DEFAULT_CATEGORIES = [
  { id: 'salary',        name: 'Salary',        type: 'income',     icon: '💼', color: '#2db87d' },
  { id: 'freelance',     name: 'Freelance',     type: 'income',     icon: '💻', color: '#4a9eff' },
  { id: 'business',      name: 'Business',      type: 'income',     icon: '🏢', color: '#ef9f27' },
  { id: 'groceries',     name: 'Groceries',     type: 'expense',    icon: '🛒', color: '#2db87d' },
  { id: 'dining',        name: 'Dining',        type: 'expense',    icon: '🍽️', color: '#e24b4a' },
  { id: 'transport',     name: 'Transport',     type: 'expense',    icon: '🚗', color: '#4a9eff' },
  { id: 'shopping',      name: 'Shopping',      type: 'expense',    icon: '🛍️', color: '#ef9f27' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense',    icon: '🎬', color: '#9b59b6' },
  { id: 'utilities',     name: 'Utilities',     type: 'expense',    icon: '⚡', color: '#1abc9c' },
  { id: 'health',        name: 'Health',        type: 'expense',    icon: '❤️', color: '#e74c3c' },
  { id: 'insurance',     name: 'Insurance',     type: 'expense',    icon: '🛡️', color: '#3498db' },
  { id: 'education',     name: 'Education',     type: 'expense',    icon: '📚', color: '#2ecc71' },
  { id: 'mutual_fund',   name: 'Mutual Fund',   type: 'investment', icon: '💹', color: '#2db87d' },
  { id: 'stocks',        name: 'Stocks',        type: 'investment', icon: '📈', color: '#e24b4a' },
  { id: 'gold',          name: 'Gold',          type: 'investment', icon: '🪙', color: '#ef9f27' },
  { id: 'ppf',           name: 'PPF',           type: 'investment', icon: '🏦', color: '#4a9eff' },
  { id: 'nps',           name: 'NPS',           type: 'investment', icon: '🌅', color: '#9b59b6' },
  { id: 'sgb',           name: 'SGB',           type: 'investment', icon: '🪙', color: '#ef9f27' },
];

/** Idempotently writes the shared default categories. */
async function seedDefaultCategories() {
  const batch = db.batch();
  const col   = db.collection('categories');
  for (const { id, ...cat } of DEFAULT_CATEGORIES) {
    batch.set(col.doc(`default_${id}`), {
      user_id:    null,
      ...cat,
      is_default: true,
      created_at: new Date(),
      updated_at: new Date(),
    }, { merge: true });
  }
  await batch.commit();
  return DEFAULT_CATEGORIES.length;
}

/**
 * Categories visible to a user: their own + the shared defaults.
 * Returns an array of QueryDocumentSnapshots.
 * (Two equality queries instead of `in [uid, null]`, which needs no extra index.)
 */
async function getVisibleCategoryDocs(uid) {
  const [mine, defaults] = await Promise.all([
    db.collection('categories').where('user_id', '==', uid).get(),
    db.collection('categories').where('user_id', '==', null).get(),
  ]);
  return [...mine.docs, ...defaults.docs];
}

const PROVIDER_TO_METHOD = {
  'google.com': 'google',
  'password':   'email',
  'phone':      'phone',
};

// uid → in-flight/finished bootstrap, so parallel first requests don't duplicate work
const bootstrapped = new Map();

/**
 * Makes sure users/{uid} exists (plus a default account) for a verified Firebase user.
 * Safe under concurrency: both writes use fixed doc IDs inside one transaction.
 * Returns the user's profile document data.
 */
function ensureUser(decoded) {
  const uid = decoded.uid;
  if (bootstrapped.has(uid)) return bootstrapped.get(uid);

  const promise = (async () => {
    const userRef    = db.collection('users').doc(uid);
    const accountRef = db.collection('accounts').doc(`default_${uid}`);
    const provider   = decoded.firebase?.sign_in_provider;

    return db.runTransaction(async (t) => {
      const snap = await t.get(userRef);
      if (snap.exists) return snap.data();

      const profile = {
        uuid:        uid,
        name:        decoded.name || (decoded.email ? decoded.email.split('@')[0] : 'FinTrack User'),
        email:       decoded.email || null,
        phone:       decoded.phone_number || null,
        auth_method: PROVIDER_TO_METHOD[provider] || provider || 'email',
        avatar_url:  decoded.picture || null,
        currency:    'INR',
        is_active:   true,
        created_at:  new Date(),
        updated_at:  new Date(),
      };
      t.set(userRef, profile);
      t.set(accountRef, {
        user_id:    uid,
        name:       'Primary Account',
        type:       'savings',
        balance:    0,
        color:      '#4a9eff',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
      return profile;
    });
  })();

  bootstrapped.set(uid, promise);
  // Don't cache failures — let the next request retry.
  promise.catch(() => bootstrapped.delete(uid));
  return promise;
}

module.exports = {
  DEFAULT_CATEGORIES,
  seedDefaultCategories,
  getVisibleCategoryDocs,
  ensureUser,
};
