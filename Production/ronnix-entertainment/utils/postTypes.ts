/**
 * utils/postTypes.ts — Kanonische Post-Typen: Credits, Herkunft, Themes (Single Source).
 *
 * Feature: definiert `PostCredits` (Executive Editor / Cover-Künstler / Autor /
 * Zeichner / Tusche / Kolorist / Letterer / Redakteur), `PostOrigin`
 * (Erscheinungsjahr DE + Original + Ursprungsland, Verlag DE + Original),
 * `PostThemes` (Multi-Themes, max `MAX_THEMES_PER_POST`) sowie Migration-Helper
 * von Alt-Feldern (`itemAuthor`, `publisher`, `releaseYear`, `theme`) auf das
 * neue Modell. Benutzung: `CreatePost` (Speichern), `PostMetaFields` (Formular),
 * `PostDetail` (Anzeige), `Search`/Sections (Filter). Gehört NICHT hierher:
 * Konstanten/Lists (`appConfig.ts`), Sanitizing (`richTextSanitize.ts`),
 * Excerpts (`postExcerpt.ts`).
 */

/** Comic-Credits — alle optional, leere Werte werden nie angezeigt. */
export interface PostCredits {
  executiveEditor?: string;
  coverArtists?: string[];
  author?: string;
  artist?: string;
  inker?: string;
  colorist?: string;
  letterer?: string;
  editor?: string;
}

/** Herkunft eines besprochenen Werks (DE vs. Original). */
export interface PostOrigin {
  releaseYearDe?: string;
  releaseYearOriginal?: string;
  originCountry?: string;
  publisherDe?: string;
  publisherOriginal?: string;
}

/** Erlaubte Theme-Keys (Spiegel zu `POST_THEMES` in `appConfig.ts`). */
export type PostThemeKey = 'review' | 'news' | 'opinion' | 'tutorial' | 'spotlight';

/** Vollständige neue Metadaten eines Posts (flach in Firestore gespeichert). */
export interface PostMeta {
  credits: PostCredits;
  origin: PostOrigin;
  themes: PostThemeKey[];
}

/**
 * Parst eine Komma-Liste (Cover-Künstler) zu Array (trimmt, filtert leer).
 * @param raw Rohstring, z. B. `"A, B, C"`.
 * @returns Bereinigtes Array (max 10 Einträge).
 */
export const parseCoverArtists = (raw: string): string[] => {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
};

/**
 * Serialisiert Cover-Künstler-Array zu Komma-String (Formular-Wert).
 * @param arr Array oder Falsy.
 * @returns Komma-String oder `''`.
 */
export const serializeCoverArtists = (arr?: string[]): string => {
  if (!Array.isArray(arr)) return '';
  return arr.filter(Boolean).join(', ');
};

/**
 * Migriert Alt-Feld `theme: string` auf `themes: string[]`.
 * @param data Firestore-Doc-Daten (any).
 * @returns Array mit mind. 1 Eintrag (`['review']` als Fallback).
 */
export const migrateThemes = (data: any): PostThemeKey[] => {
  if (Array.isArray(data?.themes) && data.themes.length > 0) {
    return data.themes.filter(Boolean).slice(0, 3) as PostThemeKey[];
  }
  if (typeof data?.theme === 'string' && data.theme.trim()) {
    return [data.theme.trim() as PostThemeKey];
  }
  return ['review'];
};

/**
 * Migriert Alt-Felder (`itemAuthor`, `publisher`, `releaseYear`) auf neues Modell.
 * Neue Felder gewinnen, alte dienen als Fallback.
 * @param data Firestore-Doc-Daten (any).
 * @returns `{ credits, origin }` mit migrierten Werten.
 */
export const migrateCreditsOrigin = (data: any): { credits: PostCredits; origin: PostOrigin } => {
  const credits: PostCredits = {
    executiveEditor: data?.executiveEditor || '',
    coverArtists: Array.isArray(data?.coverArtists) ? data.coverArtists : parseCoverArtists(data?.coverArtists || ''),
    author: data?.author || data?.itemAuthor || '',
    artist: data?.artist || '',
    inker: data?.inker || '',
    colorist: data?.colorist || '',
    letterer: data?.letterer || '',
    editor: data?.editor || '',
  };
  const origin: PostOrigin = {
    releaseYearDe: data?.releaseYearDe || data?.releaseYear || '',
    releaseYearOriginal: data?.releaseYearOriginal || '',
    originCountry: data?.originCountry || '',
    publisherDe: data?.publisherDe || data?.publisher || '',
    publisherOriginal: data?.publisherOriginal || '',
  };
  return { credits, origin };
};

/**
 * Prüft, ob überhaupt Credits vorhanden sind (für bedingtes Rendern).
 * @param credits Credits-Objekt oder Falsy.
 * @returns `true`, wenn mind. ein Feld nicht-leer ist.
 */
export const hasCredits = (credits?: PostCredits | null): boolean => {
  if (!credits) return false;
  if (credits.executiveEditor?.trim()) return true;
  if (credits.author?.trim()) return true;
  if (credits.artist?.trim()) return true;
  if (credits.inker?.trim()) return true;
  if (credits.colorist?.trim()) return true;
  if (credits.letterer?.trim()) return true;
  if (credits.editor?.trim()) return true;
  if (Array.isArray(credits.coverArtists) && credits.coverArtists.some((c) => c?.trim())) return true;
  return false;
};

/**
 * Prüft, ob Herkunfts-Daten vorhanden sind (für bedingtes Rendern).
 * @param origin Origin-Objekt oder Falsy.
 * @returns `true`, wenn mind. ein Feld nicht-leer ist.
 */
export const hasOrigin = (origin?: PostOrigin | null): boolean => {
  if (!origin) return false;
  return Boolean(
    origin.releaseYearDe?.trim() ||
      origin.releaseYearOriginal?.trim() ||
      origin.originCountry?.trim() ||
      origin.publisherDe?.trim() ||
      origin.publisherOriginal?.trim(),
  );
};
