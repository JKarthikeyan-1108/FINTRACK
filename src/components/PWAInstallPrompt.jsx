import { useState, useEffect } from 'react';
import { Download, Share2, X, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export default function PWAInstallPrompt({ compact = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('fintrack_pwa_dismissed') === 'true';
  });

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        triggerHaptic('success');
      }
    } else if (isIOS) {
      setShowIOSTip(prev => !prev);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem('fintrack_pwa_dismissed', 'true');
    triggerHaptic('light');
  };

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  if (compact) {
    return (
      <button
        type="button"
        className="pwa-install-pill"
        onClick={handleInstallClick}
        title="Install FinTrack App on your device"
        aria-label="Install FinTrack App"
      >
        <Download size={14} strokeWidth={2.5} />
        <span>Install App</span>
      </button>
    );
  }

  return (
    <div className="pwa-install-banner">
      <div className="pwa-install-inner" onClick={handleInstallClick}>
        <div className="pwa-install-icon">
          <Download size={18} strokeWidth={2.4} />
        </div>
        <div className="pwa-install-text">
          <strong>Install FinTrack App</strong>
          <span>Fast, offline access from your home screen</span>
        </div>
      </div>
      <button
        type="button"
        className="pwa-install-close"
        onClick={handleDismiss}
        aria-label="Dismiss installation prompt"
      >
        <X size={14} />
      </button>

      {showIOSTip && (
        <div className="pwa-ios-tooltip">
          <Share2 size={16} />
          <span>Tap <strong>Share</strong> in Safari, then select <strong>Add to Home Screen ⊞</strong>.</span>
        </div>
      )}
    </div>
  );
}
