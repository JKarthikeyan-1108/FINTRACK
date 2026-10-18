// src/firebase/config.js
// Client SDK is used for Firebase Auth only. Firestore is accessed through the API.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCKRvIso4T0Lznwd9BRmzu-bm4Eb-gYbHI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fintrack-523a2.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fintrack-523a2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fintrack-523a2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '297421338726',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:297421338726:web:3a87cdffdc6325130d95a7',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-3KFSBNGKH6',
};

let app;
let auth;
let analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  if (typeof window !== 'undefined') {
    isSupported().then((ok) => {
      if (ok) analytics = getAnalytics(app);
    }).catch(() => {});
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { app, auth, analytics };
