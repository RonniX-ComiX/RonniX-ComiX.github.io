/**
 * SEO.tsx — Meta-/Link-Tags je Route: Title, Description, Canonical, hreflang, OG/Twitter.
 *
 * Feature: baut aus `title` + Domain (`getCurrentCategory`) den Seitentitel
 * (`Titel | Site-Name`), wählt Description/OG-Image sprach- und domainbewusst
 * (`HOME_SEO`, `OG_IMAGES` aus `utils/domainConfig.ts`) und setzt stabile
 * Canonicals: DE pfadrein (`/news`), EN mit Prefix (`/en/news`); `?lang=` und
 * sonstige Query-Params fallen aus dem Canonical. hreflang: `de` → DE-URL,
 * `en` → EN-URL, `x-default` → DE-URL (kein Cross-Domain-hreflang: die 6 Domains
 * sind Content-Vertikale, keine Sprachvarianten).
 * Use Cases: jede Route in `App.tsx` + `PostDetail` (Article-Typ). `noIndex`
 * für SSO/Auth/Admin/Coming-Soon, `bareTitle` für transiente Screens (nur
 * Site-Name als Tab-Titel). Gehört NICHT hierher: JSON-LD
 * (`components/StructuredData.tsx`), Sitemap/Robots (Functions + `firebase.json`).
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  getCurrentCategory,
  SITE_NAMES,
  OG_IMAGES,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  stripLangPrefix,
  type SiteLanguage,
} from '../utils/domainConfig';
import { useLanguageOptional } from '../context/LanguageContext';

interface SEOProps {
  title: string;
  /** Englischer Titel (fällt bei EN auf `title` zurück und umgekehrt). */
  titleEn?: string;
  description?: string;
  /** Englische Description (fällt bei EN auf `description` zurück und umgekehrt). */
  descriptionEn?: string;
  image?: string;
  /** Alt-Text für `og:image:alt` / `twitter:image:alt`. */
  imageAlt?: string;
  type?: 'website' | 'article';
  canonicalPath?: string;
  noIndex?: boolean;
  /** ISO-8601 für `article:published_time` (nur `type="article"`). */
  publishedTime?: string;
  /**
   * Markenreiner Tab-Titel ohne Präfix (nur Site-Name) für transiente Screens
   * (SSO-Weiterleitung, Logout). Verhindert sichtbare Zwischentitel wie "SSO | ..."
   * während der Weiterleitung.
   */
  bareTitle?: boolean;
}

const FALLBACK_DESCRIPTION_DE =
  'RonniX Entertainment – Comics, Bücher, Games, Filme & Serien: Reviews, News und Community.';
const FALLBACK_DESCRIPTION_EN =
  'RonniX Entertainment – comics, books, games, movies & series: reviews, news and community.';

/**
 * Baut die kanonische URL: Origin kleingeschrieben, Query/Hash raus,
 * Trailing Slash normalisiert, `/en/`-Prefix nur für EN.
 * @param origin z. B. `https://ronnixcomix.de`
 * @param pathname Aktueller Pfad (darf `/en`-Prefix tragen)
 * @param lang Zielsprache des Canonicals
 */
export const buildCanonicalUrl = (origin: string, pathname: string, lang: SiteLanguage): string => {
  const { clean } = stripLangPrefix(pathname);
  const normalized = clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
  const path = lang === 'en' ? (normalized === '/' ? '/en' : `/en${normalized}`) : normalized;
  return `${origin}${path}`;
};

/**
 * Aktuelle Origin, SSR-safe (Fallback: Main-Domain).
 */
const getOrigin = (): string => {
  if (typeof window !== 'undefined') {
    try {
      return new URL(window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  }
  return 'https://ronnixentertainment.de';
};

export const SEO: React.FC<SEOProps> = ({
  title,
  titleEn,
  description,
  descriptionEn,
  image,
  imageAlt,
  type = 'website',
  canonicalPath,
  noIndex = false,
  publishedTime,
  bareTitle = false
}) => {
  const currentCategory = getCurrentCategory();
  // Provider-optional (SSG/prerender-safe), unbedingt aufgerufen (Hooks-Reihenfolge).
  const { language } = useLanguageOptional();

  const siteName = SITE_NAMES[currentCategory] || SITE_NAMES.main;
  const defaultImage = `https://ronnixentertainment.de${OG_IMAGES[currentCategory] || OG_IMAGES.main}`;

  const metaDescription =
    (language === 'en' ? descriptionEn || description : description || descriptionEn) ||
    (language === 'en' ? FALLBACK_DESCRIPTION_EN : FALLBACK_DESCRIPTION_DE);
  const metaTitleBase = language === 'en' ? titleEn || title : title;
  const metaImage = image || defaultImage;
  const metaImageAlt = imageAlt || `${siteName} – Preview`;
  const fullTitle = bareTitle ? siteName : `${metaTitleBase} | ${siteName}`;

  const origin = getOrigin();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  // `canonicalPath` ist sprachneutral (`/news`) und wird je Sprache aufgelöst
  // (DE → `/news`, EN → `/en/news`); ohne Angabe gilt die aktuelle URL.
  const canonicalUrl = canonicalPath
    ? buildCanonicalUrl(origin, canonicalPath, language)
    : buildCanonicalUrl(origin, pathname, language);
  const deUrl = buildCanonicalUrl(origin, pathname, 'de');
  const enUrl = buildCanonicalUrl(origin, pathname, 'en');
  const locale = language === 'de' ? 'de_DE' : 'en_US';
  const htmlLang = language;

  React.useEffect(() => {
    document.documentElement.lang = htmlLang;
  }, [htmlLang]);

  const robotsContent = noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {/* hreflang: stabile Sprach-URLs (`/en/`-Prefix), kein Cross-Domain (Content-Vertikale) */}
      <link rel="alternate" hrefLang="de" href={deUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={deUrl} />

      <meta name="robots" content={robotsContent} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={metaImageAlt} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content={language === 'de' ? 'en_US' : 'de_DE'} />
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:image:alt" content={metaImageAlt} />
      <meta name="twitter:site" content="@RonniXComiX" />
    </Helmet>
  );
};
