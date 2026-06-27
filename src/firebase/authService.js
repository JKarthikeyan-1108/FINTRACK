// src/firebase/authService.js
// Wraps Firebase Auth methods. Falls back gracefully to demo/JWT mode.
// ─────────────────────────────────────────────────────────────────────────────

// When Firebase is configured, uncomment these imports:
// import {
//   signInWithPopup, GoogleAuthProvider,
//   signInWithEmailAndPassword, createUserWithEmailAndPassword,
//   signInWithPhoneNumber, RecaptchaVerifier,
//   signOut, onAuthStateChanged,
// } from 'firebase/auth';
// import { auth } from './config';

// ── Google Sign-In ────────────────────────────────────────────────────────────
export async function firebaseGoogleSignIn() {
  // const provider = new GoogleAuthProvider();
  // const result   = await signInWithPopup(auth, provider);
  // return { uid: result.user.uid, email: result.user.email, name: result.user.displayName };
  throw new Error('Firebase not configured — using JWT backend instead');
}

// ── Email / Password ──────────────────────────────────────────────────────────
export async function firebaseEmailSignIn(email, password) {
  // const cred = await signInWithEmailAndPassword(auth, email, password);
  // return { uid: cred.user.uid, email: cred.user.email };
  throw new Error('Firebase not configured — using JWT backend instead');
}

export async function firebaseEmailSignUp(email, password) {
  // const cred = await createUserWithEmailAndPassword(auth, email, password);
  // return { uid: cred.user.uid, email: cred.user.email };
  throw new Error('Firebase not configured');
}

// ── Phone OTP ─────────────────────────────────────────────────────────────────
export async function firebaseSendOTP(phoneNumber, recaptchaContainer = 'recaptcha-container') {
  // const verifier  = new RecaptchaVerifier(recaptchaContainer, { size:'invisible' }, auth);
  // const confirm   = await signInWithPhoneNumber(auth, phoneNumber, verifier);
  // return confirm; // call confirm.confirm(otp) to verify
  throw new Error('Firebase not configured');
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export async function firebaseSignOut() {
  // await signOut(auth);
}

// ── Auth State Listener ───────────────────────────────────────────────────────
export function onFirebaseAuthState(callback) {
  // return onAuthStateChanged(auth, callback);
  return () => {}; // no-op unsubscribe in demo mode
}
