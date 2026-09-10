/**
 * App.tsx — Root: Router, Domain-Heimatroute, SSO-Weichen, globale Provider.
 *
 * Feature: rendert pro Domain die passende Sektion (`/` je Hostname bzw. lokale
 * `?site=`-Simulation), leitet Kategorie-Pfade live per `ExternalRedirect` mit
 * SSO-Token (Fragment-Transport) weiter und mountet `SSOAutoLogin` (stiller
 * Iframe-Check), `LanguageParamSynchronizer` (`?lang=`-Handover → stabile
 * `/en/`-Pfade), `LanguagePathSynchronizer` (Pfad ↔ Sprache) und SSO-Routen
 * (`/sso`, `/sso-bounce`, `/sso-seed`, `/global-logout`, alle noIndex).
 * Alle Inhaltsrouten existieren zweisprachig (DE pfadrein, EN `/en/`-Prefix);
 * SEO-Titel/Descriptions kommen aus `HOME_SEO` (`utils/domainConfig.ts`).
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
import { FaqSchema } from './components/FaqSchema';
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
const Danke = lazy(() => import('./components/pages/Danke').then(m => ({ default: m.Danke })));
const Search = lazy(() => import('./components/pages/Search').then(m => ({ default: m.Search })));
import { SSOAutoLogin } from './components/SSOAutoLogin';
import { ViewTransitionHandler } from './components/ViewTransitionHandler';
import {
  getCurrentCategory,
  isLocalhost,
  getLocalSiteOverride,
  setLocalSiteOverride,
  stripLangPrefix,
  localizePath,
  HOME_SEO,
  TRANSIENT_PATHS,
} from './utils/domainConfig';
import type { SiteCategory } from './utils/domainConfig';

const RouteFallback = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>
);

const NotFound = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-6 py-24 text-center min-h-[50vh]">
      <SEO title="404" noIndex />
      <h1 className="text-5xl font-retro text-white mb-4">404</h1>
      <p className="text-gray-400 mb-6">{t.home.common.notFoundText}</p>
      <Link to="/" className="text-red-500 hover:underline">{t.home.common.goHome}</Link>
    </div>
  );
};

// Screenreader-H1 für Listen-Seiten (visuelles Design nutzt H2-Kicker,
// Crawler/KI brauchen genau eine H1 pro URL — DE pfadrein, EN `/en/`).
const CategoryH1 = ({ de, en }: { de: string; en: string }) => {
  const { language } = useLanguage();
  return <h1 className="sr-only">{language === 'en' ? en : de}</h1>;
};

// Seiten-Wrapper (einmal definiert, je Sprache einmal geroutet — kein Copy-Paste pro `/en/`).
const NewsPage = () => (
  <div className="container mx-auto px-6 py-24 animate-fade-in">
    <SEO
      title="News & Updates"
      titleEn="News & Updates"
      description="Neuigkeiten aus dem RonniX-Universum: Comics, Bücher, Games, Filme & Serien."
      descriptionEn="News & updates from the RonniX universe: comics, books, games, movies & series."
      canonicalPath="/news"
    />
    <CategoryH1 de="News & Updates" en="News & Updates" />
    <NewsSection />
  </div>
);

const ContactPage = () => (
  <div className="container mx-auto px-6 py-24 animate-fade-in">
    <SEO
      title="Kontakt"
      titleEn="Contact"
      description="Kontakt zum RonniX-Team."
      descriptionEn="Contact the RonniX team."
      canonicalPath="/contact"
    />
    <FaqSchema />
    <CategoryH1 de="Kontakt" en="Contact" />
    <ContactSection />
  </div>
);

const ProfilePage = () => (
  <div className="animate-fade-in">
    <SEO title="Dein Profil" noIndex />
    <UserProfile />
  </div>
);

const CreatePage = () => (
  <div className="animate-fade-in">
    <SEO title="Erstellen" noIndex />
    <CreatePost />
  </div>
);

const EditPage = () => (
  <div className="animate-fade-in">
    <SEO title="Bearbeiten" noIndex />
    <CreatePost />
  </div>
);

interface LegalPageProps {
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn: string;
  canonicalPath: string;
  Page: React.ComponentType;
}

const LegalPage: React.FC<LegalPageProps> = ({ title, titleEn, description, descriptionEn, canonicalPath, Page }) => (
  <>
    <SEO title={title} titleEn={titleEn} description={description} descriptionEn={descriptionEn} canonicalPath={canonicalPath} />
    <Page />
  </>
);

const ThanksPage = () => (
  <div className="animate-fade-in">
    <SEO title="Danke" titleEn="Thank you" noIndex />
    <Danke />
  </div>
);

const IMPRESSUM_COPY = {
  description: 'Impressum von RonniX Entertainment – Anbieterkennzeichnung und Kontakt.',
  descriptionEn: 'Legal notice of RonniX Entertainment – provider identification and contact.',
};
const DATENSCHUTZ_COPY = {
  description: 'Datenschutzerklärung von RonniX Entertainment – so schützen wir deine Daten.',
  descriptionEn: 'Privacy policy of RonniX Entertainment – how we protect your data.',
};
const AGB_COPY = {
  description: 'AGB von RonniX Entertainment – Nutzungsbedingungen der Community.',
  descriptionEn: 'Terms of RonniX Entertainment – community terms of use.',
};

const MaintenanceBanner = () => {
  // Unbedingt aufgerufen (Hooks-Reihenfolge); der Hook wirft nie (Defaults bei Fehlern).
  const { maintenanceMode } = useRemoteConfigFlags();
  const { t } = useLanguage();
  if (!maintenanceMode) return null;
  return (
    <div className="bg-yellow-600 text-black text-center text-sm font-bold py-2 px-4">
      {t.home.common.maintenanceMsg}
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

// Skip-Link für Tastatur-/Screenreader-Nutzer (WCAG 2.4.1): springt direkt zum Inhalt.
const SkipLink = () => {
  const { t } = useLanguage();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-red-700 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:font-bold"
    >
      {t.navigation.navbar.skipToContent}
    </a>
  );
};

// Component to sync URL param ?lang=de/en to Context.
// Cross-Domain-Handover (?lang=) wird einmalig in STABILE Pfade konsumiert:
// EN → `/en/...` (indexierbar), DE → pfadrein. Restliche Params (?site=) bleiben.
// Danach steuert der Pfad (`LanguagePathSynchronizer`), der Param ist verbraucht.
const LanguageParamSynchronizer = () => {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  React.useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam !== 'de' && langParam !== 'en') return;

    if (langParam !== language) {
      setLanguage(langParam);
    }

    const rest = new URLSearchParams(searchParams);
    rest.delete('lang');
    const qs = rest.toString();
    const targetPath = langParam === 'en'
      ? localizePath(stripLangPrefix(pathname).clean, 'en')
      : stripLangPrefix(pathname).clean;
    navigate({ pathname: targetPath, search: qs ? `?${qs}` : '' }, { replace: true });
  }, [searchParams, pathname, language, setLanguage, navigate]);

  return null;
};

// Component to sync the stable `/en/` path prefix with Context.
// - `/en/...` → Sprache EN (stabile, indexierbare EN-URL).
// - `/de/...` → Redirect auf pfadreine DE-URL (DE bleibt ohne Prefix).
// - Kein Prefix + gespeicherte EN-Sprache → Redirect auf `/en/...`.
// Transiente Routen (SSO/Logout) sind ausgenommen.
const LanguagePathSynchronizer = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  React.useEffect(() => {
    const { clean, lang } = stripLangPrefix(pathname);
    if (TRANSIENT_PATHS.some((t) => clean === t || clean.startsWith(t + '/'))) return;

    if (lang === 'en') {
      if (language !== 'en') setLanguage('en');
      return;
    }
    if (lang === 'de') {
      if (language !== 'de') setLanguage('de');
      navigate({ pathname: clean, search }, { replace: true });
      return;
    }
    if (language === 'en') {
      navigate({ pathname: localizePath(clean, 'en'), search }, { replace: true });
    }
  }, [pathname, search, language, setLanguage, navigate]);

  return null;
};

// Component to handle client-side redirects to external domains with SSO support
// (Token im Fragment statt Query, Timeout+Cache via useCrossDomainToken)
const ExternalRedirect = ({ to }: { to: string }) => {
  const { currentUser, loading } = useAuth();
  const { getToken } = useCrossDomainToken();
  const { language, t } = useLanguage(); // Get current language to pass it along

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
            {t.home.common.warpingMsg}
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
  // SEO-Titel/Descriptions sind keyword-first und zweisprachig (`HOME_SEO`,
  // `utils/domainConfig.ts`); die Sprache wählt `SEO.tsx` selbst per Context.
  const renderCategoryHome = (category: Exclude<SiteCategory, 'main'>, Section: React.ComponentType) => {
    const copy = HOME_SEO[category];
    return (
      <div className="container mx-auto px-6 py-24 animate-fade-in">
        <SEO
          title={copy.de.title}
          titleEn={copy.en.title}
          description={copy.de.description}
          descriptionEn={copy.en.description}
        />
        <StructuredData type="WebSite" data={{}} />
        <CategoryH1 de={copy.de.title} en={copy.en.title} />
        <Section />
      </div>
    );
  };

  const renderCategorySection = (category: SiteCategory) => {
    switch (category) {
      case 'comics':
        return renderCategoryHome('comics', ComicsSection);
      case 'boox':
        return renderCategoryHome('boox', BooksSection);
      case 'gamez':
        return renderCategoryHome('gamez', GamesSection);
      case 'moviez':
        return renderCategoryHome('moviez', MoviesSection);
      case 'seriez':
        return renderCategoryHome('seriez', SeriesSection);
      case 'main':
      default: {
        const copy = HOME_SEO.main;
        return (
          <>
            <SEO
              title={copy.de.title}
              titleEn={copy.en.title}
              description={copy.de.description}
              descriptionEn={copy.en.description}
            />
            <StructuredData type="WebSite" data={{}} />
            <StructuredData type="Organization" data={{}} />
            <Hero />
            <HomeLatestSection />
          </>
        );
      }
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
            <LanguagePathSynchronizer />
            <SkipLink />
            <SSOAutoLogin />
            <MaintenanceBanner />

            <div className="flex flex-col min-h-[100dvh] bg-neutral-950 font-sans text-white overflow-x-clip w-full relative">
              <SiteSwitcher />
              <Navbar />

              <main id="main" className="flex-grow">
                <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Stabile Sprach-URLs: DE pfadrein, EN mit `/en/`-Prefix
                      (react-router v6: je Sprache eine Route, keine Arrays). */}
                  <Route path="/" element={renderHomeRoute()} />
                  <Route path="/en" element={renderHomeRoute()} />

                  {/* SSO Handlers (noIndex, kein Duplicate, markenreiner Tab-Titel ohne "SSO") */}
                  <Route path="/sso" element={<><SEO title="SSO" noIndex bareTitle /><SSOCallback /></>} />
                  <Route path="/en/sso" element={<><SEO title="SSO" noIndex bareTitle /><SSOCallback /></>} />
                  <Route path="/sso-bounce" element={<><SEO title="SSO" noIndex bareTitle /><SSOBounce /></>} />
                  <Route path="/en/sso-bounce" element={<><SEO title="SSO" noIndex bareTitle /><SSOBounce /></>} />
                  <Route path="/sso-seed" element={<><SEO title="SSO" noIndex bareTitle /><SSOSeed /></>} />
                  <Route path="/en/sso-seed" element={<><SEO title="SSO" noIndex bareTitle /><SSOSeed /></>} />
                  <Route path="/global-logout" element={<><SEO title="Logout" noIndex bareTitle /><GlobalLogout /></>} />
                  <Route path="/en/global-logout" element={<><SEO title="Logout" noIndex bareTitle /><GlobalLogout /></>} />

                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/en/news" element={<NewsPage />} />

                  <Route path="/comix" element={categoryRoute('comics', 'https://ronnixcomix.de')} />
                  <Route path="/en/comix" element={categoryRoute('comics', 'https://ronnixcomix.de')} />
                  <Route path="/boox" element={categoryRoute('boox', 'https://ronnixboox.de')} />
                  <Route path="/en/boox" element={categoryRoute('boox', 'https://ronnixboox.de')} />
                  <Route path="/gamez" element={categoryRoute('gamez', 'https://lamazgamez.de')} />
                  <Route path="/en/gamez" element={categoryRoute('gamez', 'https://lamazgamez.de')} />
                  <Route path="/moviez" element={categoryRoute('moviez', 'https://ronnixmoviez.de')} />
                  <Route path="/en/moviez" element={categoryRoute('moviez', 'https://ronnixmoviez.de')} />
                  <Route path="/seriez" element={categoryRoute('seriez', 'https://ronnixseriez.de')} />
                  <Route path="/en/seriez" element={categoryRoute('seriez', 'https://ronnixseriez.de')} />

                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/en/contact" element={<ContactPage />} />

                  <Route path="/danke" element={<ThanksPage />} />
                  <Route path="/en/danke" element={<ThanksPage />} />

                  <Route path="/search" element={<Search />} />
                  <Route path="/en/search" element={<Search />} />

                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/en/profile" element={<ProfilePage />} />

                  <Route path="/create" element={<CreatePage />} />
                  <Route path="/en/create" element={<CreatePage />} />

                  <Route path="/edit/:id" element={<EditPage />} />
                  <Route path="/en/edit/:id" element={<EditPage />} />

                  <Route path="/post/:id" element={<PostDetail />} />
                  <Route path="/en/post/:id" element={<PostDetail />} />

                  <Route path="/impressum" element={<LegalPage title="Impressum" titleEn="Imprint" canonicalPath="/impressum" Page={Impressum} {...IMPRESSUM_COPY} />} />
                  <Route path="/en/impressum" element={<LegalPage title="Impressum" titleEn="Imprint" canonicalPath="/impressum" Page={Impressum} {...IMPRESSUM_COPY} />} />
                  <Route path="/datenschutz" element={<LegalPage title="Datenschutz" titleEn="Privacy Policy" canonicalPath="/datenschutz" Page={Datenschutz} {...DATENSCHUTZ_COPY} />} />
                  <Route path="/en/datenschutz" element={<LegalPage title="Datenschutz" titleEn="Privacy Policy" canonicalPath="/datenschutz" Page={Datenschutz} {...DATENSCHUTZ_COPY} />} />
                  <Route path="/agb" element={<LegalPage title="AGB" titleEn="Terms and Conditions" canonicalPath="/agb" Page={AGB} {...AGB_COPY} />} />
                  <Route path="/en/agb" element={<LegalPage title="AGB" titleEn="Terms and Conditions" canonicalPath="/agb" Page={AGB} {...AGB_COPY} />} />

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
