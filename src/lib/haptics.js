// src/lib/haptics.js — Mobile tactile haptic feedback for Web & Capacitor
export function triggerHaptic(type = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    switch (type) {
      case 'selection':
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(22);
        break;
      case 'success':
        navigator.vibrate([15, 40, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 60, 30]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Ignore environments that restrict vibration permissions
  }
}
