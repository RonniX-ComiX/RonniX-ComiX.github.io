/**
 * SectionTitle.tsx — Einheitliche Sektions-Überschrift (H2).
 *
 * Feature: zentrierte Retro-H2 mit hartem Rot-Schatten. Benutzung:
 * `<SectionTitle title={...} />` in allen Sections und Legal-/Formular-Seiten.
 * Gehört NICHT hierher: Layout (Sections), Fließtext-Größen.
 */

import React from 'react';

interface SectionTitleProps {
  title: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title }) => {
  return (
    <div className="text-center mb-12">
      <h2 className="font-retro text-4xl md:text-5xl text-white drop-shadow-[2px_2px_0_rgba(220,38,38,1)]">
        {title}
      </h2>
    </div>
  );
};