/**
 * WarpScreen.tsx — Einheitlicher Sector-Jump-Screen für alle Weiterleitungen.
 *
 * Feature: EINE visuelle Sprache für WarpOverlay (Navbar), SSOCallback, SSOBounce
 * (Vollmodus), SSOSeed und GlobalLogout. Signatur: Zielsektor-Readout
 * ("TARGET SECTOR — RONNIXCOMIX.DE") + Phasenanzeige an echtem State
 * (`preparing → transfer → docking → error`, kein Fake-Fortschritt).
 * System-Fonts only (Arial Black/Impact-Fallback): kein Webfont-Download, kein FOUT
 * auf frischer Origin. Nur transform/opacity-Animationen (GPU), `prefers-reduced-motion`
 * → statisch. Use Cases: jede sichtbare Domain-Weiterleitung. Benutzung:
 * `<WarpScreen phase="transfer" targetLabel="RONNIXCOMIX.DE" />`
 * Gehört NICHT hierher: Routing/Token-Logik, Seitenübergänge (View Transitions).
 */

import React, { useEffect, useState } from 'react';
import { SSO_CONFIG } from '../utils/ssoConfig';

/** Sichtbare Phasen des Sprungs, an echten Async-State gekoppelt. */
export type WarpPhase = 'preparing' | 'transfer' | 'docking' | 'error';

interface WarpScreenProps {
  /** Aktuelle Phase (Default `transfer`). */
  phase?: WarpPhase;
  /** Ziel-Lesename, z. B. `RONNIXCOMIX.DE` (nur wenn bekannt). */
  targetLabel?: string | null;
  /** Überschreibt den Phasen-Standardtext. */
  message?: string | null;
  /** Fehlertext (erzwingt Phase `error`). */
  error?: string | null;
  /** Lesename für Assistive Technologien. */
  label?: string;
}

/** Display-Stack ohne Webfont: kein Download, kein Swap auf frischer Origin. */
const DISPLAY_STACK = "'Arial Black', 'Arial Bold', Impact, ui-sans-serif, system-ui, sans-serif";
const MONO_STACK = "ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace";

const PHASE_TEXT: Record<Exclude<WarpPhase, 'error'>, string> = {
  preparing: 'Charging Warp Drive…',
  transfer: 'Jumping Sectors…',
  docking: 'Docking…',
};

const PHASE_INDEX: Record<Exclude<WarpPhase, 'error'>, number> = {
  preparing: 0,
  transfer: 1,
  docking: 2,
};

/**
 * Comic-Warp-Ring (Inline-SVG im Spiel-Stil, keine Icon-Lib nötig).
 */
const WarpRing: React.FC = () => (
  <svg viewBox="0 0 120 120" className="warp-animated h-20 w-20" role="img" aria-label="Warp aktiv" style={{ animation: 'warp-ring-rotate 2.4s linear infinite' }}>
    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
    <circle
      cx="60" cy="60" r="54" fill="none" stroke="#dc2626" strokeWidth="3"
      strokeLinecap="round" strokeDasharray="70 270"
    />
    <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
    <circle
      cx="60" cy="60" r="40" fill="none" stroke="#ffffff" strokeWidth="2"
      strokeLinecap="round" strokeDasharray="20 232" opacity="0.7"
    />
    <rect x="52" y="52" width="16" height="16" fill="#dc2626" transform="rotate(45 60 60)" />
  </svg>
);

/**
 * Einheitlicher Weiterleitungs-Screen mit Phasen und Zielsektor-Readout.
 * @param phase Echte Async-Phase, siehe `WarpPhase`.
 * @param targetLabel Optionaler Zielsektor-Name (bereits normalisiert/groß).
 */
export const WarpScreen: React.FC<WarpScreenProps> = ({
  phase = 'transfer',
  targetLabel = null,
  message = null,
  error = null,
  label = 'Domain-Wechsel läuft',
}) => {
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const effectivePhase: WarpPhase = error ? 'error' : phase;
  const isError = effectivePhase === 'error';
  const activeStep = isError ? -1 : PHASE_INDEX[effectivePhase];
  const statusText = error ?? message ?? PHASE_TEXT[effectivePhase as Exclude<WarpPhase, 'error'>];
  const crossfadeMs = reduceMotion ? 0 : SSO_CONFIG.authCrossfadeMs;

  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-neutral-950"
      style={{ minHeight: '100dvh' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black opacity-80" />

      {/* Speed-Linien (GPU: nur transform/opacity) */}
      {!reduceMotion && (
        <div className="absolute inset-0 overflow-hidden opacity-30" aria-hidden="true">
          <div className="warp-animated absolute left-1/2 top-1/2 h-[2px] w-[200vw] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" style={{ animation: 'warp-streak-pulse 1.6s ease-in-out infinite' }} />
          <div className="warp-animated absolute left-1/2 top-1/2 h-[2px] w-[200vw] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-red-500" style={{ animation: 'warp-streak-pulse 1.6s ease-in-out 0.2s infinite' }} />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
        {isError ? (
          <svg viewBox="0 0 24 24" className="h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="1.8" role="img" aria-label="Warnung">
            <path d="M12 3 2.5 20h19L12 3z" strokeLinejoin="round" />
            <path d="M12 9.5v5" strokeLinecap="round" />
            <circle cx="12" cy="17" r="0.6" fill="currentColor" />
          </svg>
        ) : (
          <WarpRing />
        )}

        <h2
          className="text-3xl uppercase text-white"
          style={{
            fontFamily: DISPLAY_STACK,
            letterSpacing: '0.12em',
            textShadow: '0 0 12px rgba(220,38,38,0.8), 2px 2px 0 rgba(0,0,0,1)',
          }}
        >
          {isError ? 'Jump Failed' : 'Warp Drive Active'}
        </h2>

        {targetLabel && !isError && (
          <p
            className="text-xs uppercase text-neutral-300"
            style={{ fontFamily: MONO_STACK, letterSpacing: '0.28em' }}
          >
            Target Sector — <span className="text-red-400">{targetLabel}</span>
          </p>
        )}

        {/* Phasen-Treppe: 3 Stufen, aktive pulsiert (echter State, kein Fake-Fortschritt) */}
        {!isError && (
          <div className="flex items-center gap-2" aria-hidden="true">
            {[0, 1, 2].map((step) => (
              <span
                key={step}
                className={`h-1.5 rounded-full transition-all ${step <= activeStep ? 'bg-red-600' : 'bg-neutral-800'}`}
                style={{
                  width: step === activeStep && !reduceMotion ? 34 : 18,
                  transitionDuration: `${crossfadeMs}ms`,
                  opacity: step < activeStep ? 0.55 : 1,
                }}
              />
            ))}
          </div>
        )}

        <p
          className={`text-sm ${isError ? 'text-yellow-500' : 'text-red-400'}`}
          style={{ fontFamily: MONO_STACK }}
        >
          {statusText}
        </p>
      </div>
    </div>
  );
};
