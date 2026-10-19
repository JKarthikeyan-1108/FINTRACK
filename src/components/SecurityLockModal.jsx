import { useState, useEffect } from 'react';
import { ShieldCheck, Delete, Fingerprint, Lock } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { triggerHaptic } from '../lib/haptics';

export default function SecurityLockModal() {
  const { isLocked, unlock, biometricAvailable } = useSecurity();
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isLocked) {
      setPin('');
      setErrorMsg('');
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleKeyPress = async (digit) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    triggerHaptic('selection');

    if (nextPin.length === 4) {
      const success = await unlock(nextPin);
      if (!success) {
        setErrorShake(true);
        setErrorMsg('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setPin('');
          setErrorShake(false);
        }, 500);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
      setErrorMsg('');
      triggerHaptic('light');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Security Screen Lock"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(9, 13, 22, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        style={{
          width: 'min(360px, 92vw)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Shield Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'grid',
            placeItems: 'center',
            color: '#10b981',
            marginBottom: 20,
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.2)',
          }}
        >
          <ShieldCheck size={32} strokeWidth={2.5} />
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: 6 }}>
          FinTrack Vault Locked
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 28 }}>
          Enter your 4-digit security PIN to unlock your financial records.
        </p>

        {/* Masked PIN Indicator Dots */}
        <div
          className={errorShake ? 'shake-animation' : ''}
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: errorMsg ? 12 : 32,
            transition: 'transform 0.15s ease',
          }}
        >
          {[0, 1, 2, 3].map(idx => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: isFilled ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.2)',
                  background: isFilled ? '#10b981' : 'transparent',
                  boxShadow: isFilled ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div style={{ color: '#f43f5e', fontSize: '0.82rem', fontWeight: 600, marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}

        {/* 3x4 Numeric Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            width: '100%',
            maxWidth: 280,
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(String(num))}
              style={{
                height: 64,
                borderRadius: 16,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f8fafc',
                fontSize: '1.45rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
                transition: 'all 0.12s ease',
                outline: 'none',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {num}
            </button>
          ))}

          {/* Bottom Row: Biometric, 0, Backspace */}
          <div style={{ display: 'grid', placeItems: 'center' }}>
            {biometricAvailable && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  // Trigger biometric unlock if configured
                }}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: '#10b981',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
                title="Unlock with Biometrics"
                aria-label="Unlock with Biometrics"
              >
                <Fingerprint size={28} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            style={{
              height: 64,
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#f8fafc',
              fontSize: '1.45rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              transition: 'all 0.12s ease',
              outline: 'none',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            style={{
              height: 64,
              borderRadius: 16,
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              outline: 'none',
            }}
            title="Delete digit"
            aria-label="Delete digit"
          >
            <Delete size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
