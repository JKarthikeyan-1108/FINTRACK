import { useState, useEffect, useRef } from 'react';
import { Delete, Check } from 'lucide-react';
import { tick, impactLight, impactHeavy } from '../../utils/haptics';

/**
 * Cashew-Grade Tactile Numeric Keypad
 * Features:
 *  - Instant haptic ticks on every keypress
 *  - Strict 2-decimal financial limit
 *  - Long press on Backspace to clear with heavy vibration
 *  - Spring active press micro-animations
 */
export default function CashewNumpad({ value = '', onChange, onSubmit, submitLabel = 'Confirm' }) {
  const longPressTimer = useRef(null);

  const handleKeyPress = (char) => {
    tick();

    if (char === '.') {
      if (!value || value === '0') {
        onChange('0.');
        return;
      }
      if (value.includes('.')) return;
      onChange(value + '.');
      return;
    }

    if (char === '0') {
      if (value === '0') return;
      if (value.includes('.') && value.split('.')[1].length >= 2) return;
      onChange(value + '0');
      return;
    }

    // Numbers 1-9
    if (value === '0') {
      onChange(char);
      return;
    }
    if (value.includes('.') && value.split('.')[1].length >= 2) return;
    onChange(value + char);
  };

  const handleBackspace = () => {
    impactLight();
    if (!value || value.length <= 1) {
      onChange('');
      return;
    }
    onChange(value.slice(0, -1));
  };

  const handleBackspaceTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      impactHeavy();
      onChange('');
    }, 600);
  };

  const handleBackspaceTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

  return (
    <div className="cashew-numpad">
      <div className="cashew-numpad-grid">
        {keys.map((k) => {
          if (k === 'del') {
            return (
              <button
                key="del"
                type="button"
                className="numpad-key numpad-key-action"
                onClick={handleBackspace}
                onTouchStart={handleBackspaceTouchStart}
                onTouchEnd={handleBackspaceTouchEnd}
                onMouseDown={handleBackspaceTouchStart}
                onMouseUp={handleBackspaceTouchEnd}
                aria-label="Backspace"
                title="Backspace (Hold to clear)"
              >
                <Delete size={22} strokeWidth={2.2} />
              </button>
            );
          }

          return (
            <button
              key={k}
              type="button"
              className={`numpad-key ${k === '.' ? 'numpad-key-dot' : ''}`}
              onClick={() => handleKeyPress(k)}
              aria-label={k}
            >
              {k}
            </button>
          );
        })}
      </div>

      {onSubmit && (
        <button
          type="button"
          className="numpad-submit-btn"
          onClick={() => {
            impactHeavy();
            onSubmit();
          }}
        >
          <Check size={20} strokeWidth={2.8} />
          <span>{submitLabel}</span>
        </button>
      )}
    </div>
  );
}
