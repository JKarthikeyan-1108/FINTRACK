// config/firebase.js — Firebase Admin SDK bootstrap (Auth + Firestore)
//
// Credentials are resolved in this order:
//   1. FIREBASE_SERVICE_ACCOUNT_PATH  → path to the service-account JSON file
//   2. FIREBASE_SERVICE_ACCOUNT_JSON  → the service-account JSON as a string (Docker / hosting)
//   3. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
//   4. Emulator (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST) or
//      GOOGLE_APPLICATION_CREDENTIALS, using FIREBASE_PROJECT_ID
require('dotenv').config();
const fs    = require('fs');
const path  = require('path');
const { initializeApp, getApps, getApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function loadServiceAccount() {
  const {
    FIREBASE_SERVICE_ACCOUNT_PATH,
    FIREBASE_SERVICE_ACCOUNT_JSON,
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (FIREBASE_SERVICE_ACCOUNT_PATH) {
    const file = path.resolve(__dirname, '..', FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!fs.existsSync(file)) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_PATH not found: ${file}`);
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  if (FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId:   FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // .env files store newlines as the two characters "\n"
      privateKey:  FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function init() {
  if (getApps().length) return getApp();

  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    return initializeApp({ credential: cert(serviceAccount) });
  }

  const usingEmulator = process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if ((usingEmulator || process.env.GOOGLE_APPLICATION_CREDENTIALS) && process.env.FIREBASE_PROJECT_ID) {
    return initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  }

  throw new Error(
    'Firebase credentials missing. Set FIREBASE_SERVICE_ACCOUNT_PATH (or FIREBASE_SERVICE_ACCOUNT_JSON, ' +
    'or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) in backend/.env'
  );
}

let app;
try {
  app = init();
  console.log(`✅  Firebase Admin initialised — project: ${app.options.projectId || '(from credentials)'}`);
} catch (err) {
  console.error('❌  Firebase initialisation failed:', err.message);
  process.exit(1);
}

module.exports = { app, auth: () => getAuth(app) };
