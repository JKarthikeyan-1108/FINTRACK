// config/initDB.js — Run: node config/initDB.js  (npm run db:init)
// Firestore is schemaless, so there are no tables to create. This script just seeds
// the shared default categories (idempotent — safe to run any number of times).
const { seedDefaultCategories } = require('../utils/firestoreHelpers');

async function initDB() {
  console.log('📦  Seeding Firestore default categories...');
  const count = await seedDefaultCategories();
  console.log(`✅  ${count} default categories ready`);
  process.exit(0);
}

initDB().catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
