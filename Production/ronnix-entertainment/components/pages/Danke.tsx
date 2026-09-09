/**
 * Danke.tsx — Bestätigungsseite nach Kontaktformular-Versand.
 *
 * Feature: zeigt die Empfangsbestätigung (`t.home.contact.thanksTitle/Text`)
 * mit Rück-Link zur Startseite. Ziel von FormSubmits `_next` (same-origin,
 * daher auf allen 6 Domains korrekt). Route ist `noIndex` (Thin Content).
 * Benutzung: `/danke` (+ `/en/danke`) in `App.tsx`.
 * Gehört NICHT hierher: Formular selbst (`sections/ContactSection.tsx`).
 */

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { localizePath } from '../../utils/domainConfig';
import { ComicButton } from '../ComicButton';

export const Danke: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <div className="container mx-auto px-6 py-24 text-center min-h-[50vh] flex flex-col justify-center items-center animate-fade-in">
      <div className="text-6xl mb-6" aria-hidden="true">
        📡
      </div>
      <h1 className="text-4xl md:text-5xl font-retro text-white mb-4 drop-shadow-[2px_2px_0_rgba(220,38,38,1)]">
        {t.home.contact.thanksTitle}
      </h1>
      <p className="text-gray-400 mb-8 max-w-lg">{t.home.contact.thanksText}</p>
      <ComicButton
        to={localizePath('/', language)}
        className="px-6 py-2 text-lg"
      >
        {t.home.contact.backHome}
      </ComicButton>
    </div>
  );
};
