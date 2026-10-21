import React, { useEffect, useState } from 'react';
import { TrendingUp, ShieldCheck, Sparkles, Lock } from 'lucide-react';
import FinTrackLogo from './FinTrackLogo';

const LOADING_STATUSES = [
  'Securing 256-bit encrypted ledger...',
  'Synchronizing wealth intelligence...',
  'Calibrating real-time portfolio assets...',
  'Verifying zero-leak credentials...',
  'Preparing your financial dashboard...',
];

export default function LoadingScreen({ message, fullScreen = true }) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
    }, 1800);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const jump = Math.floor(Math.random() * 14) + 6;
        return Math.min(92, prev + jump);
      });
    }, 400);

    return () => {
      clearInterval(statusTimer);
      clearInterval(progressTimer);
    };
  }, []);

  const displayMessage = message || LOADING_STATUSES[statusIndex];

  return (
    <div
      className={`fintrack-loader-screen ${fullScreen ? 'fullscreen' : 'inline'}`}
      role="status"
      aria-live="polite"
      aria-label="Loading FinTrack..."
    >
      <style>{`
        .fintrack-loader-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-page, #FFF8F8);
          color: var(--text-primary, #292027);
          position: relative;
          overflow: hidden;
          padding: 24px;
          user-select: none;
        }
        [data-theme="dark"] .fintrack-loader-screen {
          background: var(--bg-page, #191219);
          color: var(--text-primary, #FFF1F2);
        }
        .fintrack-loader-screen.fullscreen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          min-height: 100dvh;
          width: 100vw;
        }
        .fintrack-loader-screen.inline {
          min-height: 400px;
          width: 100%;
          border-radius: var(--radius-card, 16px);
        }

        /* Ambient Glowing Background Orbs */
        .ft-loader-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          opacity: 0.45;
          animation: ftOrbFloat 6s ease-in-out infinite alternate;
        }
        .ft-loader-orb-1 {
          width: 280px;
          height: 280px;
          top: 15%;
          left: 20%;
          background: radial-gradient(circle, #702632 0%, transparent 70%);
        }
        .ft-loader-orb-2 {
          width: 260px;
          height: 260px;
          bottom: 18%;
          right: 22%;
          background: radial-gradient(circle, #A83F55 0%, transparent 70%);
          animation-delay: -3s;
        }
        [data-theme="dark"] .ft-loader-orb-1 {
          background: radial-gradient(circle, #A83F55 0%, transparent 70%);
          opacity: 0.35;
        }
        [data-theme="dark"] .ft-loader-orb-2 {
          background: radial-gradient(circle, #F2B7C3 0%, transparent 70%);
          opacity: 0.25;
        }

        @keyframes ftOrbFloat {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-24px) scale(1.12); }
        }

        /* Central Animated Core */
        .ft-loader-card {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 380px;
          width: 100%;
          padding: 32px 24px;
        }

        /* Dual-Orbit Spinning Ring System */
        .ft-orbital-system {
          position: relative;
          width: 110px;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }

        .ft-orbit-ring-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px dashed rgba(168, 63, 85, 0.45);
          animation: ftSpinClockwise 8s linear infinite;
        }
        [data-theme="dark"] .ft-orbit-ring-outer {
          border-color: rgba(242, 183, 195, 0.4);
        }

        .ft-orbit-ring-inner {
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #702632;
          border-right-color: #A83F55;
          animation: ftSpinCounter 1.8s cubic-bezier(0.68, -0.2, 0.27, 1.2) infinite;
        }
        [data-theme="dark"] .ft-orbit-ring-inner {
          border-top-color: #F2B7C3;
          border-right-color: #E18A9D;
        }

        .ft-orbit-satellite {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #A83F55;
          border-radius: 50%;
          top: -5px;
          left: calc(50% - 5px);
          box-shadow: 0 0 12px #A83F55;
        }
        [data-theme="dark"] .ft-orbit-satellite {
          background: #F2B7C3;
          box-shadow: 0 0 14px #F2B7C3;
        }

        /* Center Emblem */
        .ft-loader-emblem {
          width: 58px;
          height: 58px;
          border-radius: 18px;
          background: linear-gradient(135deg, #702632 0%, #A83F55 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 10px 25px -4px rgba(112, 38, 50, 0.45);
          position: relative;
          z-index: 3;
          animation: ftPulseEmblem 2.4s ease-in-out infinite;
        }
        [data-theme="dark"] .ft-loader-emblem {
          background: linear-gradient(135deg, #A83F55 0%, #702632 100%);
          box-shadow: 0 10px 25px -4px rgba(242, 183, 195, 0.35);
        }

        @keyframes ftSpinClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ftSpinCounter {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes ftPulseEmblem {
          0%, 100% { transform: scale(1); box-shadow: 0 10px 25px -4px rgba(112, 38, 50, 0.45); }
          50% { transform: scale(1.05); box-shadow: 0 14px 32px -2px rgba(168, 63, 85, 0.65); }
        }

        /* Brand Typography */
        .ft-loader-title {
          font-size: 1.65rem;
          font-weight: 850;
          letter-spacing: -0.03em;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-primary, #292027);
        }
        [data-theme="dark"] .ft-loader-title {
          color: var(--text-primary, #FFF1F2);
        }

        .ft-loader-subtitle {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #A83F55;
          margin-bottom: 24px;
        }
        [data-theme="dark"] .ft-loader-subtitle {
          color: #F2B7C3;
        }

        /* Progress Bar */
        .ft-progress-shell {
          width: 100%;
          height: 6px;
          background: var(--border-default, #E9DDE1);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 16px;
          position: relative;
        }
        [data-theme="dark"] .ft-progress-shell {
          background: var(--border-default, #493540);
        }

        .ft-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #702632 0%, #A83F55 50%, #E9A3B0 100%);
          transition: width 0.35s ease-out;
          position: relative;
        }
        [data-theme="dark"] .ft-progress-fill {
          background: linear-gradient(90deg, #A83F55 0%, #E18A9D 50%, #F2B7C3 100%);
        }

        .ft-progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          animation: ftShimmer 1.4s infinite;
        }

        @keyframes ftShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* Live Status Text */
        .ft-status-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary, #74636A);
          min-height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.25s ease;
        }
        [data-theme="dark"] .ft-status-text {
          color: var(--text-secondary, #D0BFC7);
        }

        /* Security Assurance Badge */
        .ft-loader-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 24px;
          padding: 6px 14px;
          border-radius: 999px;
          background: var(--brand-soft, #FFF1F2);
          border: 1px solid var(--border-default, #E9DDE1);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: #702632;
        }
        [data-theme="dark"] .ft-loader-badge {
          background: var(--brand-soft, #38232D);
          border-color: var(--border-default, #493540);
          color: #F2B7C3;
        }
      `}</style>

      {/* Decorative Orbs */}
      <div className="ft-loader-orb ft-loader-orb-1" />
      <div className="ft-loader-orb ft-loader-orb-2" />

      <div className="ft-loader-card">
        {/* Orbital System */}
        <div className="ft-orbital-system">
          <div className="ft-orbit-ring-outer">
            <div className="ft-orbit-satellite" />
          </div>
          <div className="ft-orbit-ring-inner" />
          <div className="ft-loader-emblem" style={{ background: 'transparent', boxShadow: 'none' }}>
            <FinTrackLogo size={44} glow />
          </div>
        </div>

        {/* Brand Title */}
        <div className="ft-loader-title">
          <span>FinTrack</span>
          <Sparkles size={18} color="#A83F55" />
        </div>
        <div className="ft-loader-subtitle">Wealth Intelligence</div>

        {/* Dynamic Progress Bar */}
        <div className="ft-progress-shell">
          <div className="ft-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Rotating Status Ticker */}
        <div className="ft-status-text">
          <span>{displayMessage}</span>
        </div>

        {/* Security Pledge Pill */}
        <div className="ft-loader-badge">
          <ShieldCheck size={14} />
          <span>256-Bit Encrypted &bull; Sovereign Vault</span>
        </div>
      </div>
    </div>
  );
}
