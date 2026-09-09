/**
 * domainConfig.ts — Domain-Routing der 6 RonniX-Sites in EINER Codebase.
 *
 * Feature: bildet Kategorie <-> Domain ab (`DOMAIN_MAP`), erkennt die aktuelle
 * Kategorie per Hostname (`getCurrentCategory`, localhost via `?site=`-Simulation)
 * und baut korrekte interne/externe Links (`getLinkUrl`, inkl. `?lang=`-Handover).
 * Use Cases: Navbar-Links, Kategorie-Routen (`/comix`, `/boox`, ...), SEO-Canonicals,
 * SSO-Basis (Authority = `main`). Benutzung: `getLinkUrl(path, lang)` statt
 * hartcodierter URLs. Gehört NICHT hierher: SSO-Token/Timeouts/Allowlist
 * (siehe `utils/ssoConfig.ts`) und URL-Sicherheitsvalidierung (`utils/ssoValidation.ts`).
 */

export type SiteCategory = 'main' | 'comics' | 'boox' | 'gamez' | 'moviez' | 'seriez';

/** Mapping der Kategorien zu den echten Domains (ohne Protokoll). Zentrale Quelle, auch für SSO-Allowlist. */
export const DOMAIN_MAP: Record<SiteCategory, string> = {
  main: 'ronnixentertainment.de', 
  comics: 'ronnixcomix.de',       
  boox: 'ronnixboox.de',          
  gamez: 'lamazgamez.de',         
  moviez: 'ronnixmoviez.de',      
  seriez: 'ronnixseriez.de',      
};

// Helper: Bestimmt die Kategorie anhand des Pfades
export const getTargetCategory = (path: string): SiteCategory => {
  // Behandelt auch /comix als Alias für comics
  if (path.startsWith('/comics') || path === '/comics' || path.startsWith('/comix') || path === '/comix') return 'comics';
  if (path.startsWith('/boox') || path === '/boox') return 'boox';
  if (path.startsWith('/gamez') || path === '/gamez') return 'gamez';
  if (path.startsWith('/moviez') || path === '/moviez') return 'moviez';
  if (path.startsWith('/seriez') || path === '/seriez') return 'seriez';
  
  // Default Main Pages
  return 'main';
};

// true auf localhost / 127.0.0.1 (egal welcher Port) — dort läuft das lokale Test-Hosting.
export const isLocalhost = (): boolean => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname.toLowerCase();
  return h.includes('localhost') || h === '127.0.0.1';
};

// Localhost-Simulation der 6 Domains: ?site=comics|boox|gamez|moviez|seriez|main
// Der Param bleibt bookmarkbar in der URL; zusätzlich wird er in localStorage
// persistiert, damit die Simulation bei Navigation ohne Param erhalten bleibt.
const LOCAL_SITE_KEY = 'ronnix-local-site';
const VALID_SITES: SiteCategory[] = ['main', 'comics', 'boox', 'gamez', 'moviez', 'seriez'];

export const getLocalSiteOverride = (): SiteCategory | null => {
  if (!isLocalhost()) return null;
  try {
    const param = new URLSearchParams(window.location.search).get('site');
    if (param && (VALID_SITES as string[]).includes(param)) {
      localStorage.setItem(LOCAL_SITE_KEY, param);
      return param as SiteCategory;
    }
    const stored = localStorage.getItem(LOCAL_SITE_KEY);
    if (stored && (VALID_SITES as string[]).includes(stored)) return stored as SiteCategory;
  } catch {}
  return null;
};

export const setLocalSiteOverride = (site: SiteCategory | null): void => {
  try {
    if (!site || site === 'main') localStorage.removeItem(LOCAL_SITE_KEY);
    else localStorage.setItem(LOCAL_SITE_KEY, site);
  } catch {}
};

// Erkennt anhand des Hostnames, auf welcher "Seite" wir uns befinden (SSG-safe)
// Auf localhost greift die ?site=/localStorage-Simulation (sonst immer 'main').
export const getCurrentCategory = (): SiteCategory => {
  if (typeof window === 'undefined') return 'main';
  if (isLocalhost()) return getLocalSiteOverride() ?? 'main';
  const hostname = window.location.hostname.toLowerCase();

  // ComiX
  if (hostname.includes('ronnixcomix')) return 'comics';
  
  // Neue Domains
  if (hostname.includes('ronnixboox')) return 'boox';
  if (hostname.includes('lamazgamez')) return 'gamez';
  if (hostname.includes('ronnixmoviez')) return 'moviez';
  if (hostname.includes('ronnixseriez')) return 'seriez';
  
  // Fallback für ronnixentertainment.de
  return 'main';
};

// Generiert die korrekte URL für einen Pfad
export const getLinkUrl = (path: string, currentLang?: string): { url: string; isExternal: boolean } => {
  const currentCategory = getCurrentCategory();
  const targetCategory = getTargetCategory(path);
  const isLocal = isLocalhost();

  // Für Production nutzen wir immer https, für Localhost dynamisch
  const protocol = isLocal && typeof window !== 'undefined' ? window.location.protocol + '//' : 'https://';

  let resultUrl = '';
  let isExternal = false;

  // 1. Fall: Wir sind auf einer Sub-Domain und wollen zur Hauptseite (Home)
  if (path === '/' && currentCategory !== 'main') {
     if (isLocal) {
         resultUrl = '/'; // Im Dev-Mode bleiben wir oft auf derselben Instanz
         isExternal = false;
     } else {
         const targetDomain = DOMAIN_MAP['main'];
         resultUrl = `${protocol}${targetDomain}/`;
         isExternal = true;
     }
  }
  // 2. Fall: Ziel ist auf derselben Domain (z.B. Impressum oder wir sind schon auf der richtigen Sub-Domain)
  else if (targetCategory === currentCategory) {
    // Wenn wir z.B. auf ronnixcomix.de sind und auf /comics klicken, leiten wir auf Root /
    if (targetCategory !== 'main' && (path.includes(targetCategory) || path.includes('comix'))) {
        resultUrl = '/';
    } else {
        resultUrl = path;
    }
    isExternal = false;
  }
  // 3. Fall: Domain-Wechsel notwendig (z.B. von Main nach Comics)
  else {
      // Localhost: Pfad-Simulation — alle Kategorie-Links bleiben interne SPA-Routen
      // (App.tsx rendert dort die Sections direkt statt auf Live-Domains zu springen).
      // Relative Pfade sind automatisch port-sicher (gleiche Origin inkl. :4174).
      if (isLocal) {
          resultUrl = path;
          isExternal = false;
      } else {
          const targetDomain = DOMAIN_MAP[targetCategory];
          
          // Bereinigung: Wir wollen meist auf die Startseite der neuen Domain
          // z.B. ronnixentertainment.de/boox -> ronnixboox.de/
          let cleanPath = path;
          if (targetCategory !== 'main') {
              // Wenn es ein generischer Kategorie-Link ist, ab zur Startseite der Subdomain
              if (path === `/${targetCategory}` || path.startsWith(`/${targetCategory}`) || path.includes('comix')) {
                  cleanPath = '/';
              }
              // Wenn es ein Deep-Link ist (z.B. /post/123), behalten wir ihn bei?
              // Aktuell gehen wir davon aus, dass die Subdomains die Posts unter /post/:id haben.
          }

          resultUrl = `${protocol}${targetDomain}${cleanPath}`;
          isExternal = true;
      }
  }

  // Language Parameter anhängen, wenn wir die Domain wechseln
  if (isExternal && currentLang) {
      const separator = resultUrl.includes('?') ? '&' : '?';
      resultUrl = `${resultUrl}${separator}lang=${currentLang}`;
  }

  return { url: resultUrl, isExternal };
};