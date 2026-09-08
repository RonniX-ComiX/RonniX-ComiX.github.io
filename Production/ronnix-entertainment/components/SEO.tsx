import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getCurrentCategory } from '../utils/domainConfig';
import { useLanguage } from '../context/LanguageContext';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  canonicalPath?: string;
  noIndex?: boolean;
}

const SITE_NAMES: Record<string, string> = {
  main: 'RonniX Entertainment',
  comics: 'RonniX ComiX',
  boox: 'RonniX BooX',
  gamez: 'Lamaz GameZ',
  moviez: 'RonniX MovieZ',
  seriez: 'RonniX SerieZ',
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  type = 'website',
  canonicalPath,
  noIndex = false
}) => {
  const currentCategory = getCurrentCategory();
  let language: string = 'de';
  try {
    // useLanguage nur wenn Provider vorhanden (SSG/prerender-safe)
    language = useLanguage().language;
  } catch {}

  const siteName = SITE_NAMES[currentCategory] || SITE_NAMES.main;
  const defaultImage = 'https://ronnixentertainment.de/images/preview.jpg';

  const metaDescription = description || "RonniX Entertainment – Comics, Bücher, Games, Filme & Serien: Reviews, News und Community.";
  const metaImage = image || defaultImage;
  const fullTitle = `${title} | ${siteName}`;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ronnixentertainment.de';
  const href = typeof window !== 'undefined' ? window.location.href.split('?')[0] : origin;
  const canonicalUrl = canonicalPath ? `${origin}${canonicalPath}` : href;
  const locale = language === 'de' ? 'de_DE' : 'en_US';
  const htmlLang = language;

  React.useEffect(() => {
    document.documentElement.lang = htmlLang;
  }, [htmlLang]);

  return (
    <Helmet>
      <html lang={htmlLang} />
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />
      {/* hreflang: 6-Domain-Split + Sprache (Google erkennt Varianten, kein Duplicate-Penalty) */}
      <link rel="alternate" hrefLang="de" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={`${canonicalUrl}${canonicalUrl.includes('?') ? '&' : '?'}lang=en`} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:site" content="@RonniXComiX" />
    </Helmet>
  );
};
