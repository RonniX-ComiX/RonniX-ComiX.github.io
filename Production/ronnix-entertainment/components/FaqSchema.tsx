/**
 * FaqSchema.tsx — FAQPage-JSON-LD für KI-Suche (GEO +40% Zitierchance).
 *
 * Feature: rendert ein einziges `FAQPage`-Schema aus den lokalisierten
 * Kontakt-FAQs (`locales/home.ts`, `t.home.contact.faq`). Frage/Antwort-Paare
 * im Klartext sind die am leichtesten extrahierbare Struktur für Google AI
 * Overviews, ChatGPT und Perplexity. Benutzung: einmalig auf der
 * Kontaktseite (`App.tsx`, `ContactPage`) neben `<SEO />`. Gehört NICHT
 * hierher: Meta-Tags (`SEO.tsx`), sonstige Schema-Typen (`StructuredData.tsx`).
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../context/LanguageContext';

interface FaqEntry {
  q: string;
  a: string;
}

/**
 * FAQPage-Schema aus den Kontakt-FAQs der aktiven Sprache.
 * Rendert nichts Sichtbares (nur JSON-LD im `<head>`).
 */
export const FaqSchema: React.FC = () => {
  // Provider-optionaler Zugriff entfällt: Kontaktseite läuft immer im Provider.
  const { t } = useLanguage();
  const faq: FaqEntry[] = t.home.contact.faq || [];
  if (faq.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((entry) => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.a,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
