/**
 * domainConfig.ts — Domain-Routing + zentrale SEO-Quelle der 6 RonniX-Sites in EINER Codebase.
 *
 * Feature: bildet Kategorie <-> Domain ab (`DOMAIN_MAP`), erkennt die aktuelle
 * Kategorie per Hostname (`getCurrentCategory`, localhost via `?site=`-Simulation)
 * und baut korrekte interne/externe Links (`getLinkUrl`, inkl. `?lang=`-Handover).
 * Hält außerdem die kanonischen SEO-Daten je Domain (`SITE_NAMES`, `OG_IMAGES`,
 * `HOME_SEO`) sowie die `/en/`-Pfadlogik (`stripLangPrefix`, `localizePath`):
 * DE ist pfadrein (`/news`), EN trägt Prefix (`/en/news`).
 * Use Cases: Navbar-Links, Kategorie-Routen (`/comix`, `/boox`, ...), SEO-Canonicals,
 * hreflang, OG-Images, SSO-Basis (Authority = `main`). Benutzung:
 * `getLinkUrl(path, lang)` statt hartcodierter URLs, `localizePath(path, lang)`
 * für interne `<Link>`-Ziele. Gehört NICHT hierher: SSO-Token/Timeouts/Allowlist
 * (siehe `utils/ssoConfig.ts`) und URL-Sicherheitsvalidierung (`utils/ssoValidation.ts`).
 */

export type SiteCategory = 'main' | 'comics' | 'boox' | 'gamez' | 'moviez' | 'seriez';

export type SiteLanguage = 'de' | 'en';

/** Mapping der Kategorien zu den echten Domains (ohne Protokoll). Zentrale Quelle, auch für SSO-Allowlist. */
export const DOMAIN_MAP: Record<SiteCategory, string> = {
  main: 'ronnixentertainment.de', 
  comics: 'ronnixcomix.de',       
  boox: 'ronnixboox.de',          
  gamez: 'lamazgamez.de',         
  moviez: 'ronnixmoviez.de',      
  seriez: 'ronnixseriez.de',      
};

/** Anzeigenamen je Domain — einzige Quelle für `<title>`-Suffixe und Schema-Namen. */
export const SITE_NAMES: Record<SiteCategory, string> = {
  main: 'RonniX Entertainment',
  comics: 'RonniX ComiX',
  boox: 'RonniX BooX',
  gamez: 'Lamaz GameZ',
  moviez: 'RonniX MovieZ',
  seriez: 'RonniX SerieZ',
};

/** Domain-spezifische OG-Share-Images (1200x630, `public/images/`). Einzige Quelle für `og:image`. */
export const OG_IMAGES: Record<SiteCategory, string> = {
  main: '/images/preview.png',
  comics: '/images/preview-comix.png',
  boox: '/images/preview-boox.png',
  gamez: '/images/preview-gamez.png',
  moviez: '/images/preview-moviez.png',
  seriez: '/images/preview-seriez.png',
};

/** Maße der OG-Images (alle PNG-Varianten 1730x909, vermessen). */
export const OG_IMAGE_WIDTH = 1730;
export const OG_IMAGE_HEIGHT = 909;

/** Keyword-first Titles + Descriptions der 6 Domain-Homes, je Sprache. */
export interface HomeSeoCopy {
  title: string;
  description: string;
}
export const HOME_SEO: Record<SiteCategory, { de: HomeSeoCopy; en: HomeSeoCopy }> = {
  main: {
    de: {
      title: 'Comics, Bücher, Games & Filme – RonniX Entertainment',
      description: 'RonniX Entertainment: handgemachte Comics, spannende Bücher, Indie-Games sowie Film- & Serienkritiken. Tauch ein ins Universum!',
    },
    en: {
      title: 'Comics, Books, Games & Movies – RonniX Entertainment',
      description: 'RonniX Entertainment: hand-drawn comics, gripping books, indie games plus movie & series reviews. Dive into the universe!',
    },
  },
  comics: {
    de: {
      title: 'Comics, Manga & Graphic Novels – RonniX ComiX',
      description: 'RonniX ComiX: Reviews zu Graphic Novels, Superhelden & Manga – ehrlich, nerdig, mit Liebe zum Panel. Jetzt stöbern!',
    },
    en: {
      title: 'Comics, Manga & Graphic Novels – RonniX ComiX',
      description: 'RonniX ComiX: graphic novel, superhero & manga reviews – honest, nerdy, panel by panel. Start reading!',
    },
  },
  boox: {
    de: {
      title: 'Bücher, Romane & Fantasy – RonniX BooX',
      description: 'RonniX BooX: Buchkritiken zu Fantasy, Sci-Fi & Romanen – Welten entdecken, Autoren feiern, Lesetipps sichern.',
    },
    en: {
      title: 'Books, Novels & Fantasy – RonniX BooX',
      description: 'RonniX BooX: fantasy, sci-fi & fiction book reviews – discover worlds, celebrate authors, grab reading tips.',
    },
  },
  gamez: {
    de: {
      title: 'Indie-Games & Retro-Gaming – Lamaz GameZ',
      description: 'Lamaz GameZ: Indie-Games, Retro-Klassiker & Gaming-Culture im Check – ehrliche Reviews, keine PR-Floskeln.',
    },
    en: {
      title: 'Indie Games & Retro Gaming – Lamaz GameZ',
      description: 'Lamaz GameZ: indie games, retro classics & gaming culture reviewed – honest takes, zero PR fluff.',
    },
  },
  moviez: {
    de: {
      title: 'Filmkritiken & Kinohighlights – RonniX MovieZ',
      description: 'RonniX MovieZ: Filmkritiken zu Blockbustern & Hidden Gems – spoilerarm, pointiert, für echte Filmfans.',
    },
    en: {
      title: 'Movie Reviews & Cinema Highlights – RonniX MovieZ',
      description: 'RonniX MovieZ: blockbuster & hidden-gem movie reviews – spoiler-light, sharp, for true film fans.',
    },
  },
  seriez: {
    de: {
      title: 'Serien-Tipps & Binge-Guide – RonniX SerieZ',
      description: 'RonniX SerieZ: Serienkritiken & Binge-Tipps – welche Staffel lohnt sich wirklich? Finde deine nächste Serie.',
    },
    en: {
      title: 'TV Series Tips & Binge Guide – RonniX SerieZ',
      description: 'RonniX SerieZ: series reviews & binge tips – which season is really worth it? Find your next show.',
    },
  },
};

/** Sprach-Prefix für stabile EN-URLs (`/en/news`). DE bleibt pfadrein. */
export const LANG_PATH_PREFIX = 'en';

/** Transiente Routen (SSO/Logout): nie sprach-präfixiert, nie indexiert. */
export const TRANSIENT_PATHS = ['/sso', '/sso-bounce', '/sso-seed', '/global-logout'];

/**
 * Zerlegt einen Pfad in sprachreinen Pfad + erkannte Sprache.
 * @param path Pfad, z. B. `/en/news` oder `/news`.
 * @returns `{ clean, lang }` — `clean` ohne Prefix (`/news`), `lang` nur bei explizitem Prefix.
 */
export const stripLangPrefix = (path: string): { clean: string; lang: SiteLanguage | null } => {
  if (path === '/en' || path.startsWith('/en/')) {
    const clean = path.slice(3) || '/';
    return { clean, lang: 'en' };
  }
  if (path === '/de' || path.startsWith('/de/')) {
    const clean = path.slice(3) || '/';
    return { clean, lang: 'de' };
  }
  return { clean: path, lang: null };
};

/**
 * Lokalisiert einen internen Pfad (`/news` → `/en/news` bei EN).
 * Transiente Routen und externe URLs bleiben unberührt.
 * @param path Interner Pfad (muss mit `/` beginnen).
 * @param lang Zielsprache; nur `'en'` präfixiert.
 */
export const localizePath = (path: string, lang?: string): string => {
  if (lang !== 'en') return path;
  if (!path.startsWith('/')) return path;
  const { clean } = stripLangPrefix(path);
  if (TRANSIENT_PATHS.some((t) => clean === t || clean.startsWith(t + '/'))) return clean;
  return clean === '/' ? '/en' : `/en${clean}`;
};

// Helper: Bestimmt die Kategorie anhand des Pfades (sprachrein, `/en`-Prefix wird ignoriert)
export const getTargetCategory = (path: string): SiteCategory => {
  const clean = stripLangPrefix(path).clean;
  // Behandelt auch /comix als Alias für comics
  if (clean.startsWith('/comics') || clean === '/comics' || clean.startsWith('/comix') || clean === '/comix') return 'comics';
  if (clean.startsWith('/boox') || clean === '/boox') return 'boox';
  if (clean.startsWith('/gamez') || clean === '/gamez') return 'gamez';
  if (clean.startsWith('/moviez') || clean === '/moviez') return 'moviez';
  if (clean.startsWith('/seriez') || clean === '/seriez') return 'seriez';
  
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

/**
 * Generiert die korrekte URL für einen Pfad (intern vs. Domain-Wechsel).
 * Interne Ziele werden bei EN lokalisiert (`/en/`-Prefix), externe bekommen
 * `?lang=`-Handover. Localhost bleibt immer intern (Pfad-Simulation).
 * @param path Interner Pfad (z. B. `/news`, `/comix`) oder `/`.
 * @param currentLang Aktuelle Sprache (nur `'en'` verändert interne URLs).
 * @returns `{ url, isExternal }` — extern = voll-qualifizierte Fremd-Domain.
 */
export const getLinkUrl = (path: string, currentLang?: string): { url: string; isExternal: boolean } => {
  const currentCategory = getCurrentCategory();
  const targetCategory = getTargetCategory(path);
  const isLocal = isLocalhost();

  // Für Production nutzen wir immer https, für Localhost dynamisch
  const protocol = isLocal && typeof window !== 'undefined' ? window.location.protocol + '//' : 'https://';

  // Ohne Initialisierer: jeder Pfad unten weist vor dem Return zu
  // (`no-useless-assignment`), TS verifiziert die Zuweisung (Build).
  let resultUrl: string;
  let isExternal: boolean;

  // 1. Fall: Wir sind auf einer Sub-Domain und wollen zur Hauptseite (Home)
  if (stripLangPrefix(path).clean === '/' && currentCategory !== 'main') {
     if (isLocal) {
         resultUrl = localizePath('/', currentLang); // Im Dev-Mode bleiben wir oft auf derselben Instanz
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
        resultUrl = localizePath('/', currentLang);
    } else {
        resultUrl = localizePath(stripLangPrefix(path).clean, currentLang);
    }
    isExternal = false;
  }
  // 3. Fall: Domain-Wechsel notwendig (z.B. von Main nach Comics)
  else {
      // Localhost: Pfad-Simulation — alle Kategorie-Links bleiben interne SPA-Routen
      // (App.tsx rendert dort die Sections direkt statt auf Live-Domains zu springen).
      // Relative Pfade sind automatisch port-sicher (gleiche Origin inkl. :4174).
      if (isLocal) {
          resultUrl = localizePath(path, currentLang);
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