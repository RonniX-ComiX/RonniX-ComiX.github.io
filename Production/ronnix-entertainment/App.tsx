/**
 * App.tsx — Root: Router, Domain-Heimatroute, SSO-Weichen, globale Provider.
 *
 * Feature: rendert pro Domain die passende Sektion (`/` je Hostname bzw. lokale
 * `?site=`-Simulation), leitet Kategorie-Pfade live per `ExternalRedirect` mit
 * SSO-Token (Fragment-Transport) weiter und mountet `SSOAutoLogin` (stiller
 * Iframe-Check), `LanguageParamSynchronizer` (`?lang=`-Handover) und SSO-Routen
 * (`/sso`, `/sso-bounce`, `/sso-seed`, `/global-logout`, alle noIndex).
 * Gehört NICHT hierher: SSO-Details (siehe `utils/sso*.ts`, `components/SSOAutoLogin`).
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { useCrossDomainToken } from './hooks/useCrossDomainToken';
import { buildSsoUrl } from './utils/ssoValidation';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HomeLatestSection } from './components/sections/HomeLatestSection';
import { ComicsSection } from './components/sections/ComicsSection';
import { BooksSection } from './components/sections/BooksSection';
import { GamesSection } from './components/sections/GamesSection';
import { MoviesSection } from './components/sections/MoviesSection';
import { SeriesSection } from './components/sections/SeriesSection';
import { NewsSection } from './components/sections/NewsSection';
import { ContactSection } from './components/sections/ContactSection';
import { Footer } from './components/Footer';
import { SEO } from './components/SEO';
import { StructuredData } from './components/StructuredData';
import { useRemoteConfigFlags } from './hooks/useRemoteConfigFlags';

// Code-Splitting: schwere/Admin/SSO-Routen lazy (kleineres Initial-Bundle, bessere LCP)
const Impressum = lazy(() => import('./components/pages/Impressum').then(m => ({ default: m.Impressum })));
const Datenschutz = lazy(() => import('./components/pages/Datenschutz').then(m => ({ default: m.Datenschutz })));
const AGB = lazy(() => import('./components/pages/AGB').then(m => ({ default: m.AGB })));
const UserProfile = lazy(() => import('./components/pages/UserProfile').then(m => ({ default: m.UserProfile })));
const CreatePost = lazy(() => import('./components/pages/CreatePost').then(m => ({ default: m.CreatePost })));
const PostDetail = lazy(() => import('./components/pages/PostDetail').then(m => ({ default: m.PostDetail })));
const SSOCallback = lazy(() => import('./components/pages/SSOCallback').then(m => ({ default: m.SSOCallback })));
const SSOBounce = lazy(() => import('./components/pages/SSOBounce').then(m => ({ default: m.SSOBounce })));
const SSOSeed = lazy(() => import('./components/pages/SSOSeed').then(m => ({ default: m.SSOSeed })));
const GlobalLogout = lazy(() => import('./components/pages/GlobalLogout').then(m => ({ default: m.GlobalLogout })));
import { SSOAutoLogin } from './components/SSOAutoLogin';
import { ViewTransitionHandler } from './components/ViewTransitionHandler';
import { getCurrentCategory, isLocalhost, getLocalSiteOverride, setLocalSiteOverride } from './utils/domainConfig';
import type { SiteCategory } from './utils/domainConfig';

const RouteFallback = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>
);

const NotFound = () => (
  <div className="container mx-auto px-6 py-24 text-center min-h-[50vh]">
    <SEO title="404" noIndex />
    <h1 className="text-5xl font-retro text-white mb-4">404</h1>
    <p className="text-gray-400 mb-6">Diese Seite existiert nicht.</p>
    <Link to="/" className="text-red-500 hover:underline">Zur Startseite</Link>
  </div>
);

const MaintenanceBanner = () => {
  let maintenance = false;
  try {
    maintenance = useRemoteConfigFlags().maintenanceMode;
  } catch {}
  if (!maintenance) return null;
  return (
    <div className="bg-yellow-600 text-black text-center text-sm font-bold py-2 px-4">
      Wartungsmodus – einige Funktionen sind temporär eingeschränkt.
    </div>
  );
};

// DEV-only Site-Switcher fürs lokale Test-Hosting (localhost:4174).
// Wird im Production-Build nie gerendert. Setzt die ?site=-Simulation
// (persistiert in localStorage), damit alle 6 Domain-Ansichten lokal testbar sind.
const LOCAL_SITES: { id: SiteCategory; label: string }[] = [
  { id: 'main', label: 'Main' },
  { id: 'comics', label: 'Comix' },
  { id: 'boox', label: 'Boox' },
  { id: 'gamez', label: 'Gamez' },
  { id: 'moviez', label: 'Moviez' },
  { id: 'seriez', label: 'Seriez' },
];

const SiteSwitcher = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  if (!import.meta.env.DEV) return null;
  if (!isLocalhost()) return null;

  const active = getLocalSiteOverride() ?? 'main';

  const pick = (site: SiteCategory) => {
    setLocalSiteOverride(site === 'main' ? null : site);
    // ?site= in der URL halten (bookmarkbar); localStorage trägt die Simulation
    // bei Folgnavigationen ohne Param weiter.
    const params = new URLSearchParams(search);
    if (site === 'main') params.delete('site');
    else params.set('site', site);
    const qs = params.toString();
    navigate({ pathname: '/', search: qs ? `?${qs}` : '' });
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-1.5 flex items-center justify-center gap-1.5 flex-wrap" title="Nur DEV: simuliert die 6 Live-Domains auf localhost">
      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mr-1">Local-Site:</span>
      {LOCAL_SITES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => pick(s.id)}
          className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
            active === s.id
              ? 'bg-red-700 border-red-500 text-white'
              : 'bg-black border-neutral-700 text-gray-400 hover:text-white hover:border-gray-500'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

// Wrapper component to handle page specific layout or effects (like scroll to top)
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// NEW: Component to sync URL param ?lang=de/en to Context
// This ensures that when arriving from another domain, the language preference is respected immediately.
// UPDATED: Now consumes and removes the param so manual switching works afterwards.
const LanguageParamSynchronizer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, setLanguage } = useLanguage();

  React.useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam === 'de' || langParam === 'en') {
      // 1. Sync URL param to Context/LocalStorage if different
      if (langParam !== language) {
        setLanguage(langParam);
      }
      
      // 2. CLEANUP: Remove the query parameter.
      // This prevents the URL from overriding the user's manual choice later.
      // We "consume" the parameter once, then clean it up to allow manual toggling.
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('lang');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, language, setLanguage, setSearchParams]);

  return null;
};

// Component to handle client-side redirects to external domains with SSO support
// (Token im Fragment statt Query, Timeout+Cache via useCrossDomainToken)
const ExternalRedirect = ({ to }: { to: string }) => {
  const { currentUser, loading } = useAuth();
  const { getToken } = useCrossDomainToken();
  const { language } = useLanguage(); // Get current language to pass it along

  React.useEffect(() => {
    // If auth is still loading, wait.
    if (loading) return;

    const performRedirect = async () => {
        // Prepare target URL with language parameter
        // This ensures the destination domain knows which language to display
        const targetUrlObj = new URL(to);
        targetUrlObj.searchParams.set('lang', language);
        const finalTo = targetUrlObj.toString();

        // GUEST OPTIMIZATION:
        // If not logged in, redirect immediately without fetching tokens or showing spinners.
        if (!currentUser) {
             window.location.replace(finalTo);
             return;
        }

        // LOGGED IN:
        // Try to get an SSO token before redirecting
        try {
            const token = await getToken();
            if (token) {
                // SSO-Landing mit Fragment-Transport (Token nie in Server-Logs)
                window.location.replace(buildSsoUrl(targetUrlObj.origin, token, targetUrlObj.pathname + targetUrlObj.search));
                return;
            }
        } catch (e) {
            console.error('[sso] Redirect-Token fehlgeschlagen, direkter Link als Fallback', e);
        }

        // Fallback for failed token gen
        window.location.replace(finalTo);
    };

    performRedirect();
  }, [to, currentUser, getToken, loading, language]);

  // VISUAL OPTIMIZATION:
  // If loading or no user, render NOTHING. This prevents the "Warping/Redirecting" flicker for guests.
  // The browser will simply stay on the previous paint for a split second and then load the new URL.
  if (loading || !currentUser) {
      return null;
  }

  // Only show the Warp Spinner if we are actually checking a user
  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        <p className="text-gray-400 font-retro tracking-wide animate-pulse">
            Warping to Sector...
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const currentCategory = getCurrentCategory();
  const helmetContext = {};

  // Rendert die Kategorie-Startseite für eine gegebene Kategorie.
  // Auf Live-Domains kommt die Kategorie vom Hostname, auf localhost zusätzlich
  // von der ?site=-Simulation — und die /comix|/boox|...-Routen nutzen dieselbe
  // Funktion, damit lokale Tests nie auf Production springen.
  const renderCategorySection = (category: SiteCategory) => {
    switch (category) {
      case 'comics':
        return (
          <div className="container mx-auto px-6 py-12 animate-fade-in">
            <SEO 
              title="Startseite" 
              description="RonniX Entertainment - Rezensionen zu Graphic Novels, Superhelden und Manga." 
            />
            <StructuredData type="WebSite" data={{}} />
            <ComicsSection />
          </div>
        );
      case 'boox':
        return (
          <div className="container mx-auto px-6 py-12 animate-fade-in">
            <SEO 
              title="Startseite" 
              description="RonniX BooX - Bücher, Romane und Fantasy Welten im Check." 
            />
            <StructuredData type="WebSite" data={{}} />
            <BooksSection />
          </div>
        );
      case 'gamez':
        return (
          <div className="container mx-auto px-6 py-12 animate-fade-in">
            <SEO 
              title="Startseite" 
              description="Lamaz GameZ - Indie Games, Retro Klassiker und Gaming Culture." 
            />
            <StructuredData type="WebSite" data={{}} />
            <GamesSection />
          </div>
        );
      case 'moviez':
        return (
          <div className="container mx-auto px-6 py-12 animate-fade-in">
            <SEO 
              title="Startseite" 
              description="RonniX MovieZ - Filmkritiken, Blockbuster und Hidden Gems." 
            />
            <StructuredData type="WebSite" data={{}} />
            <MoviesSection />
          </div>
        );
      case 'seriez':
        return (
          <div className="container mx-auto px-6 py-12 animate-fade-in">
            <SEO 
              title="Startseite" 
              description="RonniX SerieZ - Binge-Watching Tipps und Serien Analysen." 
            />
            <StructuredData type="WebSite" data={{}} />
            <SeriesSection />
          </div>
        );
      case 'main':
      default:
        return (
          <>
            <SEO
              title="Home"
              description="RonniX Entertainment - Dein Hub für Comics, Bücher, Games und Filme."
            />
            <StructuredData type="WebSite" data={{}} />
            <Hero />
            <HomeLatestSection />
          </>
        );
    }
  };

  // Determine what to render on the "/" route based on the domain (or localhost simulation)
  const renderHomeRoute = () => renderCategorySection(currentCategory);

  // Localhost: Kategorie-Pfade rendern die Section direkt (Pfad-Simulation),
  // damit Tests nie auf Production springen. Live bleibt ExternalRedirect.
  const isLocal = isLocalhost();
  const categoryRoute = (category: SiteCategory, liveUrl: string) => (
    isLocal ? renderCategorySection(category) : <ExternalRedirect to={liveUrl} />
  );

  return (
    <HelmetProvider context={helmetContext}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <ViewTransitionHandler />
            <LanguageParamSynchronizer />
            <SSOAutoLogin />
            <MaintenanceBanner />

            <div className="flex flex-col min-h-screen bg-neutral-950 font-sans text-white overflow-x-hidden w-full relative">
              <SiteSwitcher />
              <Navbar />

              <main className="flex-grow">
                <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={renderHomeRoute()} />

                  {/* SSO Handlers (noIndex, kein Duplicate, markenreiner Tab-Titel ohne "SSO") */}
                  <Route path="/sso" element={<><SEO title="SSO" noIndex bareTitle /><SSOCallback /></>} />
                  <Route path="/sso-bounce" element={<><SEO title="SSO" noIndex bareTitle /><SSOBounce /></>} />
                  <Route path="/sso-seed" element={<><SEO title="SSO" noIndex bareTitle /><SSOSeed /></>} />
                  <Route path="/global-logout" element={<><SEO title="Logout" noIndex bareTitle /><GlobalLogout /></>} />

                  <Route path="/news" element={
                    <div className="container mx-auto px-6 py-12 animate-fade-in">
                      <SEO title="News & Updates" description="Neuigkeiten aus dem RonniX-Universum: Comics, Bücher, Games, Filme & Serien." canonicalPath="/news" />
                      <NewsSection />
                    </div>
                  } />

                  <Route path="/comix" element={categoryRoute('comics', 'https://ronnixcomix.de')} />
                  <Route path="/boox" element={categoryRoute('boox', 'https://ronnixboox.de')} />
                  <Route path="/gamez" element={categoryRoute('gamez', 'https://lamazgamez.de')} />
                  <Route path="/moviez" element={categoryRoute('moviez', 'https://ronnixmoviez.de')} />
                  <Route path="/seriez" element={categoryRoute('seriez', 'https://ronnixseriez.de')} />

                  <Route path="/contact" element={
                    <div className="container mx-auto px-6 py-12 animate-fade-in">
                      <SEO title="Kontakt" description="Kontakt zum RonniX-Team." canonicalPath="/contact" />
                      <ContactSection />
                    </div>
                  } />

                  <Route path="/profile" element={
                    <div className="animate-fade-in">
                      <SEO title="Dein Profil" noIndex />
                      <UserProfile />
                    </div>
                  } />

                  <Route path="/create" element={
                    <div className="animate-fade-in">
                      <SEO title="Erstellen" noIndex />
                      <CreatePost />
                    </div>
                  } />

                  <Route path="/edit/:id" element={
                    <div className="animate-fade-in">
                      <SEO title="Bearbeiten" noIndex />
                      <CreatePost />
                    </div>
                  } />

                  <Route path="/post/:id" element={<PostDetail />} />

                  <Route path="/impressum" element={<><SEO title="Impressum" canonicalPath="/impressum" /><Impressum /></>} />
                  <Route path="/datenschutz" element={<><SEO title="Datenschutz" canonicalPath="/datenschutz" /><Datenschutz /></>} />
                  <Route path="/agb" element={<><SEO title="AGB" canonicalPath="/agb" /><AGB /></>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </main>

              <Footer />
            </div>
          </Router>
        </LanguageProvider>
      </AuthProvider>
    </HelmetProvider>
  );
};

export default App;
