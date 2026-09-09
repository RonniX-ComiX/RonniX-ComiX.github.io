/**
 * sections/NewsSection.tsx — News-Ansicht (News-Karten + ItemList).
 *
 * Feature: lädt News-Posts (`useCachedPosts('news')` — Kategorie auf Main),
 * rendert Karten (lokalisiert, Scheduled-Badge für Admins) und
 * `PostItemListSchema` für Crawler. Benutzung: `/news` (+ `/en/news`) auf
 * allen Domains (`App.tsx`). Gehört NICHT hierher: andere Kategorien.
 */

import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '../icons/Icon';
import { useCachedPosts } from '../../hooks/useCachedPosts';
import { localizePath } from '../../utils/domainConfig';
import { PostItemListSchema } from '../PostItemListSchema';
import { ScrollReveal } from '../ScrollReveal';
import { SectorCard } from '../SectorCard';
import { AdminCreateButton } from '../post/AdminCreateButton';
import { getExcerpt } from '../../utils/postExcerpt';

export const NewsSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { posts, loading } = useCachedPosts('news');

  /** Firestore-Timestamp → `TT.MM.JJ` (aktuelle Sprache), `''` bei Falsy. */
  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(date);
  };

  const getCardExcerpt = (html: string) => getExcerpt(html, 100);

  return (
    <section className="min-h-[50vh]">
      <SectionTitle title={t.home.news.title} />
      <AdminCreateButton category="news" />
      <PostItemListSchema posts={posts} name={t.home.news.title} />
      
      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {posts.map((post, i) => {
            const isScheduled = post.publishedAt?.seconds > Timestamp.now().seconds;
            const displayTitle = (language === 'en' && post.titleEn) ? post.titleEn : post.title;
            const displayContent = (language === 'en' && post.contentEn) ? post.contentEn : post.content;

            return (
                <SectorCard to={localizePath(`/post/${post.id}`, language)} key={post.id} accent="pink" tilt={i % 2 === 0 ? -1 : 1} dimmed={isScheduled}>
                <div className="bg-neutral-900 rounded-lg overflow-hidden">

                    {/* Image Area */}
                    <div className="h-48 overflow-hidden relative">
                         <img
                            src={post.coverUrl}
                            alt={displayTitle}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs font-bold uppercase px-2 py-1 rounded border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                            News
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3 font-mono">
                             <span className="flex items-center gap-1">
                                <Icon name="calendar" size={12} className="text-pink-500" /> {formatDate(post.publishedAt)}
                             </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-pink-400 transition-colors">
                            {displayTitle}
                        </h3>

                        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                            {getCardExcerpt(displayContent)}
                        </p>
                        
                        <div className="flex items-center justify-end text-pink-500 text-sm font-bold uppercase tracking-wider group-hover:underline">
                            Read More →
                        </div>
                    </div>
                </div>
                </SectorCard>
            );
          })}
        </div>
        </ScrollReveal>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-neutral-800 rounded-xl bg-neutral-900/30">
          <div className="text-6xl mb-6 text-pink-500">
             <Icon name="newspaper" size={64} />
          </div>
          <h3 className="text-2xl font-retro text-gray-400 mb-2">{t.home.news.emptyTitle}</h3>
          <p className="text-gray-500">{t.home.news.emptyDesc}</p>
        </div>
      )}
    </section>
  );
};
