/**
 * SectorCard.tsx — Comic-Bezel-Hülle für alle Post-Karten (Single Source).
 *
 * Feature: weißer Bezel-Rahmen (`bg-white p-1.5`, schwarzer Doppelrand) mit
 * hartem Offset-Schatten in Sektor-Farbe (Hover: größer) + optionalem Tilt
 * (−1°/+1° im Wechsel = Comic-Wand-Rhythmus). Innen liegt die jeweilige
 * Karten-Gestaltung (Sections), außen immer dieselbe Sprache.
 * JIT-Hinweis: Schatten-Klassen stehen als Voll-Strings in `ACCENT_SHADOW`
 * (dynamisch gebaute Klassen würde Tailwind nicht generieren).
 * Benutzung: `<SectorCard to accent tilt dimmed className>` in allen
 * Kategorie-Sections + LatestPosts. Referenz: `ComicsSection` (Ur-Muster).
 * Gehört NICHT hierher: Karten-Inhalte (Sections), Badges (Sections).
 */

import React from 'react';
import { Link } from 'react-router-dom';

export type SectorAccent = 'pink' | 'red' | 'blue' | 'green' | 'yellow' | 'orange';

const ACCENT_SHADOW: Record<SectorAccent, string> = {
  pink: 'hover:shadow-[5px_5px_0_rgba(236,72,153,1)]',
  red: 'hover:shadow-[5px_5px_0_rgba(220,38,38,1)]',
  blue: 'hover:shadow-[5px_5px_0_rgba(59,130,246,1)]',
  green: 'hover:shadow-[5px_5px_0_rgba(34,197,94,1)]',
  yellow: 'hover:shadow-[5px_5px_0_rgba(250,204,21,1)]',
  orange: 'hover:shadow-[5px_5px_0_rgba(249,115,22,1)]',
};

/**
 * Firestore-Kategorie → Sektor-Akzent (eine Farbe pro Welt).
 * @param cat Kategorie-Key oder Falsy.
 */
export const categoryAccent = (cat?: string): SectorAccent => {
  switch (cat) {
    case 'news': return 'pink';
    case 'comics': return 'red';
    case 'books': return 'blue';
    case 'games': return 'green';
    case 'movies': return 'yellow';
    case 'series': return 'orange';
    default: return 'red';
  }
};

const TILT_CLASS: Record<-1 | 0 | 1, string> = {
  '-1': 'rotate-[-1deg]',
  '0': '',
  '1': 'rotate-[1deg]',
};

export interface SectorCardProps {
  /** Internes Link-Ziel (bereits lokalisiert). */
  to: string;
  /** Sektor-Farbe des Hover-Schattens. */
  accent: SectorAccent;
  /** Tilt-Rhythmus: -1 | 0 | 1 (Default 0). */
  tilt?: -1 | 0 | 1;
  /** Gedimmt (Scheduled-Posts). */
  dimmed?: boolean;
  /** Layout-Klassen der Hülle (Aspect, Breite, Snap …). */
  className?: string;
  children: React.ReactNode;
}

/**
 * Comic-Bezel-Karte: Link-Hülle + Schatten in Sektor-Farbe.
 * @param to Internes Ziel.
 * @param accent Schatten-Farbe bei Hover.
 * @param tilt Neigung für Wand-Rhythmus.
 * @param dimmed Scheduled-Dimmung.
 * @param className Layout der Hülle.
 */
export const SectorCard: React.FC<SectorCardProps> = ({
  to,
  accent,
  tilt = 0,
  dimmed = false,
  className = '',
  children,
}) => (
  <Link
    to={to}
    className={`group block bg-white p-1.5 rounded-xl border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:-translate-y-1 hover:rotate-0 transition duration-300 ease-game ${ACCENT_SHADOW[accent]} ${TILT_CLASS[tilt]} ${dimmed ? 'opacity-70' : ''} ${className}`}
  >
    {children}
  </Link>
);
