/**
 * StructuredData.tsx — JSON-LD Schema pro Seite (Rich Results, GEO).
 *
 * Feature: rendert je `type` valides Schema.org-JSON-LD. `WebSite` trägt
 * Name/URL der aktuellen Domain plus gültige `SearchAction`
 * (`/search?q=`, siehe `pages/Search.tsx`). `Review` kommt OHNE `reviewRating`
 * (kein numerisches Rating-System → kein Self-Serving-Rating). `Article`
 * wird als `BlogPosting` mit Publisher-Logo (inkl. Maße) ausgeliefert.
 * `BreadcrumbList` + `ItemList` bekommen absolute URLs. Alles SSR-safe
 * (`typeof window`-Guards). Benutzung: `<StructuredData type data />`
 * neben `<SEO />`. Gehört NICHT hierher: Meta-Tags (`components/SEO.tsx`).
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getCurrentCategory, DOMAIN_MAP, SITE_NAMES } from '../utils/domainConfig';

type SchemaType = 'WebSite' | 'Article' | 'Review' | 'BreadcrumbList' | 'Organization' | 'ItemList';

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface StructuredDataProps {
  type: SchemaType;
  data: any;
}

/** Absolute Seiten-URL ohne Query, SSR-safe (`undefined` im Prerender). */
const getPageUrl = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.location.href.split('?')[0];
  } catch {
    return undefined;
  }
};

/** Publisher-Organisation (einzige Quelle für Logo inkl. Maße). */
const buildPublisher = (siteUrl: string) => ({
  '@type': 'Organization',
  name: 'RonniX Entertainment',
  url: 'https://ronnixentertainment.de',
  logo: {
    '@type': 'ImageObject',
    url: `${siteUrl}/images/ronnix_logo.png`,
    width: 891,
    height: 838,
  },
});

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  const category = getCurrentCategory();
  const siteUrl = `https://${DOMAIN_MAP[category] || DOMAIN_MAP.main}`;
  const siteName = SITE_NAMES[category] || SITE_NAMES.main;
  const pageUrl = getPageUrl();

  let schema: any = {
    '@context': 'https://schema.org',
    '@type': type,
  };
  if (pageUrl) {
    schema.mainEntityOfPage = {
      '@type': 'WebPage',
      '@id': pageUrl,
    };
  }

  if (type === 'WebSite') {
    schema = {
      ...schema,
      name: siteName,
      url: siteUrl,
      publisher: buildPublisher(siteUrl),
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  } else if (type === 'Organization') {
    schema = {
      ...schema,
      ...buildPublisher(siteUrl),
      '@type': 'Organization',
      sameAs: [
        'https://www.instagram.com/ronnixcomix',
        'https://www.facebook.com/p/RonniX-ComiX-100068056538624/',
      ],
    };
  } else if (type === 'Review') {
    // Bewusst OHNE reviewRating: kein verifiziertes Rating-System vorhanden
    // (Self-Serving-Review mit hartem 5er-Wert verstößt gegen Rich-Result-Policies).
    schema = {
      ...schema,
      itemReviewed: {
        '@type': data.itemType || 'CreativeWork',
        name: data.itemName,
        author: {
          '@type': 'Person',
          name: data.itemAuthor || 'Unknown',
        },
        image: data.image,
      },
      author: {
        '@type': 'Person',
        name: data.authorName || 'RonniX',
      },
      publisher: buildPublisher(siteUrl),
      datePublished: data.datePublished,
      dateModified: data.dateModified || data.datePublished,
      description: data.description,
      headline: data.headline,
    };
  } else if (type === 'Article') {
    schema = {
      ...schema,
      '@type': 'BlogPosting',
      headline: data.headline,
      image: [data.image],
      datePublished: data.datePublished,
      dateModified: data.dateModified || data.datePublished,
      author: {
        '@type': 'Person',
        name: data.authorName || 'RonniX',
      },
      publisher: buildPublisher(siteUrl),
      description: data.description,
    };
  } else if (type === 'BreadcrumbList') {
    const items: BreadcrumbItem[] = data.items || [];
    schema = {
      ...schema,
      itemListElement: items.map((item, index) => {
        const element: any = {
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
        };
        if (item.url) element.item = item.url;
        return element;
      }),
    };
  } else if (type === 'ItemList') {
    const items: BreadcrumbItem[] = data.items || [];
    schema = {
      ...schema,
      name: data.name || siteName,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(item.url ? { url: item.url } : {}),
      })),
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
