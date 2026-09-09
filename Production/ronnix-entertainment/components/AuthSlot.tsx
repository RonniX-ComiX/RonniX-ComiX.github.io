/**
 * AuthSlot.tsx — Sprungfreier Slot für Auth-abhängige UI (feste Fläche + Crossfade).
 *
 * Feature: zeigt `placeholder` (während Laden) oder `children` (entschieden) in einer
 * Box, die IMMER die maximale Größe beider Zustände einnimmt (Grid-Stapel, kein
 * Layout-Shift/CLS). Zustandswechsel (Gast↔User, z. B. Silent-Login mitten auf der
 * Seite) laufen als Opazitäts-Crossfade (`SSO_CONFIG.authCrossfadeMs`).
 * Use Cases: Navbar-Auth-Button
 * (Desktop/Mobil). Benutzung:
 * `<AuthSlot slotKey={...} loading={...} placeholder={...}>...</AuthSlot>`
 * Gehört NICHT hierher: Auth-Logik selbst (`context/AuthContext.tsx`).
 */

import React, { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react';
import { SSO_CONFIG } from '../utils/ssoConfig';

interface AuthSlotProps {
  /** Stabiler Schlüssel des Zustands (`'loading' | 'guest' | 'u:<uid>'`). Wechsel startet Crossfade. */
  slotKey: string;
  /** True während Auth noch klärt — zeigt `placeholder` (sollte mit Gate selten vorkommen). */
  loading: boolean;
  /** Neutraler, flächenidentischer Platzhalter (z. B. unsichtbares Button-Duplikat). */
  placeholder: ReactNode;
  /** Echter Inhalt des entschiedenen Zustands. */
  children: ReactNode;
  /** Lesename für Assistive Technologien. */
  label?: string;
  /** Extra-Klassen für den Slot-Container (Layout kommt vom Parent). */
  className?: string;
}

/**
 * Sprungfreier Auth-Slot mit Crossfade zwischen Zuständen.
 * @param slotKey Stabiler Zustandsschlüssel, siehe Props.
 * @param loading Ob Auth noch klärt.
 * @param placeholder Flächenidentischer Platzhalter.
 */
export const AuthSlot: React.FC<AuthSlotProps> = ({
  slotKey,
  loading,
  placeholder,
  children,
  label,
  className,
}) => {
  const dur = SSO_CONFIG.authCrossfadeMs;

  const [rendered, setRendered] = useState<ReactNode>(loading ? placeholder : children);
  const [previous, setPrevious] = useState<ReactNode>(null);
  const [fadeIn, setFadeIn] = useState(true);
  const lastKey = useRef(slotKey);

  useEffect(() => {
    if (lastKey.current === slotKey) {
      // Gleicher Zustand (z. B. Re-Render durch Sprachwechsel): Inhalt still nachziehen.
      setRendered(children);
      return;
    }
    lastKey.current = slotKey;
    if (dur === 0) {
      setRendered(children);
      setPrevious(null);
      setFadeIn(true);
      return;
    }
    // Überlappender Crossfade: alter Layer blendet aus, neuer ein (je `dur` ms).
    setPrevious(rendered);
    setRendered(children);
    setFadeIn(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFadeIn(true));
    });
    const t = window.setTimeout(() => setPrevious(null), dur + 60);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(t);
    };
    // `rendered` absichtlich aus Deps: Transition startet nur bei slotKey-Wechsel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey, children, dur]);

  const layerStyle = (opacity: number, interactive: boolean): CSSProperties => ({
    opacity,
    transition: dur ? `opacity ${dur}ms ease-out` : undefined,
    pointerEvents: interactive ? 'auto' : 'none',
  });

  return (
    <span
      role="group"
      aria-label={label}
      className={className}
      style={{ display: 'grid' }}
    >
      {previous !== null && (
        <span aria-hidden="true" style={{ gridArea: '1 / 1', ...layerStyle(fadeIn ? 0 : 1, false) }}>
          {previous}
        </span>
      )}
      <span style={{ gridArea: '1 / 1', ...layerStyle(previous !== null && !fadeIn ? 0 : 1, previous === null || fadeIn) }}>
        {rendered}
      </span>
    </span>
  );
};
