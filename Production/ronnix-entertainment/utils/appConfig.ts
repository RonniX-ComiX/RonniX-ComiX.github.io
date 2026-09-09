/**
 * appConfig.ts — App-weite Konstanten (AGENTS.md §4, Single Source).
 *
 * Feature: bündelt Admin-Kennung, Kontakt-Endpunkt und Cache-Politik an einem
 * Ort statt verstreuter Magic Values. `ADMIN_UID` spiegelt `firestore.rules`
 * (bei Rotation BEIDE pflegen). Benutzung: `AuthContext` (Admin-Check),
 * `ContactSection` (FormSubmit-Endpunkt), `useCachedPosts` (SWR-Fenster +
 * versionierte Keys). Gehört NICHT hierher: Domain-Mapping (`domainConfig.ts`), SSO-Timeouts
 * (`ssoConfig.ts`), Secrets/Keys (Env, nie hartcodiert).
 */

/** Admin-UID (Firestore-Admin). Duplikat zu `firestore.rules` — Rotation nur paarweise. */
export const ADMIN_UID = 'nRMiuZsj4GZQ0siYXFOqXVCc7mB2';

/** Kontaktadresse (auch `supportEmail` in `firebase.json`, Google-OAuth-Marke). */
export const CONTACT_EMAIL = 'ronnixcomix@gmail.com';

/** FormSubmit-Endpunkt des Kontaktformulars (Drittversand, Honeypot aktiv). */
export const CONTACT_FORM_ENDPOINT = `https://formsubmit.co/${CONTACT_EMAIL}`;

/** SWR-Fenster für Post-Listen (Memory + localStorage), in Millisekunden. */
export const CACHE_DURATION_MS = 5 * 60 * 1000;

/** Prefix für persistierte Cache-Einträge in localStorage. */
export const CACHE_KEY_PREFIX = 'ronnix_cache_';

/**
 * Build-ID des laufenden Builds (`__BUILD_ID__` aus `vite.config.ts`,
 * Format `YYYYMMDDHHmmss` UTC). Jeder `npm run build` prägt eine neue ID ein —
 * volatile Caches tragen sie im Key und verfallen damit pro Release automatisch.
 * Fallback `'dev'` greift nur, falls das Define fehlt (z. B. ungebaute Tools).
 */
export const BUILD_ID: string =
  typeof __BUILD_ID__ !== 'undefined' && __BUILD_ID__ ? __BUILD_ID__ : 'dev';

/** Namespace-Anhang für volatile Cache-Keys (`v<BUILD_ID>`). */
export const CACHE_NAMESPACE = `v${BUILD_ID}`;

/**
 * Baut einen Release-scharfen Cache-Key (`ronnix_cache_v<BUILD_ID>_<key>`).
 * Nach jedem Deploy passt kein alter Key mehr → keine veralteten Inhalte nach
 * Domain-Wechsel oder Refresh. Gilt NUR für volatile Caches (Post-Listen);
 * User-Daten (`ronnix_draft_*`), Präferenzen (`ronnix-lang`) und SSO-Hints
 * bleiben bewusst unversioniert und überleben Releases.
 * @param key Fachlicher Schlüssel ohne Prefix/Namespace, z. B. `latest_public_5`.
 */
export function versionedCacheKey(key: string): string {
  return `${CACHE_KEY_PREFIX}${CACHE_NAMESPACE}_${key}`;
}

/**
 * Versioniert eine gleich-Origin-Asset-URL (`/images/logo.png` →
 * `/images/logo.png?v=<BUILD_ID>`), damit Browser-Caches (Bilder/Fonts bis
 * 30d) nach jedem Release die neuen Brand-Assets holen. Absolute URLs
 * (Storage-Cover, externe), leere Werte und nicht-Pfad-Strings bleiben
 * unberührt. NUR zur Render-Zeit nutzen — nie in die DB persistieren
 * (`CreatePost` speichert bewusst den plain `COVER_FALLBACK`).
 * @param url Asset-Pfad wie `/images/ronnix_logo.png` oder volle URL.
 */
export function versionedAssetUrl(url: string): string {
  if (!url || !url.startsWith('/')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${BUILD_ID}`;
}

/** Erlaubte Post-Kategorien (Firestore `category`, Routen, Selects). Single Source. */
export const POST_CATEGORIES = ['news', 'comics', 'books', 'games', 'movies', 'series'] as const;

/** Kategorie-Typ aus `POST_CATEGORIES`. */
export type PostCategory = (typeof POST_CATEGORIES)[number];

/** Erlaubte Post-Themes (Multi-Select, max `MAX_THEMES_PER_POST`). Single Source. */
export const POST_THEMES = ['review', 'news', 'opinion', 'tutorial', 'spotlight'] as const;

/** Theme-Typ aus `POST_THEMES`. */
export type PostTheme = (typeof POST_THEMES)[number];

/** Max. Themes pro Post (UI-Limit + Validierung). */
export const MAX_THEMES_PER_POST = 3;

/** Lokales Cover-Fallback (statt externem placehold.co-Hotlink; nutzt vorhandenes OG-Image). */
export const COVER_FALLBACK = '/images/preview.png';

/** Draft-Autosave: localStorage-Key-Prefix + Intervall. */
export const DRAFT_KEY_PREFIX = 'ronnix_draft_';

/** Kommentar-Seitengröße (Default, Remote Config `comments_page_size` gewinnt). */
export const COMMENTS_PAGE_SIZE = 20;
