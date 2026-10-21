import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * useFinTrackPlatform
 * Provides deterministic platform separation between Desktop Web (>= 1024px)
 * and Mobile (Capacitor Android APK or viewport < 1024px).
 */
export function useFinTrackPlatform() {
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isNative = Capacitor.isNativePlatform();
  const isMobile = isNative || windowWidth < 1024;
  const isDesktop = !isMobile;

  return {
    isNative,
    isMobile,
    isDesktop,
    platform: isNative ? 'native' : isMobile ? 'mobile-web' : 'desktop-web',
    windowWidth,
  };
}

export default useFinTrackPlatform;
