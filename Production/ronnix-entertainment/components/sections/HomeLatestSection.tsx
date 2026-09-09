/**
 * sections/HomeLatestSection.tsx — „Frisch aus dem Universum" (Main-Home).
 *
 * Feature: Sektions-Rahmen (H2 + Glow) um `LatestPosts` (10 neueste Posts,
 * kategorieübergreifend, Horizontal-Carousel). Benutzung: nur auf `/` der
 * Main-Domain (`App.tsx`). Gehört NICHT hierher: Post-Karten
 * (`LatestPosts.tsx`), Kategorie-Sections.
 */

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LatestPosts } from '../LatestPosts';

export const HomeLatestSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 md:py-32 px-6 bg-neutral-950 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
             {/* Section Header */}
             <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                 <div className="flex items-center gap-3">
                     <h2 className="text-3xl md:text-4xl font-retro text-white tracking-wide uppercase drop-shadow-md">
                        {t.home.hero.latestTitle}
                     </h2>
                 </div>
                 <div className="h-px bg-neutral-800 flex-grow mx-6 hidden md:block"></div>
             </div>
             
             {/* The Content Grid (Reveal in LatestPosts) */}
             <LatestPosts />
        </div>
        
        {/* Subtle Background Glow behind the cards */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-red-900/10 blur-[100px] -z-0 pointer-events-none"></div>
    </section>
  );
};
