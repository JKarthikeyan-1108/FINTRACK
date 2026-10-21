/**
 * src/utils/haptics.js
 * Cashew-Grade Cross-Platform Haptic Feedback Engine
 * Supports:
 *  - Native Android/iOS via @capacitor/haptics (ImpactStyle, NotificationType)
 *  - Mobile Web (Android Chrome, PWA) via navigator.vibrate
 *  - Desktop Web via synthetic Web Audio API micro-ticks (mechanical click sensation)
 *  - User preferences stored in localStorage
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Preference keys
const HAPTICS_ENABLED_KEY = 'fintrack_haptics_enabled';
const HAPTICS_INTENSITY_KEY = 'fintrack_haptics_intensity'; // 'subtle' | 'medium' | 'crisp'
const AUDIO_CLICKS_KEY = 'fintrack_audio_clicks_enabled';

// Web Audio API context for desktop mechanical micro-ticks
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a synthetic ultra-short mechanical click (for desktop browsers)
 * Gives physical tactile sensation through audio micro-pulses
 */
function playDesktopClick(freq = 1200, duration = 0.003, gain = 0.04) {
  try {
    if (!isAudioClicksEnabled()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Non-critical audio feedback fallback
  }
}

// ── Preferences Management ──────────────────────────────────────────────────

export function isHapticsEnabled() {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(HAPTICS_ENABLED_KEY);
  return val === null ? true : val === 'true';
}

export function setHapticsEnabled(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled));
}

export function getHapticsIntensity() {
  if (typeof window === 'undefined') return 'crisp';
  return localStorage.getItem(HAPTICS_INTENSITY_KEY) || 'crisp';
}

export function setHapticsIntensity(intensity) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HAPTICS_INTENSITY_KEY, intensity);
}

export function isAudioClicksEnabled() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUDIO_CLICKS_KEY) === 'true';
}

export function setAudioClicksEnabled(enabled) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUDIO_CLICKS_KEY, String(enabled));
}

// ── Native & Web Haptic Dispatches ──────────────────────────────────────────

/**
 * Numpad Keypress / Discrete Selection Tick
 * Ultra-short tactile feedback for Cashew numpad entry
 */
export async function tick() {
  if (!isHapticsEnabled()) return;

  try {
    // 1. Try Native Capacitor Haptics
    await Haptics.impact({ style: ImpactStyle.Light });
    return;
  } catch {
    // Fall back to Web Vibration or Desktop Audio
  }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(8);
      return;
    } catch {
      // Ignore vibration restrictions
    }
  }

  // Desktop audio fallback
  playDesktopClick(1400, 0.003, 0.035);
}

/**
 * Selection Changed (Chips, Segmented Controls, Category Switch)
 */
export async function selection() {
  if (!isHapticsEnabled()) return;

  try {
    await Haptics.selectionChanged();
    return;
  } catch {
    // Fall through
  }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(12);
      return;
    } catch {}
  }

  playDesktopClick(1100, 0.004, 0.04);
}

/**
 * Light Impact (Button press, tab switch)
 */
export async function impactLight() {
  if (!isHapticsEnabled()) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
    return;
  } catch {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(15);
      return;
    } catch {}
  }

  playDesktopClick(950, 0.005, 0.05);
}

/**
 * Medium Impact (Sheet open, modal confirm, filter apply)
 */
export async function impactMedium() {
  if (!isHapticsEnabled()) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
    return;
  } catch {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(25);
      return;
    } catch {}
  }

  playDesktopClick(750, 0.006, 0.06);
}

/**
 * Heavy Impact (Delete, transaction commit)
 */
export async function impactHeavy() {
  if (!isHapticsEnabled()) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    return;
  } catch {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(40);
      return;
    } catch {}
  }

  playDesktopClick(500, 0.008, 0.08);
}

/**
 * Success Notification (Transaction Saved, Goal Reached)
 * Cashew-style double celebratory vibration
 */
export async function notificationSuccess() {
  if (!isHapticsEnabled()) return;

  try {
    await Haptics.notification({ type: NotificationType.Success });
    return;
  } catch {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([15, 45, 30]);
      return;
    } catch {}
  }

  playDesktopClick(1600, 0.005, 0.05);
  setTimeout(() => playDesktopClick(2200, 0.006, 0.06), 70);
}

/**
 * Warning / Error Notification
 */
export async function notificationWarning() {
  if (!isHapticsEnabled()) return;

  try {
    await Haptics.notification({ type: NotificationType.Warning });
    return;
  } catch {}

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([30, 60, 30]);
      return;
    } catch {}
  }

  playDesktopClick(350, 0.01, 0.08);
}

/**
 * Universal trigger helper
 */
export function triggerHaptic(type = 'light') {
  switch (type) {
    case 'tick':
      return tick();
    case 'selection':
      return selection();
    case 'medium':
      return impactMedium();
    case 'heavy':
      return impactHeavy();
    case 'success':
      return notificationSuccess();
    case 'warning':
    case 'error':
      return notificationWarning();
    case 'light':
    default:
      return impactLight();
  }
}

// ── Default Export Object ───────────────────────────────────────────────────

const haptics = {
  tick,
  selection,
  impactLight,
  impactMedium,
  impactHeavy,
  notificationSuccess,
  notificationWarning,
  triggerHaptic,
  isHapticsEnabled,
  setHapticsEnabled,
  getHapticsIntensity,
  setHapticsIntensity,
  isAudioClicksEnabled,
  setAudioClicksEnabled,
};

export default haptics;
