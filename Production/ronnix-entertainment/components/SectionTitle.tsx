/**
 * SectionTitle.tsx — Einheitliche Sektions-Überschrift (Eyebrow + H2).
 *
 * Feature: optionale SECTOR-Eyebrow (Pixel-Font `font-gaming`, rot,
 * sprachneutral — Gaming-Lingua-franca wie „PRESS START") über zentrierter
 * Retro-H2 mit hartem Rot-Schatten. Benutzung:
 * `<SectionTitle title={...} eyebrow="PANEL SECTOR" />` in allen Sections.
 * Gehört NICHT hierher: Layout (Sections), Fließtext-Größen (≥12px-Regel:
 * Eyebrow ist Deko-Kurzcode, kein Lesetext).
 */

import React from 'react';

interface SectionTitleProps {
  title: string;
  /** Sektor-Code über der H2 (z. B. `"PANEL SECTOR"`), Pixel-Font. */
  eyebrow?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, eyebrow }) => {
  return (
    <div className="text-center mb-12">
      {eyebrow && (
        <p className="font-gaming text-[10px] md:text-xs tracking-[0.35em] uppercase text-red-500 mb-4">
          {eyebrow}
        </p>
      )}
      <h2 className="font-retro text-4xl md:text-5xl text-white drop-shadow-[2px_2px_0_rgba(220,38,38,1)]">
        {title}
      </h2>
    </div>
  );
};