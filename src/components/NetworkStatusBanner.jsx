import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      triggerHaptic('success');
      const timer = setTimeout(() => setShowRestored(false), 3200);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      triggerHaptic('warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`network-status-banner ${!isOnline ? 'offline' : 'online'}`}
    >
      <div className="network-status-content">
        {!isOnline ? (
          <>
            <WifiOff size={15} strokeWidth={2.4} />
            <span>Offline Mode • Service Worker Caching Active</span>
          </>
        ) : (
          <>
            <Wifi size={15} strokeWidth={2.4} />
            <span>Connection Restored • Live Sync Active</span>
          </>
        )}
      </div>
    </div>
  );
}
