// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// SETUP: Add your Firebase web-app credentials to your .env file
// from https://console.firebase.google.com → Project Settings → General → Your apps
// (see .env.example). Firestore is accessed only by the Express backend (Admin SDK),
// so the browser only needs Firebase Auth.
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, auth;

try {
  if (firebaseConfig.apiKey) {
    app  = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn('Firebase config is missing in .env — sign-in is disabled until VITE_FIREBASE_* values are set.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth };
