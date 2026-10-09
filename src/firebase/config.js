// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// SETUP: Add your Firebase web-app credentials to your .env file
// from https://console.firebase.google.com → Project Settings → General → Your apps
// (see .env.example). Firestore is accessed only by the Express backend (Admin SDK),
// so the browser only needs Firebase Auth.
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCKRvIso4T0Lznwd9BRmzu-bm4Eb-gYbHI",
  authDomain: "fintrack-523a2.firebaseapp.com",
  projectId: "fintrack-523a2",
  storageBucket: "fintrack-523a2.firebasestorage.app",
  messagingSenderId: "297421338726",
  appId: "1:297421338726:web:3a87cdffdc6325130d95a7",
  measurementId: "G-3KFSBNGKH6"
};

let app, auth, analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  analytics = getAnalytics(app);
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, analytics };
