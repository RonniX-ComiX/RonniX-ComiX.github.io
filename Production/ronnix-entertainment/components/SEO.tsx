

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getCurrentCategory } from '../utils/domainConfig';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  canonicalPath?: string;
  noIndex?: boolean; // New prop to explicitly hide pages (like admin)
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  type = 'website',
  canonicalPath,
  noIndex = false
}) => {
  const currentCategory = getCurrentCategory();
  
  // Bestimme den Basis-Seitennamen basierend auf der aktuellen Domain/Kategorie
  let siteName = 'RonniX Entertainment';
  let defaultImage = 'https://ronnixentertainment.de/images/preview.jpg';
  
  switch (currentCategory) {
    case 'comics':
      siteName = 'RonniX Entertainment';
      break;
    case 'boox':
      siteName = 'RonniX BooX';
      break;
    case 'gamez':
      siteName = 'Lamaz GameZ';
      break;
    case 'moviez':
      siteName = 'RonniX MovieZ';
      break;
    case 'seriez':
      siteName = 'RonniX SerieZ';
      break;
  }

  const metaDescription = description || "Your ultimate entertainment hub for hand-drawn comics, exciting books, indie games, and movie reviews. Join the RonniX universe!";
  const metaImage = image || defaultImage;
  const fullTitle = `${title} | ${siteName}`;

  // Canonical URL konstruieren
  const baseUrl = window.location.origin;
  const canonicalUrl = canonicalPath 
    ? `${baseUrl}${canonicalPath}` 
    : window.location.href;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots: Wichtig für Google Indexierung */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      <meta name="googlebot" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="de_DE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
      <meta name="twitter:site" content="@RonniXComiX" />
    </Helmet>
  );
};
