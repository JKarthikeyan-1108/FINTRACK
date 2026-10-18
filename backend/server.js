require('dotenv').config();
const app = require('./app');
const { seedDefaultCategories } = require('./utils/firestoreHelpers');
const processRecurringTransactions = require('./utils/recurringProcessor');

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀  FinTrack API v2  →  http://localhost:${PORT}`);
    console.log(`🌍  Env: ${process.env.NODE_ENV || 'development'}`);
    console.log('🔥  Database: Cloud Firestore · Auth: Firebase ID tokens\n');

    seedDefaultCategories()
      .then(() => {
        processRecurringTransactions();
        if (process.env.VERCEL !== '1') {
          setInterval(processRecurringTransactions, 60 * 60 * 1000);
        }
      })
      .catch(err => {
        console.error('❌  Could not reach Firestore:', err.message);
        console.error('    Enable Cloud Firestore and grant the service account access.');
      });
  });
}

module.exports = app;
