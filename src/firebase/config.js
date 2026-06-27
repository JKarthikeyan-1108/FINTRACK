// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// SETUP: Replace the placeholder values below with your actual Firebase project
// credentials from https://console.firebase.google.com → Project Settings → SDK
// ─────────────────────────────────────────────────────────────────────────────
// import { initializeApp } from 'firebase/app';
// import { getAuth }       from 'firebase/auth';
// import { getFirestore }  from 'firebase/firestore';
//
// const firebaseConfig = {
//   apiKey:            "YOUR_API_KEY",
//   authDomain:        "YOUR_PROJECT.firebaseapp.com",
//   projectId:         "YOUR_PROJECT_ID",
//   storageBucket:     "YOUR_PROJECT.appspot.com",
//   messagingSenderId: "YOUR_SENDER_ID",
//   appId:             "YOUR_APP_ID",
// };
//
// export const app       = initializeApp(firebaseConfig);
// export const auth      = getAuth(app);
// export const firestore = getFirestore(app);

// ── DEMO MODE (no Firebase required) ─────────────────────────────────────────
// The app runs in demo mode using the existing JWT backend.
// When you add your Firebase config above and uncomment it, the AuthService
// below will automatically use real Firebase auth.
export const auth      = null;
export const firestore = null;
