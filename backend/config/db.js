// config/db.js — Cloud Firestore handle (replaces the former SQLite wrapper)
//
// Collections (all documents carry a `user_id` field = Firebase Auth UID):
//   users, accounts, categories (user_id = null for shared defaults), transactions,
//   budgets, goals, loans, subscriptions, investments, recurring_transactions
const { getFirestore } = require('firebase-admin/firestore');
const { app } = require('./firebase');

const db = getFirestore(app);
// Controllers pass optional request fields straight through; skip the undefined ones.
db.settings({ ignoreUndefinedProperties: true });

module.exports = db;
