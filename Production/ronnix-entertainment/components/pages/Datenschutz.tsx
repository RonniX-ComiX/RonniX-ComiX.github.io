/**
 * pages/Datenschutz.tsx — Datenschutzerklärung (statische Legal-Seite).
 *
 * Feature: rendert `t.legal.privacy` zweisprachig im Legal-Kartenlayout.
 * Benutzung: `/datenschutz` (+ `/en/datenschutz`) in `App.tsx` (indexiert).
 * Gehört NICHT hierher: AGB, Impressum, Cookie-Logik (kein Tracking aktiv).
 */

import React from 'react';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';

export const Datenschutz: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-6 py-12 text-gray-300 min-h-[60vh]">
      <div className="max-w-4xl mx-auto bg-neutral-900/50 p-8 md:p-12 rounded-2xl border border-red-900/20 shadow-2xl animate-fade-in">
        <SectionTitle title={t.legal.privacy.title} />

        <div className="space-y-8 text-sm md:text-base leading-relaxed text-gray-300">
          
          {/* 1. Intro */}
          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.privacy.introTitle}</h3>
            <p>{t.legal.privacy.introText}</p>
          </section>

          {/* 2. Verantwortliche Stelle */}
          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.privacy.controllerTitle}</h3>
            <p className="mb-2">{t.legal.privacy.controllerText}</p>
            <div className="bg-black/40 p-4 rounded-lg border border-neutral-800 font-mono text-sm">
              <p>Ron Hartmann</p>
              <p>Emsstraße 13</p>
              <p>38120 Braunschweig</p>
              <p>E-Mail: ronnixcomix@gmail.com</p>
            </div>
          </section>

          {/* 3. Datenerfassung */}
          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.privacy.collectionTitle}</h3>
            <p>{t.legal.privacy.collectionText}</p>
          </section>

          {/* 4. Hosting Firebase */}
          <section>
            <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.privacy.hostingTitle}</h3>
            <p>{t.legal.privacy.hostingText}</p>
          </section>

          {/* 5. Auth / Registrierung */}
          <section>
             <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.privacy.authTitle}</h3>
             <p>{t.legal.privacy.authText}</p>
          </section>

          {/* 6. Cookies */}
          <section>
             <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.privacy.cookiesTitle}</h3>
             <p>{t.legal.privacy.cookiesText}</p>
          </section>
          
          {/* 7. Rechte */}
          <section>
             <h3 className="text-xl font-retro text-red-500 mb-3">{t.legal.privacy.rightsTitle}</h3>
             <p>{t.legal.privacy.rightsText}</p>
          </section>

        </div>
      </div>
    </div>
  );
};