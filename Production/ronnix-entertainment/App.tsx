

import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
import { SEO } from './components/SEO'; // Import SEO Component
import { StructuredData } from './components/StructuredData'; // Import StructuredData

// Legal Pages
import { Impressum } from './components/pages/Impressum';
import { Datenschutz } from './components/pages/Datenschutz';
import { AGB } from './components/pages/AGB';
import { UserProfile } from './components/pages/UserProfile';
import { CreatePost } from './components/pages/CreatePost';
import { PostDetail } from './components/pages/PostDetail';
import { SSOCallback } from './components/pages/SSOCallback'; 
import { SSOBounce } from './components/pages/SSOBounce'; 
import { SSOSeed } from './components/pages/SSOSeed'; 
import { GlobalLogout } from './components/pages/GlobalLogout';
import { SSOAutoLogin } from './components/SSOAutoLogin'; 
import { getCurrentCategory } from './utils/domainConfig';

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
const ExternalRedirect = ({ to }: { to: string }) => {
  const { currentUser, getCrossDomainToken, loading } = useAuth();
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
            const token = await getCrossDomainToken();
            if (token) {
                // Construct URL for SSO Landing: https://target.com/sso?token=...&returnUrl=/path?lang=de
                const ssoTarget = `${targetUrlObj.origin}/sso?token=${token}&returnUrl=${encodeURIComponent(targetUrlObj.pathname + targetUrlObj.search)}`;
                window.location.replace(ssoTarget);
                return;
            }
        } catch (e) {
            console.error("SSO Redirect failed, falling back to direct link", e);
        }
        
        // Fallback for failed token gen
        window.location.replace(finalTo);
    };
    
    performRedirect();
  }, [to, currentUser, getCrossDomainToken, loading, language]);

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

  // Determine what to render on the "/" route based on the domain
  const renderHomeRoute = () => {
    switch (currentCategory) {
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

  return (
    <HelmetProvider context={helmetContext}>
      <AuthProvider>
        <LanguageProvider>
          <Router>
            <ScrollToTop />
            <LanguageParamSynchronizer /> {/* Ensures language sticks when arriving from other domains */}
            <SSOAutoLogin /> {/* Automatically checks auth status across domains */}
            
            <div className="flex flex-col min-h-screen bg-neutral-950 font-sans text-white overflow-x-hidden w-full relative">
              <Navbar />
              
              <main className="flex-grow">
                <Routes>
                  {/* Dynamic Home Route based on Domain */}
                  <Route path="/" element={renderHomeRoute()} />
                  
                  {/* SSO Handlers */}
                  <Route path="/sso" element={<SSOCallback />} />
                  <Route path="/sso-bounce" element={<SSOBounce />} />
                  <Route path="/sso-seed" element={<SSOSeed />} /> {/* New Route */}
                  <Route path="/global-logout" element={<GlobalLogout />} />

                  <Route path="/news" element={
                    <div className="container mx-auto px-6 py-12 animate-fade-in">
                      <SEO title="News & Updates" />
                      <NewsSection />
                    </div>
                  } />

                  {/* Redirects for main domain navigation to external sub-domains */}
                  <Route path="/comix" element={<ExternalRedirect to="https://ronnixcomix.de" />} />
                  
                  <Route path="/boox" element={<ExternalRedirect to="https://ronnixboox.de" />} />
                  
                  <Route path="/gamez" element={<ExternalRedirect to="https://lamazgamez.de" />} />

                  <Route path="/moviez" element={<ExternalRedirect to="https://ronnixmoviez.de" />} />

                  <Route path="/seriez" element={<ExternalRedirect to="https://ronnixseriez.de" />} />
                  
                  <Route path="/contact" element={
                    <div className="container mx-auto px-6 py-12 animate-fade-in">
                      <SEO title="Kontakt" />
                      <ContactSection />
                    </div>
                  } />
                  
                  <Route path="/profile" element={
                    <div className="animate-fade-in">
                      <SEO title="Dein Profil" />
                      <UserProfile />
                    </div>
                  } />

                  {/* Content Routes */}
                  <Route path="/create" element={
                    <div className="animate-fade-in">
                      <SEO title="Erstellen" />
                      <CreatePost />
                    </div>
                  } />
                  
                  {/* Route for Editing - reuses CreatePost component */}
                  <Route path="/edit/:id" element={
                    <div className="animate-fade-in">
                      <SEO title="Bearbeiten" />
                      <CreatePost />
                    </div>
                  } />
                  
                  <Route path="/post/:id" element={<PostDetail />} />

                  {/* Legal Routes */}
                  <Route path="/impressum" element={
                    <>
                        <SEO title="Impressum" />
                        <Impressum />
                    </>
                  } />
                  <Route path="/datenschutz" element={
                    <>
                        <SEO title="Datenschutz" />
                        <Datenschutz />
                    </>
                  } />
                  <Route path="/agb" element={
                    <>
                        <SEO title="AGB" />
                        <AGB />
                    </>
                  } />

                </Routes>
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
