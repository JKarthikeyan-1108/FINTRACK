// src/firebase/authService.js
// Thin wrapper over Firebase Auth. Every sign-in method throws a user-friendly Error.
// ─────────────────────────────────────────────────────────────────────────────

import {
  signInWithPopup, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail,
  signOut, onIdTokenChanged,
} from 'firebase/auth';
import { auth } from './config';

const ERROR_MESSAGES = {
  'auth/invalid-credential':      'Invalid email or password',
  'auth/invalid-email':           'Enter a valid email address',
  'auth/user-not-found':          'Invalid email or password',
  'auth/wrong-password':          'Invalid email or password',
  'auth/email-already-in-use':    'Email already registered',
  'auth/weak-password':           'Password must be at least 6 characters',
  'auth/too-many-requests':       'Too many attempts. Try again later',
  'auth/user-disabled':           'This account has been disabled',
  'auth/network-request-failed':  'Network error. Check your connection',
  'auth/popup-closed-by-user':    'Sign-in popup was closed before finishing',
  'auth/cancelled-popup-request': 'Sign-in popup was closed before finishing',
  'auth/popup-blocked':           'Popup blocked by the browser. Allow popups and retry',
  'auth/operation-not-allowed':   'This sign-in method is not enabled in the Firebase console',
  'auth/configuration-not-found': 'Firebase Authentication is not set up for this project. Enable it in the Firebase console',
  'auth/unauthorized-domain':     'This domain is not authorized for sign-in in the Firebase console',
};

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase Auth not configured. Please add VITE_FIREBASE_* to .env');
  }
  return auth;
}

async function wrap(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.code && ERROR_MESSAGES[err.code]) throw new Error(ERROR_MESSAGES[err.code]);
    throw err;
  }
}

// ── Google Sign-In ────────────────────────────────────────────────────────────
export function firebaseGoogleSignIn() {
  return wrap(async () => {
    const result = await signInWithPopup(requireAuth(), new GoogleAuthProvider());
    return result.user;
  });
}

// ── Email / Password ──────────────────────────────────────────────────────────
export function firebaseEmailSignIn(email, password) {
  return wrap(async () => {
    const cred = await signInWithEmailAndPassword(requireAuth(), email, password);
    return cred.user;
  });
}

export function firebaseEmailSignUp(name, email, password) {
  return wrap(async () => {
    const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
      await cred.user.getIdToken(true); // refresh so the new name is in the token claims
    }
    return cred.user;
  });
}

// ── Password reset (Firebase emails a secure reset link) ──────────────────────
export function firebasePasswordReset(email) {
  return wrap(() => sendPasswordResetEmail(requireAuth(), email));
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export async function firebaseSignOut() {
  if (auth) await signOut(auth);
}

// ── ID token / auth state listener (fires on sign-in, sign-out, and token refresh) ──
export function onFirebaseIdToken(callback) {
  if (!auth) return () => {};
  return onIdTokenChanged(auth, callback);
}
