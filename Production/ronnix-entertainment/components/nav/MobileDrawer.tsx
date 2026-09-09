/**
 * nav/MobileDrawer.tsx — Aufklapp-Menü für Mobilgeräte (links, vollhoch).
 *
 * Feature: Sektor-Links (via `NavItem`, Active-State + Sektor-Farben über
 * `getLinkState`-Callback aus der Navbar), Sprach-Switcher (Flags) und
 * Auth-Bereich (Profil/Logout bzw. Community-Login, sprungfrei via
 * `AuthSlot`). Schließt bei Navigation (`onClose`). Reine Darstellung:
 * State und Link-Logik liefert `Navbar.tsx`. Benutzung: in `Navbar.tsx`
 * hinter dem Burger-Button. Gehört NICHT hierher: Desktop-Leiste,
 * Link-Farbwelt (`navStyles.ts`), SSO-Details (`NavItem.tsx`).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../icons/Icon';
import { AuthSlot } from '../AuthSlot';
import { NavItem } from './NavItem';
import { FlagDE, FlagEN } from './Flags';
import { localizePath } from '../../utils/domainConfig';
import type { NavLinkStyles } from './navStyles';
import { ComicButton } from '../ComicButton';

export interface DrawerLink {
  name: string;
  href: string;
  icon: IconName;
}

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  links: DrawerLink[];
  /** Active-State + Sektor-Farben je Href (Logik bleibt in der Navbar). */
  getLinkState: (href: string) => { active: boolean; styles: NavLinkStyles };
  t: any;
  language: string;
  setLanguage: (lang: 'de' | 'en') => void;
  currentUser: any;
  authLoading: boolean;
  onLoginClick: () => void;
  onLogout: () => void;
  showWarp: (active: boolean, targetLabel?: string | null) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onClose,
  links,
  getLinkState,
  t,
  language,
  setLanguage,
  currentUser,
  authLoading,
  onLoginClick,
  onLogout,
  showWarp,
}) => (
  <div
    className={`fixed top-0 left-0 h-[100dvh] w-3/4 max-w-sm bg-neutral-950 border-r-4 border-red-600 z-40 transform transition duration-500 ease-out shadow-[10px_0_30px_rgba(0,0,0,0.8)] xl:hidden ${
      open ? 'translate-x-0 visible' : '-translate-x-full invisible'
    }`}
  >
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
       <div className="absolute top-[10%] left-[-10%] w-64 h-64 bg-red-900/20 rounded-full blur-[80px]"></div>
    </div>

    <div className="flex flex-col h-full pt-24 pb-10 px-8 items-start space-y-4 overflow-y-auto">
      {links.map((link) => {
        const { active, styles } = getLinkState(link.href);

        return (
          <NavItem
            key={link.href}
            link={link}
            isActive={active}
            currentLang={language}
            setGlobalWarp={showWarp}
            className={`font-retro text-2xl tracking-widest transition duration-300 group flex items-center gap-3 ${
              active
                ? `${styles.activeText} drop-shadow-[2px_2px_0_rgba(255,255,255,0.1)]`
                : `text-gray-400 ${styles.hoverText}`
            }`}
            onClick={onClose}
          >
            {link.name}
            <Icon name={link.icon} size={22} className={`transition-transform group-hover:rotate-12 ${active ? styles.activeText : 'text-gray-400'}`} />
          </NavItem>
        );
      })}

      <div className="w-full h-px bg-neutral-800 my-4"></div>

      {/* Language Switcher Mobile */}
      <div className="flex items-center gap-6 font-retro text-xl">
         <span className="text-gray-500 uppercase text-sm font-sans tracking-normal mr-2">
           {t.navigation.navbar.language}
         </span>
         <button
            onClick={() => setLanguage('de')}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition duration-300 ${
                language === 'de'
                ? 'scale-125 rotate-[-3deg] filter-none opacity-100 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]'
                : 'opacity-40 grayscale scale-95'
            }`}
         >
           <div className={`border-2 border-white ${language === 'de' ? 'ring-2 ring-red-500' : ''}`}>
              <FlagDE className="w-10 h-7" />
           </div>
         </button>

         <button
            onClick={() => setLanguage('en')}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition duration-300 ${
                language === 'en'
                ? 'scale-125 rotate-[3deg] filter-none opacity-100 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]'
                : 'opacity-40 grayscale scale-95'
            }`}
         >
           <div className={`border-2 border-white ${language === 'en' ? 'ring-2 ring-red-500' : ''}`}>
              <FlagEN className="w-10 h-7" />
           </div>
         </button>
      </div>

      <div className="w-full h-px bg-neutral-800 my-4"></div>

      {/* User Section Mobile (sprungfrei: fixe Slot-Fläche + Crossfade) */}
      <div className="w-full flex flex-col items-start gap-4">
      <AuthSlot
        label="Community-Login"
        slotKey={authLoading ? 'loading' : currentUser ? `u:${currentUser.uid}` : 'guest'}
        loading={authLoading}
        placeholder={
          <span
            aria-hidden="true"
            className="px-6 py-3 rounded-sm font-retro text-xl invisible pointer-events-none select-none"
          >
            &nbsp;
          </span>
        }
      >
        {currentUser ? (
          <>
             <Link
               to={localizePath('/profile', language)}
               className="text-left group block max-w-full"
               onClick={onClose}
             >
               <p className="text-gray-400 text-sm font-sans mb-1">{t.navigation.navbar.loggedInAs}</p>
               <p className="text-2xl font-retro text-white group-hover:text-red-500 transition-colors truncate max-w-[220px]">
                 {currentUser.displayName || currentUser.email}
               </p>
             </Link>
             <button
               onClick={onLogout}
               className="flex items-center gap-2 text-red-500 hover:text-red-400 font-bold uppercase tracking-wider text-sm border border-red-900/50 px-4 py-2 rounded-lg bg-red-900/10 min-h-[44px]"
             >
               {t.navigation.navbar.logout} <Icon name="log-out" size={16} />
             </button>
          </>
        ) : (
          <ComicButton
            onClick={onLoginClick}
            className="px-6 py-3 text-xl"
          >
            {t.navigation.navbar.communityLogin} <Icon name="user" size={20} />
          </ComicButton>
        )}
      </AuthSlot>
      </div>
    </div>
  </div>
);
