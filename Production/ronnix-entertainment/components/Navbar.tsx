/**
 * Navbar.tsx — Hauptnavigation mit Domain-Links und SSO-Weitergabe.
 *
 * Feature: rendert Kategorie-Links (`getLinkUrl`), erkennt aktiven Bereich je
 * Domain und gibt bei explizitem Klick auf eine Fremd-Domain die Session per
 * SSO-Token mit (Fragment-Transport, `location.replace`, Prefetch bei Hover).
 * Gäste navigieren nativ ohne Token/Overlay. Use Cases: alle Domain-Wechsel per
 * Klick. Gehört NICHT hierher: stiller Auto-Login (SSOAutoLogin), Token-Config
 * (`utils/ssoConfig.ts`).
 */

import React, { useState, useEffect } from 'react';
import { Menu, X, Home, User, LogOut, Globe, Palette, BookOpen, Gamepad2, Mail, Film, Tv, Newspaper } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCrossDomainToken } from '../hooks/useCrossDomainToken';
import { useLanguage } from '../context/LanguageContext';
import { AuthModal } from './AuthModal';
import { AuthSlot } from './AuthSlot';
import { WarpScreen } from './WarpScreen';
import { getLinkUrl, getCurrentCategory, getTargetCategory, isLocalhost } from '../utils/domainConfig';
import { buildSsoUrl } from '../utils/ssoValidation';

// Comic-Style SVG Flags
const FlagDE = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 5 3" className={className} role="img" aria-label="Deutsch" preserveAspectRatio="none">
    <rect width="5" height="3" fill="#000"/>
    <rect y="1" width="5" height="2" fill="#D00"/>
    <rect y="2" width="5" height="1" fill="#FFCE00"/>
  </svg>
);

const FlagEN = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 30" className={className} role="img" aria-label="English" preserveAspectRatio="none">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

// Full Screen Transition Overlay (einheitlicher WarpScreen, Zielsektor-Readout via Props)
const WarpOverlay: React.FC<{ targetLabel: string | null }> = ({ targetLabel }) => (
    <WarpScreen phase="transfer" targetLabel={targetLabel} />
);

interface NavItemProps {
  link: { name: string; href: string; icon: any };
  className: string;
  children: React.ReactNode;
  onClick?: () => void;
  isActive: boolean; // Receive active state as prop
  currentLang: string;
  setGlobalWarp: (active: boolean, targetLabel?: string | null) => void;
}

const NavItem: React.FC<NavItemProps> = ({ link, className, children, onClick, isActive, currentLang, setGlobalWarp }) => {
    const { currentUser } = useAuth();
    const { getToken, prefetch } = useCrossDomainToken();

    // Pass currentLang to getLinkUrl to append ?lang=... if external
    const { url, isExternal } = getLinkUrl(link.href, currentLang);

    const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Always close mobile menu immediately
        if (onClick) onClick();

        // SSO-Logik nur, wenn:
        // 1. Der Link extern ist (andere Domain)
        // 2. AND ein eingeloggter User seine Session mitnehmen muss.
        // 3. AND wir NICHT auf localhost sind (eine Origin = geteilter Login).

        if (isExternal && currentUser && !isLocalhost()) {
            e.preventDefault();
            // Overlay als Paint-Brücke bis zum Unload (kein künstliches Delay).
            try {
                setGlobalWarp(true, new URL(url).hostname.toUpperCase());
            } catch {
                setGlobalWarp(true, null);
            }

            try {
                // Fetch short-lived custom token from backend (Cache + Timeout in AuthContext)
                const token = await getToken();

                if (token) {
                    const targetUrl = new URL(url);
                    const returnPath = targetUrl.pathname + targetUrl.search;
                    // Fragment-Transport: Token nie im Query → nie in Server-Logs.
                    window.location.replace(buildSsoUrl(targetUrl.origin, token, returnPath));
                    return;
                }
                // Fallback if token fails
                window.location.replace(url);
            } catch (error) {
                console.error('[sso] Navigations-Fehler, direkter Link als Fallback', error);
                window.location.replace(url);
            }
        }
        // GUEST MODE:
        // If external but NOT logged in, we do absolutely nothing special.
        // We let the browser handle the <a> tag naturally. This is instant.
    };

    if (isExternal) {
        return (
            <a
                href={url}
                className={className}
                onClick={handleClick}
                onMouseEnter={currentUser ? prefetch : undefined}
                onFocus={currentUser ? prefetch : undefined}
            >
                {children}
            </a>
        );
    }
    return (
        <Link to={url} className={className} onClick={onClick}>
            {children}
        </Link>
    );
};

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWarping, setIsWarping] = useState(false); // Global Warp State
  const [warpTarget, setWarpTarget] = useState<string | null>(null);

  /** Aktiviert das Warp-Overlay inkl. Zielsektor-Readout. */
  const showWarp = (active: boolean, targetLabel?: string | null) => {
    setWarpTarget(active ? (targetLabel ?? null) : null);
    setIsWarping(active);
  };

  const location = useLocation();
  const { currentUser, logout, loading: authLoading } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const currentCategory = getCurrentCategory();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t.navigation.navbar.home, href: '/', icon: Home },
    { name: t.navigation.navbar.news, href: '/news', icon: Newspaper },
    { name: t.navigation.navbar.comics, href: '/comix', icon: Palette },
    { name: t.navigation.navbar.boox, href: '/boox', icon: BookOpen },
    { name: t.navigation.navbar.gamez, href: '/gamez', icon: Gamepad2 },
    { name: t.navigation.navbar.moviez, href: '/moviez', icon: Film },
    { name: t.navigation.navbar.seriez, href: '/seriez', icon: Tv },
    { name: t.navigation.navbar.contact, href: '/contact', icon: Mail },
  ];

  // Robust Active State Logic
  const checkIsActive = (href: string) => {
      const targetCategory = getTargetCategory(href);
      // For checking active state, we don't care about language params in the resolved URL
      const { url: resolvedUrl, isExternal } = getLinkUrl(href); 
      const currentPath = location.pathname;

      // 1. Strict Domain Separation:
      if (currentCategory !== 'main' && targetCategory === 'main') {
          return false;
      }

      // 2. Subdomain Identity:
      if (currentCategory !== 'main' && currentCategory === targetCategory) {
          return true;
      }

      // 3. External Links
      if (isExternal) return false;

      // 4. Standard Path Matching
      if (resolvedUrl === currentPath) return true;
      if (resolvedUrl !== '/' && currentPath.startsWith(resolvedUrl + '/')) return true;

      return false;
  };

  // Helper for Category Colors
  const getNavStyle = (href: string) => {
    switch (href) {
      case '/':
      case '/news':
      case '/contact':
        return {
          activeText: 'text-pink-500',
          hoverText: 'group-hover:text-pink-500',
          activeIcon: 'text-pink-500 rotate-12',
          hoverIcon: 'group-hover:text-pink-500',
          underline: 'bg-pink-500',
          shadow: 'shadow-[0_0_10px_rgba(236,72,153,0.8)]'
        };
      case '/comix':
        return {
          activeText: 'text-red-500',
          hoverText: 'group-hover:text-red-500',
          activeIcon: 'text-red-500 rotate-12',
          hoverIcon: 'group-hover:text-red-500',
          underline: 'bg-red-600',
          shadow: 'shadow-[0_0_10px_rgba(220,38,38,0.8)]'
        };
      case '/boox':
        return {
          activeText: 'text-blue-500',
          hoverText: 'group-hover:text-blue-500',
          activeIcon: 'text-blue-500 rotate-12',
          hoverIcon: 'group-hover:text-blue-500',
          underline: 'bg-blue-600',
          shadow: 'shadow-[0_0_10px_rgba(37,99,235,0.8)]'
        };
      case '/gamez':
        return {
          activeText: 'text-green-500',
          hoverText: 'group-hover:text-green-500',
          activeIcon: 'text-green-500 rotate-12',
          hoverIcon: 'group-hover:text-green-500',
          underline: 'bg-green-600',
          shadow: 'shadow-[0_0_10px_rgba(22,163,74,0.8)]'
        };
      case '/moviez':
        return {
          activeText: 'text-yellow-400',
          hoverText: 'group-hover:text-yellow-400',
          activeIcon: 'text-yellow-400 rotate-12',
          hoverIcon: 'group-hover:text-yellow-400',
          underline: 'bg-yellow-400',
          shadow: 'shadow-[0_0_10px_rgba(250,204,21,0.8)]'
        };
      case '/seriez':
        return {
          activeText: 'text-orange-500',
          hoverText: 'group-hover:text-orange-500',
          activeIcon: 'text-orange-500 rotate-12',
          hoverIcon: 'group-hover:text-orange-500',
          underline: 'bg-orange-500',
          shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.8)]'
        };
      default:
        return {
          activeText: 'text-white',
          hoverText: 'group-hover:text-white',
          activeIcon: 'text-white',
          hoverIcon: 'group-hover:text-white',
          underline: 'bg-white',
          shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.8)]'
        };
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'de' ? 'en' : 'de');
  };

  const { url: homeUrl, isExternal: homeIsExternal } = getLinkUrl('/', language);

  return (
    <>
      {isWarping && <WarpOverlay targetLabel={warpTarget} />}
      
      <nav 
        className={`sticky top-0 z-50 transition-all duration-300 border-b border-red-900/50 ${
          isScrolled 
            ? 'bg-black/95 backdrop-blur-md shadow-[0_4px_20px_rgba(220,38,38,0.2)]' 
            : 'bg-black/90 backdrop-blur-sm'
        }`}
      >
        <div className="w-full px-6 py-3 flex justify-between items-center relative z-50">
          {/* Logo Section */}
          {homeIsExternal ? (
             <a href={homeUrl} className="flex items-center space-x-3 cursor-pointer group">
                <LogoContent />
             </a>
          ) : (
             <Link to={homeUrl} className="flex items-center space-x-3 cursor-pointer group">
                <LogoContent />
             </Link>
          )}

          {/* Desktop Nav - Comic Style */}
          <div className="hidden lg:flex items-center space-x-4">
            {navLinks.map((link) => {
              const active = checkIsActive(link.href);
              const styles = getNavStyle(link.href);

              return (
                <NavItem
                  key={link.href}
                  link={link}
                  isActive={active}
                  currentLang={language}
                  setGlobalWarp={showWarp}
                  className={`font-retro text-xl xl:text-2xl tracking-widest relative group py-2 transition-transform duration-300 flex items-center gap-2 transform-gpu subpixel-antialiased will-change-transform ${
                    active ? `scale-105 ${styles.activeText}` : `text-gray-400 ${styles.hoverText}`
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span className={`relative z-10 transition-colors duration-300`}>
                    {link.name}
                  </span>
                  
                  <link.icon 
                    size={18} 
                    className={`relative z-10 transition-transform duration-300 group-hover:rotate-12 ${active ? styles.activeIcon : `text-gray-600 ${styles.hoverIcon}`}`} 
                    strokeWidth={2.5}
                  />

                  <span className={`absolute bottom-0 left-0 h-1 ${styles.underline} transform skew-x-[-20deg] transition-all duration-300 ease-out ${styles.shadow} ${
                    active ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </NavItem>
              );
            })}

            {/* Language Switcher Desktop */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 xl:gap-4 ml-4 pl-4 border-l-2 border-neutral-800 group h-10"
              title={t.navigation.navbar.switchLanguage}
            >
              <div 
                className={`relative transition-all duration-300 ease-out transform-gpu origin-center ${
                    language === 'de' 
                    ? 'scale-125 rotate-[-6deg] z-10 filter-none opacity-100' 
                    : 'scale-90 opacity-40 grayscale hover:scale-100 hover:grayscale-0 hover:opacity-100 hover:rotate-[-2deg]'
                }`}
              >
                 <div className={`overflow-hidden border-2 border-white shadow-[3px_3px_0_rgba(0,0,0,1)] ${language === 'de' ? 'ring-2 ring-red-600 ring-offset-1 ring-offset-black' : ''}`}>
                    <FlagDE className="w-8 h-5 block" />
                 </div>
              </div>

              <div 
                className={`relative transition-all duration-300 ease-out transform-gpu origin-center ${
                    language === 'en' 
                    ? 'scale-125 rotate-[6deg] z-10 filter-none opacity-100' 
                    : 'scale-90 opacity-40 grayscale hover:scale-100 hover:grayscale-0 hover:opacity-100 hover:rotate-[2deg]'
                }`}
              >
                 <div className={`overflow-hidden border-2 border-white shadow-[3px_3px_0_rgba(0,0,0,1)] ${language === 'en' ? 'ring-2 ring-red-600 ring-offset-1 ring-offset-black' : ''}`}>
                    <FlagEN className="w-8 h-5 block" />
                 </div>
              </div>
            </button>

            {/* Desktop Auth Button (sprungfrei: fixe Slot-Fläche + Crossfade, Name trunkiert) */}
            <AuthSlot
              label="Community-Login"
              slotKey={authLoading ? 'loading' : currentUser ? `u:${currentUser.uid}` : 'guest'}
              loading={authLoading}
              placeholder={
                <span
                  aria-hidden="true"
                  className="font-retro tracking-wider px-4 xl:px-6 py-2 rounded-sm border border-transparent ml-2 invisible pointer-events-none select-none"
                >
                  <span className="block text-lg">&nbsp;</span>
                </span>
              }
            >
            {currentUser ? (
              <div className="flex items-center gap-2 xl:gap-4 pl-4 border-l-2 border-neutral-800">
                <Link to="/profile" className="font-retro text-lg tracking-wide text-gray-300 hover:text-white transition-colors max-w-[140px] truncate">
                   {currentUser.displayName || 'Hero'}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-neutral-900 hover:bg-red-900 text-white p-2 rounded-lg border border-red-900/50 transition-all duration-300 hover:rotate-6"
                  title={t.navigation.navbar.logout}
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="font-retro tracking-wider bg-red-700 hover:bg-red-600 text-white px-4 xl:px-6 py-2 rounded-sm transform skew-x-[-10deg] hover:skew-x-[-5deg] transition-all duration-300 shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.5)] border border-red-500 ml-2"
              >
                <span className="block transform skew-x-[10deg] hover:skew-x-[5deg] text-lg">
                  {t.navigation.navbar.login}
                </span>
              </button>
            )}
            </AuthSlot>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white focus:outline-none hover:text-red-500 transition-colors p-2 relative z-50"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={32} strokeWidth={2.5} /> : <Menu size={32} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`fixed top-0 right-0 h-screen w-3/4 max-w-sm bg-neutral-950/95 backdrop-blur-2xl border-l-4 border-red-600 z-40 transform transition-all duration-500 ease-out shadow-[-10px_0_30px_rgba(0,0,0,0.8)] lg:hidden ${
            isOpen ? 'translate-x-0 visible' : 'translate-x-full invisible'
          }`}
        >
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none -z-10">
             <div className="absolute top-[10%] right-[-10%] w-64 h-64 bg-red-900/20 rounded-full blur-[80px]"></div>
          </div>

          <div className="flex flex-col h-full pt-28 pb-10 px-8 items-end space-y-4 overflow-y-auto">
            {navLinks.map((link) => {
              const active = checkIsActive(link.href);
              const styles = getNavStyle(link.href);
              
              return (
                <NavItem
                  key={link.href}
                  link={link}
                  isActive={active}
                  currentLang={language}
                  setGlobalWarp={showWarp}
                  className={`font-retro text-2xl tracking-widest transition-all duration-300 group flex items-center gap-3 ${
                    active 
                      ? `${styles.activeText} drop-shadow-[2px_2px_0_rgba(255,255,255,0.1)]` 
                      : `text-gray-400 ${styles.hoverText}`
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                  <link.icon size={22} className={`transition-transform group-hover:rotate-12 ${active ? styles.activeText : 'text-gray-600'}`} />
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
                  className={`transition-all duration-300 ${
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
                  className={`transition-all duration-300 ${
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
            <div className="w-full flex flex-col items-end gap-4">
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
                     to="/profile" 
                     className="text-right group block max-w-full"
                     onClick={() => setIsOpen(false)}
                   >
                     <p className="text-gray-400 text-sm font-sans mb-1">{t.navigation.navbar.loggedInAs}</p>
                     <p className="text-2xl font-retro text-white group-hover:text-red-500 transition-colors truncate max-w-[220px]">
                       {currentUser.displayName || currentUser.email}
                     </p>
                   </Link>
                   <button 
                     onClick={handleLogout}
                     className="flex items-center gap-2 text-red-500 hover:text-red-400 font-bold uppercase tracking-wider text-sm border border-red-900/50 px-4 py-2 rounded-lg bg-red-900/10"
                   >
                     {t.navigation.navbar.logout} <LogOut size={16} />
                   </button>
                </>
              ) : (
                <button 
                  onClick={() => { setIsAuthModalOpen(true); setIsOpen(false); }}
                  className="bg-red-700 text-white px-6 py-3 rounded-sm font-retro text-xl tracking-wider shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-[2px_2px_0_rgba(0,0,0,0.5)] transition-all flex items-center gap-2"
                >
                  {t.navigation.navbar.communityLogin} <User size={20} />
                </button>
              )}
            </AuthSlot>
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

// Extracted for re-use
const LogoContent = () => (
    <>
        <div className="relative">
            <div className="absolute inset-0 bg-red-600 blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-300 rounded-full"></div>
            <img 
                src="./images/ronnix_logo.png" 
                alt="RonniX Entertainment Logo" 
                className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-110 relative z-10"
            />
        </div>
        <span className="text-xl md:text-3xl font-bold font-retro tracking-widest hidden xl:block drop-shadow-md">
             <span className="bg-gradient-to-b from-white via-gray-200 to-neutral-400 bg-clip-text text-transparent">
                 RonniX Entertainment
             </span>
        </span>
    </>
);