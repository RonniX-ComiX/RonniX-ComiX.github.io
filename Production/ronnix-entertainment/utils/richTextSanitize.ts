/**
 * utils/richTextSanitize.ts — Zentrale HTML-Sanitize-Regeln für Editor + Renderer.
 *
 * Feature: `sanitizeEditorInput` (Paste/Modals: strikt, ohne Scripts/Iframes außer
 * YouTube-nocookie), `sanitizeRender` (PostDetail: Anzeige-Allowlist mit Bildern,
 * Links, YouTube-Embeds), `isSafeUrl` (nur http/https, kein javascript:/data:),
 * `extractYouTubeId` (11-stellige IDs aus Watch/Shorts/Embed/youtu.be). Nutzt
 * DOMPurify im Browser, fällt in Node/SSG auf simple Tag-Strips zurück.
 * Benutzung: `RichTextEditor` (onPaste/Modals), `PostDetail` + `postExcerpt`
 * (Renderer). Gehört NICHT hierher: Excerpt-/Reading-Time (`postExcerpt.ts`),
 * Typen (`postTypes.ts`).
 */

const ALLOWED_RENDER_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h2', 'h3', 'blockquote', 'ul', 'ol', 'li',
  'a', 'img', 'div', 'iframe', 'span',
];

const ALLOWED_EDITOR_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h2', 'h3', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'span',
];

/**
 * Prüft, ob eine URL zum Einbetten/Verlinken sicher ist.
 * @param url Zu prüfende URL (beliebiger Typ).
 * @returns `true` nur für `http(s)://`-URLs ohne `javascript:`/`data:`.
 */
export const isSafeUrl = (url: unknown): boolean => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  if (/^\s*javascript:/i.test(trimmed)) return false;
  if (/^\s*data:/i.test(trimmed)) return false;
  return true;
};

/**
 * Extrahiert die 11-stellige YouTube-ID aus Watch/Shorts/Embed/youtu.be-URLs.
 * @param url YouTube-URL oder Falsy.
 * @returns Video-ID oder `null`.
 */
export const extractYouTubeId = (url?: string | null): string | null => {
  if (!url || typeof url !== 'string') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2] && match[2].length === 11 ? match[2] : null;
  return videoId;
};

/**
 * Baut ein sicheres YouTube-nocookie-Embed (responsiver Wrapper).
 * @param videoId 11-stellige YouTube-ID.
 * @returns Embed-HTML (bereits sanitized) oder `''`.
 */
export const buildYouTubeEmbed = (videoId: string): string => {
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return '';
  return (
    `<div class="aspect-video w-full my-6 rounded-xl overflow-hidden border border-neutral-800 shadow-lg">` +
    `<iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/${videoId}" ` +
    `frameborder="0" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ` +
    `allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><p><br></p>`
  );
};

/**
 * Escapt HTML-Sonderzeichen (für Alt-Texte, Titel, User-Input in Attributen).
 * @param raw Rohstring.
 * @returns Escapter String.
 */
export const escapeHtml = (raw: string): string => {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const fallbackStrip = (html: string, allowed: string[]): string => {
  if (!html || typeof html !== 'string') return '';
  // Entfernt Scripts/Styles komplett, lässt nur Allowlist-Tags stehen (Attribute grob gestrippt außer href/src/alt).
  let out = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (m, close: string, tag: string, attrs: string) => {
    const lower = String(tag).toLowerCase();
    if (!allowed.includes(lower)) return '';
    if (close) return `</${lower}>`;
    if (lower === 'a') {
      const href = /href\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] || '';
      if (!isSafeUrl(href)) return `<a>`;
      return `<a href="${escapeHtml(href)}" rel="noopener noreferrer">`;
    }
    if (lower === 'img') {
      const src = /src\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] || '';
      const alt = /alt\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1] || '';
      if (!isSafeUrl(src)) return '';
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`;
    }
    if (lower === 'iframe') return '';
    return `<${lower}>`;
  });
  return out;
};

const domPurifySanitize = async (html: string, forRender: boolean): Promise<string> => {
  try {
    const mod: any = await import('dompurify');
    const DOMPurify = mod?.default ?? mod;
    if (typeof window === 'undefined' || !DOMPurify?.sanitize) {
      return fallbackStrip(html, forRender ? ALLOWED_RENDER_TAGS : ALLOWED_EDITOR_TAGS);
    }
    return DOMPurify.sanitize(html || '', {
      ALLOWED_TAGS: forRender ? ALLOWED_RENDER_TAGS : ALLOWED_EDITOR_TAGS,
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'loading', 'decoding', 'class', 'style', 'allow', 'allowfullscreen', 'frameborder', 'width', 'height', 'referrerpolicy'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    });
  } catch {
    return fallbackStrip(html, forRender ? ALLOWED_RENDER_TAGS : ALLOWED_EDITOR_TAGS);
  }
};

/**
 * Sanitisiert Editor-Input (Paste/Modals) — strikt, ohne iframes.
 * @param html Roh-HTML aus contentEditable/Paste.
 * @returns Promise auf bereinigtes HTML.
 */
export const sanitizeEditorInput = (html: string): Promise<string> => domPurifySanitize(html, false);

/**
 * Sanitisiert Render-HTML für `dangerouslySetInnerHTML` (PostDetail).
 * Erlaubt Bilder + YouTube-nocookie-Iframes, sonst strikt.
 * @param html Gespeichertes Post-HTML.
 * @returns Promise auf bereinigtes HTML.
 */
export const sanitizeRender = (html: string): Promise<string> => domPurifySanitize(html, true);

/**
 * Synchrone Variante für Listen/Excerpts (ohne DOMPurify, reiner Strip).
 * @param html Roh-HTML.
 * @returns Text-nahes, tag-gestripptes HTML (nur Allowlist-Tags).
 */
export const sanitizeSync = (html: string): string => fallbackStrip(html, ALLOWED_RENDER_TAGS);
