/**
 * QuickNav.tsx — Sektor-Schnellnavigation (7 Bereiche, Touch-sicher).
 *
 * Feature: rendert je Sektor einen Button (Farbe + Icon aus `icons/Icon`,
 * Links via `getLinkUrl` inkl. `/en/`-Lokalisierung). Grid auf Mobil (letzter
 * Button spannt bei ungerader Zahl), Flex-Row auf Desktop. Benutzung: im
 * `Hero` (Main) als Sektor-Auswahl. Gehört NICHT hierher: Hauptnavigation
 * (`components/Navbar.tsx`).
 */

import React from 'react';
import { Icon, type IconName } from './icons/Icon';
import { useLanguage } from '../context/LanguageContext';
import { getLinkUrl } from '../utils/domainConfig';
import { ComicButton } from './ComicButton';

interface QuickLinkItemProps {
  link: { text: string; href: string; icon: IconName; color: string };
  children: React.ReactNode;
  className: string;
  currentLang: string;
}

const QuickLinkItem: React.FC<QuickLinkItemProps> = ({ link, children, className, currentLang }) => {
     const { url, isExternal } = getLinkUrl(link.href, currentLang);
     const tone = `bg-neutral-900/80 ${link.color}`;
     if (isExternal) {
         return <ComicButton href={url} tone={tone} className={className}>{children}</ComicButton>
     }
     return <ComicButton to={url} tone={tone} className={className}>{children}</ComicButton>
}

export const QuickNav: React.FC = () => {
  const { t, language } = useLanguage();

  const quickLinks: Array<{ text: string; href: string; icon: IconName; color: string }> = [
    { text: t.home.hero.btnNews, href: '/news', icon: 'newspaper', color: 'text-pink-400 border-pink-500/30 hover:bg-pink-900/20' },
    { text: t.home.hero.btnComics, href: '/comix', icon: 'palette', color: 'text-red-400 border-red-500/30 hover:bg-red-900/20' },
    { text: t.home.hero.btnBoox, href: '/boox', icon: 'book-open', color: 'text-blue-400 border-blue-500/30 hover:bg-blue-900/20' },
    { text: t.home.hero.btnGamez, href: '/gamez', icon: 'gamepad', color: 'text-green-400 border-green-500/30 hover:bg-green-900/20' },
    { text: t.home.hero.btnMoviez, href: '/moviez', icon: 'film', color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-900/20' },
    { text: t.home.hero.btnSeriez, href: '/seriez', icon: 'tv', color: 'text-orange-400 border-orange-500/30 hover:bg-orange-900/20' },
    { text: t.home.hero.btnContact, href: '/contact', icon: 'mail', color: 'text-gray-300 border-gray-500/30 hover:bg-gray-800' },
  ];

  return (
    <div className="w-full bg-neutral-950 border-y border-neutral-900 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-4 md:hidden">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.home.hero.quickNav}</span>
             <div className="h-px bg-neutral-800 flex-grow"></div>
        </div>
        
        {/* Mobile: Grid (Optimized for touch) / Desktop: Flex Row (Centered) */}
        <div className="grid grid-cols-2 gap-3 md:flex md:justify-center md:gap-4">
            {quickLinks.map((link, index) => {
                // Last item spans 2 columns on mobile if we have an odd number of items, centering it
                const isLast = index === quickLinks.length - 1;
                const spanClass = (isLast && quickLinks.length % 2 !== 0) ? 'col-span-2' : '';

                return (
                    <QuickLinkItem
                        key={link.href}
                        link={link}
                        currentLang={language}
                        className={`px-4 py-3 md:px-5 md:py-2.5 text-sm whitespace-nowrap ${spanClass}`}
                    >
                        <Icon name={link.icon} size={18} />
                        {link.text}
                    </QuickLinkItem>
                )
            })}
        </div>
      </div>
    </div>
  );
};