
import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, BookOpen, Gamepad2, Mail, Film, Tv, Newspaper } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getLinkUrl } from '../utils/domainConfig';

interface QuickLinkItemProps {
  link: { text: string; href: string; icon: any; color: string };
  children: React.ReactNode;
  className: string;
  currentLang: string;
}

const QuickLinkItem: React.FC<QuickLinkItemProps> = ({ link, children, className, currentLang }) => {
     const { url, isExternal } = getLinkUrl(link.href, currentLang);
     if (isExternal) {
         return <a href={url} className={className}>{children}</a>
     }
     return <Link to={url} className={className}>{children}</Link>
}

export const QuickNav: React.FC = () => {
  const { t, language } = useLanguage();

  const quickLinks = [
    { text: t.home.hero.btnNews, href: '/news', icon: Newspaper, color: 'text-pink-400 border-pink-500/30 hover:bg-pink-900/20' },
    { text: t.home.hero.btnComics, href: '/comix', icon: Palette, color: 'text-red-400 border-red-500/30 hover:bg-red-900/20' },
    { text: t.home.hero.btnBoox, href: '/boox', icon: BookOpen, color: 'text-blue-400 border-blue-500/30 hover:bg-blue-900/20' },
    { text: t.home.hero.btnGamez, href: '/gamez', icon: Gamepad2, color: 'text-green-400 border-green-500/30 hover:bg-green-900/20' },
    { text: t.home.hero.btnMoviez, href: '/moviez', icon: Film, color: 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-900/20' },
    { text: t.home.hero.btnSeriez, href: '/seriez', icon: Tv, color: 'text-orange-400 border-orange-500/30 hover:bg-orange-900/20' },
    { text: t.home.hero.btnContact, href: '/contact', icon: Mail, color: 'text-gray-300 border-gray-500/30 hover:bg-gray-800' },
  ];

  return (
    <div className="w-full bg-neutral-950 border-y border-neutral-900 py-6 backdrop-blur-md bg-neutral-950/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-4 md:hidden">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t.home.hero.quickNav}</span>
             <div className="h-px bg-neutral-800 flex-grow"></div>
        </div>
        
        {/* Mobile: Grid (Optimized for touch) / Desktop: Flex Row (Centered) */}
        <div className="grid grid-cols-2 gap-3 md:flex md:justify-center md:gap-4">
            {quickLinks.map((link, index) => {
                const Icon = link.icon;
                // Last item spans 2 columns on mobile if we have an odd number of items, centering it
                const isLast = index === quickLinks.length - 1;
                const spanClass = (isLast && quickLinks.length % 2 !== 0) ? 'col-span-2' : '';

                return (
                    <QuickLinkItem
                        key={link.href}
                        link={link}
                        currentLang={language}
                        className={`
                            flex items-center justify-center gap-2 
                            px-4 py-3 md:px-5 md:py-2.5 
                            bg-neutral-900/80 border rounded-xl md:rounded-full 
                            text-sm font-bold whitespace-nowrap 
                            transition-all duration-300 
                            active:scale-95 hover:-translate-y-1 hover:shadow-lg 
                            ${link.color}
                            ${spanClass}
                        `}
                    >
                        <Icon size={18} />
                        {link.text}
                    </QuickLinkItem>
                )
            })}
        </div>
      </div>
    </div>
  );
};