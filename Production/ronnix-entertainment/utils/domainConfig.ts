
// Diese Konfiguration definiert, welche Domain für welche Inhalte zuständig ist.

export type SiteCategory = 'main' | 'comics' | 'boox' | 'gamez' | 'moviez' | 'seriez';

// Mapping der Kategorien zu den echten Domains
const DOMAIN_MAP: Record<SiteCategory, string> = {
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

// Erkennt anhand des Hostnames, auf welcher "Seite" wir uns befinden
export const getCurrentCategory = (): SiteCategory => {
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
  const isLocalhost = window.location.hostname.includes('localhost');
  
  // Für Production nutzen wir immer https, für Localhost dynamisch
  const protocol = isLocalhost ? window.location.protocol + '//' : 'https://';

  let resultUrl = '';
  let isExternal = false;

  // 1. Fall: Wir sind auf einer Sub-Domain und wollen zur Hauptseite (Home)
  if (path === '/' && currentCategory !== 'main') {
     if (isLocalhost) {
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
      // Wenn wir auf Localhost sind, simulieren wir das Routing meist nicht cross-domain, 
      // es sei denn, wir wollen die Redirects explizit testen. 
      // Hier nehmen wir an: Localhost bleibt SPA, Live geht auf Domain.
      if (isLocalhost) {
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