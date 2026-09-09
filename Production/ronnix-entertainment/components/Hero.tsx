/**
 * Hero.tsx — Einstieg der Main-Domain: Branding, Subtext, CTA, Sektor-Navigation.
 *
 * Feature: Logo + Slogan (H1) + Subtext (`t.home.hero.subtitle`, max. 20 Worte)
 * + primärer CTA (`t.home.hero.ctaPrimary` → News, lokalisiert) + `QuickNav`
 * als Sektor-Auswahl (7 Bereiche). Intro-Animation nur beim Erstbesuch je
 * Session (`sessionStorage`).
 * Das Logo trägt echte Maße + `fetchpriority="high"` (LCP).
 * Benutzung: nur auf `/` der Main-Domain (`App.tsx`). Gehört NICHT hierher:
 * Latest-Posts (`sections/HomeLatestSection.tsx`), Sektor-Sections.
 */

import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizePath } from '../utils/domainConfig';
import { versionedAssetUrl } from '../utils/appConfig';
import { QuickNav } from './QuickNav';
import { ComicButton } from './ComicButton';

/** Intro-Flag lesen (idempotent — StrictMode-Doppelaufruf ist harmlos). */
const readIntroFlag = (): boolean => {
  try {
    if (!sessionStorage.getItem('ronnix_hero_shown')) {
      sessionStorage.setItem('ronnix_hero_shown', 'true');
      return true;
    }
  } catch {
    // Private Mode o. Ä.: ohne Intro-Flag einfach statisch rendern.
  }
  return false;
};

export const Hero: React.FC = () => {
  const { t, language } = useLanguage();
  const [shouldAnimate] = useState(readIntroFlag);

  return (
    <header className="relative pt-20 bg-gradient-to-b from-black via-neutral-900/10 to-neutral-950 overflow-hidden flex flex-col items-center justify-center min-h-[60vh]">
      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center w-full max-w-6xl">

        {/* 1. BRANDING: Logo/Image (LCP: echte Maße + hohe Priorität) */}
        <div className={`mx-auto mb-8 w-full max-w-4xl relative flex items-center justify-center ${shouldAnimate ? 'animate-fade-in' : ''}`}>
             <img
                 src={versionedAssetUrl('/images/RonniX.png')}
                alt="RonniX Entertainment"
                width="2192"
                height="754"
                fetchPriority="high"
                decoding="async"
                className="relative z-10 w-full h-auto max-h-[280px] md:max-h-[400px] object-contain drop-shadow-[0_0_35px_rgba(220,38,38,0.35)]"
             />
        </div>

        {/* 2. SLOGAN */}
        <h1 className={`font-retro text-2xl md:text-5xl text-white text-center max-w-4xl leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,1)] ${shouldAnimate ? 'animate-slide-up' : ''}`}>
          {t.home.hero.titleStart} <br className="hidden lg:block"/>
          <span className="bg-gradient-to-b from-white via-gray-200 to-neutral-400 bg-clip-text text-transparent inline-block pb-2 pr-2">
            RonniX Entertainment
          </span>
        </h1>

        {/* 3. SUBTEXT (Kurz-Einordnung, kein Roman) */}
        <p className="mt-6 max-w-xl text-center text-base md:text-lg text-gray-300 leading-relaxed">
          {t.home.hero.subtitle}
        </p>

        {/* 4. PRIMÄRER CTA (ein Ziel, kein Auswahl-Overload) */}
        <ComicButton
          to={localizePath('/news', language)}
          className="mt-8 px-8 py-3 text-xl"
        >
          {t.home.hero.ctaPrimary}
        </ComicButton>
      </div>

      {/* 5. SEKTOR-AUSWAHL (7 Bereiche, Touch-sicher, lokalisiert) */}
      <div className="w-full mt-12 relative z-10">
        <QuickNav />
      </div>

      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40 pointer-events-none" aria-hidden="true">
          {/* Rot-Neutral-Glühen (Farb-Disziplin: nur Rot + Neutral) */}
          <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-red-900/20 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-neutral-800/20 rounded-full blur-[150px]"></div>
          {/* Subtle grid pattern (selbst gehostet, kein Drittanbieter) */}
          <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>
    </header>
  );
};
