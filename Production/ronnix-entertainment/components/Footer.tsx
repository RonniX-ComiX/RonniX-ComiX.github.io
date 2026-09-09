/**
 * Footer.tsx — Seitenfuß mit Branding, Social-Links und Legal-Navigation.
 *
 * Feature: Logo + Social-Icons (extern), Legal-Links (`/impressum`,
 * `/datenschutz`, `/agb`, sprachlokalisiert via `localizePath`) und
 * Copyright-Zeile. Benutzung: einmalig in `App.tsx` unter `<main/>`.
 * Gehört NICHT hierher: Navigations-Logik (siehe `components/Navbar.tsx`).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './icons/Icon';
import { useLanguage } from '../context/LanguageContext';
import { localizePath } from '../utils/domainConfig';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t, language } = useLanguage();

  const legalLinks: Array<{ name: string; icon: IconName; path: string }> = [
    { name: t.navigation.footer.impressum, icon: 'shield', path: '/impressum' },
    { name: t.navigation.footer.privacy, icon: 'file-text', path: '/datenschutz' },
    { name: t.navigation.footer.terms, icon: 'scale', path: '/agb' }
  ];

  return (
    <footer className="relative bg-black pt-16 pb-8 overflow-hidden border-t-4 border-neutral-900">
      {/* Hintergrund: bewusst neutral (Farb-Disziplin Rot+Neutral — Rot trägt der Content) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800/20 via-black to-black pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center">
          
          {/* Logo & Brand - Side by Side */}
          {/* Hover effect removed */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-5 mb-8 transform-gpu subpixel-antialiased">
             <div className="relative">
               {/* Neutraler Logo-Glow (Farb-Disziplin) */}
               <div className="absolute inset-0 bg-white blur-2xl opacity-20 rounded-full animate-pulse"></div>
               <img
                 src="./images/ronnix_logo.png"
                 alt="RonniX Entertainment Logo"
                 loading="lazy"
                 decoding="async"
                 className="h-20 w-auto object-contain relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
               />
             </div>
             <h2 className="text-4xl md:text-5xl font-retro tracking-wider drop-shadow-md">
               {/* Added pr-2 to prevent the 'T' from being clipped by overflow/bounding box */}
               <span className="bg-gradient-to-b from-white via-gray-200 to-neutral-400 bg-clip-text text-transparent pr-2">
                 RonniX Entertainment
               </span>
             </h2>
          </div>

          {/* Social Links - 1:1 Style from Contact Section */}
          <div className="flex justify-center space-x-8 mb-12">
            <a 
              href="https://www.instagram.com/ronnixcomix" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Instagram"
              className="text-pink-600 hover:text-pink-500 transform-gpu hover:scale-110 hover:rotate-6 transition duration-300 will-change-transform p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Icon name="instagram" size={40} />
            </a>
            <a 
              href="mailto:ronnixcomix@gmail.com" 
              title="Mail"
              className="text-red-600 hover:text-red-500 transform-gpu hover:scale-110 hover:-rotate-6 transition duration-300 will-change-transform p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Icon name="mail" size={40} />
            </a>
            <a 
              href="https://www.facebook.com/p/RonniX-ComiX-100068056538624/" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Facebook"
              className="text-blue-600 hover:text-blue-500 transform-gpu hover:scale-110 hover:rotate-6 transition duration-300 will-change-transform p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Icon name="facebook" size={40} />
            </a>
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8 border-t border-neutral-900 pt-8 w-full max-w-3xl">
            {legalLinks.map((link) => (
              <Link
                key={link.name}
                to={localizePath(link.path, language)}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase text-sm font-bold tracking-widest group"
              >
                <Icon name={link.icon} size={16} className="text-neutral-700 group-hover:text-white transition-colors" />
                {link.name}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-center">
            <p className="text-neutral-400 text-sm font-mono">
              © {currentYear} RonniX Entertainment. {t.navigation.footer.rights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
