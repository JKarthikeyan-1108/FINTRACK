import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { triggerHaptic } from '../lib/haptics';

const SecurityContext = createContext(null);

async function hashPin(pin) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback simple hash for older environments
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      hash = ((hash << 5) - hash) + pin.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(`fintrack_salt_${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function SecurityProvider({ children }) {
  const [pinEnabled, setPinEnabled] = useState(() => {
    return localStorage.getItem('fintrack_pin_enabled') === 'true';
  });
  const [isLocked, setIsLocked] = useState(() => {
    const enabled = localStorage.getItem('fintrack_pin_enabled') === 'true';
    return enabled; // If PIN is enabled, lock on initial app launch
  });
  const [autoLockTimeout, setAutoLockTimeout] = useState(() => {
    return Number(localStorage.getItem('fintrack_autolock_mins') || 5);
  });
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const lastActivityRef = useRef(Date.now());

  // Check WebAuthn Biometric Availability
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          .then(avail => setBiometricAvailable(avail))
          .catch(() => setBiometricAvailable(false));
      }
    }
  }, []);

  const lockNow = useCallback(() => {
    if (pinEnabled) {
      setIsLocked(true);
      triggerHaptic('warning');
    }
  }, [pinEnabled]);

  const unlock = useCallback(async (inputPin) => {
    const savedHash = localStorage.getItem('fintrack_pin_hash');
    if (!savedHash) {
      setIsLocked(false);
      return true;
    }
    const inputHash = await hashPin(inputPin);
    if (inputHash === savedHash) {
      setIsLocked(false);
      lastActivityRef.current = Date.now();
      triggerHaptic('success');
      return true;
    } else {
      triggerHaptic('warning');
      return false;
    }
  }, []);

  const setupPin = useCallback(async (newPin) => {
    const hashed = await hashPin(newPin);
    localStorage.setItem('fintrack_pin_hash', hashed);
    localStorage.setItem('fintrack_pin_enabled', 'true');
    setPinEnabled(true);
    triggerHaptic('success');
  }, []);

  const disablePin = useCallback(() => {
    localStorage.removeItem('fintrack_pin_hash');
    localStorage.setItem('fintrack_pin_enabled', 'false');
    setPinEnabled(false);
    setIsLocked(false);
    triggerHaptic('light');
  }, []);

  const updateAutoLock = useCallback((mins) => {
    setAutoLockTimeout(mins);
    localStorage.setItem('fintrack_autolock_mins', String(mins));
  }, []);

  // Inactivity and App Visibility Listener
  useEffect(() => {
    if (!pinEnabled) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background (mobile app switch or tab switch)
        if (autoLockTimeout === 0) {
          lockNow();
        }
      } else {
        // App returned to foreground
        const elapsedMinutes = (Date.now() - lastActivityRef.current) / (1000 * 60);
        if (autoLockTimeout > 0 && elapsedMinutes >= autoLockTimeout) {
          lockNow();
        }
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pinEnabled, autoLockTimeout, lockNow]);

  return (
    <SecurityContext.Provider
      value={{
        pinEnabled,
        isLocked,
        lockNow,
        unlock,
        setupPin,
        disablePin,
        autoLockTimeout,
        updateAutoLock,
        biometricAvailable,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return ctx;
}
