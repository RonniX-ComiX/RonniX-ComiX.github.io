/**
 * utils/postExcerpt.ts — Excerpt, Lesedauer, Theme-Labels für Posts (Single Source).
 *
 * Feature: `htmlToText` (SSG-sicher ohne `document`), `getExcerpt` (Wortgrenze,
 * Default 150 Zeichen), `getReadingMinutes` (200 WpM, min 1), `getThemeLabels`
 * (Alt-`theme` + neu `themes[]`, lokalisiert via Locale-Dict), `getDisplayTitle/
 * getDisplayContent` (DE/EN-Fallback). Benutzung: Sections, LatestPosts, Search,
 * PostDetail (SEO-Description). Gehört NICHT hierher: Sanitizing
 * (`richTextSanitize.ts`), Typen (`postTypes.ts`).
 */

import { migrateThemes } from './postTypes';

/**
 * Wandelt HTML zu Plain-Text (ohne DOM — SSG/prerender-sicher).
 * @param html Roh-HTML oder Falsy.
 * @returns Text ohne Tags, Entities grob dekodiert, Whitespace normalisiert.
 */
export const htmlToText = (html?: string | null): string => {
  if (!html || typeof html !== 'string') return '';
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  text = text.replace(/<(br|p|div|h1|h2|h3|li)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ');
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text;
};

/**
 * Erzeugt einen Excerpt mit Wortgrenze + Ellipse.
 * @param html Roh-HTML des Posts.
 * @param maxChars Max. Zeichen (Default 150).
 * @returns Excerpt oder `''`.
 */
export const getExcerpt = (html?: string | null, maxChars = 150): string => {
  const text = htmlToText(html);
  if (!text) return '';
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = lastSpace > maxChars * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.trim()}…`;
};

/**
 * Schätzt die Lesedauer (200 Wörter/Minute, min 1).
 * @param html Roh-HTML des Posts.
 * @returns Minuten (ganze Zahl, min 1 bei Inhalt).
 */
export const getReadingMinutes = (html?: string | null): number => {
  const text = htmlToText(html);
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

/**
 * Wählt den Anzeige-Titel (EN-Fallback auf DE).
 * @param post Post-Doc (mit `title`/`titleEn`).
 * @param language Aktuelle Sprache (`'de'`|`'en'`).
 * @returns Titelstring oder `''`.
 */
export const getDisplayTitle = (post: any, language?: string): string => {
  if (!post) return '';
  if (language === 'en' && post.titleEn?.trim()) return post.titleEn;
  return post.title || '';
};

/**
 * Wählt den Anzeige-Content (EN-Fallback auf DE).
 * @param post Post-Doc (mit `content`/`contentEn`).
 * @param language Aktuelle Sprache.
 * @returns HTML-String oder `''`.
 */
export const getDisplayContent = (post: any, language?: string): string => {
  if (!post) return '';
  if (language === 'en' && post.contentEn?.trim()) return post.contentEn;
  return post.content || '';
};

/**
 * Löst Theme-Keys zu lokalisierten Labels (neu `themes[]` + alt `theme`).
 * @param post Post-Doc.
 * @param themesDict Locale-Dict (`t.home.admin.themes`).
 * @returns Label-Array (Fallback `['Review']`).
 */
export const getThemeLabels = (post: any, themesDict?: Record<string, string>): string[] => {
  const keys = migrateThemes(post);
  return keys.map((k) => themesDict?.[k] || k || 'Review');
};
