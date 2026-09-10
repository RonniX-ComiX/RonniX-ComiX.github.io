/**
 * Navbar.tsx — Desktop-Navigation, Auth-Button, Warp-Orchestrierung, Switcher.
 *
 * Feature: sticky Desktop-Leiste (Logo, Sektor-Links via `NavItem`, Active-State
 * sprachrein, `/en/`-Lokalisierung), Language-Switcher (wechselt Sprache UND
 * URL-Pendant `/news` ↔ `/en/news`), Desktop-Auth-Button (sprungfrei via
 * `AuthSlot`), Burger-Button + `MobileDrawer`, Warp-Overlay bei SSO-Wechseln.
 * Zerlegt in: `nav/NavItem.tsx` (Link + SSO), `nav/navStyles.ts` (Farben),
 * `nav/MobileDrawer.tsx` (Mobil-Menü), `nav/Flags.tsx` (Flaggen).
 * Gehört NICHT hierher: stiller Auto-Login (SSOAutoLogin), Token-Config
 * (`utils/ssoConfig.ts`).
 */

import React, { useState, useEffect } from 'react';
import { Icon, type IconName } from './icons/Icon';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AuthModal } from './AuthModal';
import { AuthSlot } from './AuthSlot';
import { WarpScreen } from './WarpScreen';
import { NavItem } from './nav/NavItem';
import { ComicButton } from './ComicButton';
import { MobileDrawer } from './nav/MobileDrawer';
import { FlagDE, FlagEN } from './nav/Flags';
import { getNavStyle } from './nav/navStyles';
import { getLinkUrl, getCurrentCategory, getTargetCategory, stripLangPrefix, localizePath, TRANSIENT_PATHS } from '../utils/domainConfig';
import { LOGO_IMAGE } from '../utils/imageConfig';
import { ResponsiveImage } from './ResponsiveImage';
import { logError } from '../utils/logger';

// Full Screen Transition Overlay (einheitlicher WarpScreen, Zielsektor-Readout via Props)
const WarpOverlay: React.FC<{ targetLabel: string | null }> = ({ targetLabel }) => (
    <WarpScreen phase="transfer" targetLabel={targetLabel} />
);

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

  const navLinks: Array<{ name: string; href: string; icon: IconName }> = [
    { name: t.navigation.navbar.home, href: '/', icon: 'home' },
    { name: t.navigation.navbar.news, href: '/news', icon: 'newspaper' },
    { name: t.navigation.navbar.comics, href: '/comix', icon: 'palette' },
    { name: t.navigation.navbar.boox, href: '/boox', icon: 'book-open' },
    { name: t.navigation.navbar.gamez, href: '/gamez', icon: 'gamepad' },
    { name: t.navigation.navbar.moviez, href: '/moviez', icon: 'film' },
    { name: t.navigation.navbar.seriez, href: '/seriez', icon: 'tv' },
    { name: t.navigation.navbar.contact, href: '/contact', icon: 'mail' },
  ];

  // Robust Active State Logic (sprachrein: `/en`-Prefix wird ignoriert)
  const checkIsActive = (href: string) => {
      const targetCategory = getTargetCategory(href);
      // For checking active state, we don't care about language params in the resolved URL
      const { url: resolvedUrl, isExternal } = getLinkUrl(href);
      const currentPath = stripLangPrefix(location.pathname).clean;

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

  // Sektor-Farbwelt: siehe `nav/navStyles.ts` (`getNavStyle`).

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logError('navbar', 'Logout failed', error);
    }
  };

  const navigate = useNavigate();

  /**
   * Wechselt die Sprache UND die URL (stabile Sprach-Pfade):
   * EN → `/en/...`-Pendant, DE → pfadreines Pendant. Query (?site=) bleibt.
   */
  const toggleLanguage = () => {
    const next = language === 'de' ? 'en' : 'de';
    setLanguage(next);
    const { clean } = stripLangPrefix(location.pathname);
    // Transiente Routen (SSO/Logout) behalten ihre URL — nur die Sprache wechselt.
    if (TRANSIENT_PATHS.some((t) => clean === t || clean.startsWith(t + '/'))) return;
    navigate({ pathname: localizePath(clean, next), search: location.search });
  };

  const { url: homeUrl, isExternal: homeIsExternal } = getLinkUrl('/', language);

  return (
    <>
      {isWarping && <WarpOverlay targetLabel={warpTarget} />}
      
      <nav 
        className={`sticky top-0 z-50 transition duration-300 border-b border-red-900/50 ${
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
          <div className="hidden xl:flex items-center space-x-4">
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
                  
                  <Icon
                    name={link.icon}
                    size={18}
                    className={`relative z-10 transition-colors duration-300 group-hover:rotate-12 ${active ? styles.activeIcon : `text-gray-400 ${styles.hoverIcon}`}`}
                    strokeWidth={2.5}
                  />

                  <span className={`absolute bottom-0 left-0 h-1 ${styles.underline} transform skew-x-[-20deg] transition duration-300 ease-out ${styles.shadow} ${
                    active ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}></span>
                </NavItem>
              );
            })}

            {/* Language Switcher Desktop */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 xl:gap-4 ml-4 pl-4 border-l-2 border-neutral-800 group h-10 min-h-[44px]"
              title={t.navigation.navbar.switchLanguage}
            >
              <div 
                className={`relative transition duration-300 ease-out transform-gpu origin-center ${
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
                className={`relative transition duration-300 ease-out transform-gpu origin-center ${
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
                <Link to={localizePath('/profile', language)} className="font-retro text-lg tracking-wide text-gray-300 hover:text-white transition-colors max-w-[140px] truncate">
                   {currentUser.displayName || 'Hero'}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-neutral-900 hover:bg-red-900 text-white p-2 rounded-lg border border-red-900/50 transition duration-300 hover:rotate-6 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title={t.navigation.navbar.logout}
                >
                  <Icon name="log-out" size={18} />
                </button>
              </div>
            ) : (
              <ComicButton
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 xl:px-6 py-2 text-lg ml-2"
              >
                {t.navigation.navbar.login}
              </ComicButton>
            )}
            </AuthSlot>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="xl:hidden text-white hover:text-red-500 transition-colors p-2 relative z-50"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <Icon name="x" size={32} strokeWidth={2.5} /> : <Icon name="menu" size={32} strokeWidth={2.5} />}
          </button>
        </div>

        {/* Mobile Menu (eigene Datei: `nav/MobileDrawer.tsx`) */}
        <MobileDrawer
          open={isOpen}
          onClose={() => setIsOpen(false)}
          links={navLinks}
          getLinkState={(href) => ({ active: checkIsActive(href), styles: getNavStyle(href) })}
          t={t}
          language={language}
          setLanguage={setLanguage}
          currentUser={currentUser}
          authLoading={authLoading}
          onLoginClick={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          showWarp={showWarp}
        />

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
            <ResponsiveImage
                spec={LOGO_IMAGE}
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