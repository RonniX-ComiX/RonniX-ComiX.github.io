/**
 * PostItemListSchema.tsx — ItemList-JSON-LD für Post-Listen (Kategorien, Latest).
 *
 * Feature: mappt veröffentlichte Posts einer Liste auf `ItemList`
 * (`position`, `name`, absolute URL inkl. `/en/`-Lokalisierung).
 * Scheduled/Zukunfts-Posts werden ausgeschlossen (kein Leak ungeplanter Titel
 * an Crawler). Rendert nichts im Prerender/bei leerer Liste.
 * Use Cases: alle 6 Kategorie-Sections + `LatestPosts`. Benutzung:
 * `<PostItemListSchema posts={posts} name={titel} />`.
 * Gehört NICHT hierher: Meta-Tags (`components/SEO.tsx`), Karten-UI (Sections).
 */

import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { StructuredData } from './StructuredData';
import { useLanguage } from '../context/LanguageContext';
import { localizePath } from '../utils/domainConfig';

interface PostItemListSchemaProps {
  posts: Array<{
    id: string;
    title: string;
    titleEn?: string;
    publishedAt?: { seconds: number };
  }>;
  name: string;
}

export const PostItemListSchema: React.FC<PostItemListSchemaProps> = ({ posts, name }) => {
  const { language } = useLanguage();

  if (typeof window === 'undefined' || posts.length === 0) return null;
  const now = Timestamp.now().seconds;
  const items = posts
    .filter((post) => (post.publishedAt?.seconds ?? 0) <= now)
    .map((post) => ({
      name: (language === 'en' && post.titleEn ? post.titleEn : post.title) || 'Post',
      url: `${window.location.origin}${localizePath(`/post/${post.id}`, language)}`,
    }));
  if (items.length === 0) return null;

  return <StructuredData type="ItemList" data={{ name, items }} />;
};
