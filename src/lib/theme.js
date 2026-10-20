// src/lib/theme.js
/**
 * FinTrack Theme Management Utility
 * Supports 3 user preferences: 'light' | 'dark' | 'system'
 * Respects OS media query (prefers-color-scheme: dark) in system mode.
 * Persists user choice in localStorage.
 */

export const THEME_PREFERENCE_KEY = 'themePreference';
export const LEGACY_THEME_KEY = 'theme'; // For backward compatibility

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredThemePreference() {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    // Check legacy key
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy === 'light' || legacy === 'dark') {
      return legacy;
    }
  } catch (err) {
    // localStorage may be disabled or restricted
  }
  return 'system';
}

export function resolveEffectiveTheme(preference) {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference === 'dark' ? 'dark' : 'light';
}

export function applyTheme(preference) {
  const effective = resolveEffectiveTheme(preference);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.setAttribute('data-theme-preference', preference);
    document.documentElement.style.colorScheme = effective;

    // Update browser theme-color meta tag for mobile address bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', effective === 'dark' ? '#191219' : '#702632');
    }
  }

  try {
    localStorage.setItem(THEME_PREFERENCE_KEY, preference);
    localStorage.setItem(LEGACY_THEME_KEY, effective);
  } catch (err) {
    // ignore storage errors
  }

  return effective;
}
