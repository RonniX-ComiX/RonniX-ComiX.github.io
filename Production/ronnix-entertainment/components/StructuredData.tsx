import React from 'react';
import { Helmet } from 'react-helmet-async';

type SchemaType = 'WebSite' | 'Article' | 'Review' | 'Game' | 'Book';

interface StructuredDataProps {
  type: SchemaType;
  data: any;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ type, data }) => {
  let schema: any = {
    '@context': 'https://schema.org',
    '@type': type,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': window.location.href
    }
  };

  if (type === 'WebSite') {
    schema = {
      ...schema,
      name: 'RonniX Entertainment',
      url: 'https://ronnixentertainment.de',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://ronnixentertainment.de/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    };
  } else if (type === 'Review') {
    schema = {
      ...schema,
      itemReviewed: {
        '@type': data.itemType || 'CreativeWork',
        name: data.itemName,
        author: {
          '@type': 'Person',
          name: data.itemAuthor || 'Unknown'
        },
        image: data.image
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5', // Standard-Annahme, da wir noch kein numerisches Rating-System haben
        bestRating: '5',
        worstRating: '1'
      },
      author: {
        '@type': 'Person',
        name: data.authorName || 'RonniX'
      },
      publisher: {
        '@type': 'Organization',
        name: 'RonniX Entertainment',
        logo: {
            '@type': 'ImageObject',
            url: 'https://ronnixentertainment.de/images/ronnix_logo.png'
        }
      },
      datePublished: data.datePublished,
      description: data.description,
      headline: data.headline
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
        name: data.authorName || 'RonniX'
      },
      publisher: {
        '@type': 'Organization',
        name: 'RonniX Entertainment',
        logo: {
          '@type': 'ImageObject',
          url: 'https://ronnixentertainment.de/images/ronnix_logo.png'
        }
      },
      description: data.description
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
