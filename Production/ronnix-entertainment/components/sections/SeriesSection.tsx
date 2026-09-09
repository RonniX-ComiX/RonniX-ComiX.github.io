/**
 * sections/SeriesSection.tsx — SerieZ-Kategorieansicht (Serien-Karten + ItemList).
 *
 * Feature: lädt Series-Posts (`useCachedPosts('series')`), rendert Karten mit
 * Cover/Datum/Autor (lokalisiert, Scheduled-Badge für Admins) und
 * `PostItemListSchema` für Crawler. Benutzung: SerieZ-Domain `/` + lokal
 * `/seriez` (`App.tsx`). Gehört NICHT hierher: andere Kategorien, Post-Detail.
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

export const SeriesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { posts, loading } = useCachedPosts('series');

  // Helper to format date
  /** Firestore-Timestamp → `TT.MM.JJ` (aktuelle Sprache), `''` bei Falsy. */
  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(date);
  };

  return (
    <section className="min-h-[50vh]">
      <SectionTitle title={t.home.series.title} />
      <AdminCreateButton category="series" />
      <PostItemListSchema posts={posts} name={t.home.series.title} />
      
      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {posts.map((post, i) => {
            const isScheduled = post.publishedAt?.seconds > Timestamp.now().seconds;

            // Language Logic
            const displayTitle = (language === 'en' && post.titleEn) ? post.titleEn : post.title;

            return (
                <SectorCard to={localizePath(`/post/${post.id}`, language)} key={post.id} accent="orange" tilt={i % 2 === 0 ? -1 : 1} dimmed={isScheduled}>
                <div className="rounded-lg overflow-hidden bg-black">

                    {/* Poster Image Container - REMOVED SCALE EFFECT HERE */}
                    <div className="aspect-[2/3] w-full relative overflow-hidden bg-black">
                        <img
                            src={post.coverUrl}
                            alt={displayTitle}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700"
                        />
                        
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>

                        {/* Top Metadata (Date & Author) - Cinematic Style */}
                        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start">
                             <div className="flex flex-col gap-1 items-start">
                                <span className="flex items-center gap-1.5 bg-black/80 border border-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded">
                                    <Icon name="calendar" size={10} className="text-red-500" /> {formatDate(post.publishedAt)}
                                </span>
                                <span className="flex items-center gap-1.5 bg-black/80 border border-white/10 text-gray-300 text-xs font-medium px-2 py-1 rounded">
                                    <Icon name="user" size={10} className="text-red-500" /> {post.authorName || 'RonniX'}
                                </span>
                             </div>

                             {/* Theme Badge (erstes Multi-Theme) */}
                             <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-2 py-1 rounded shadow-[2px_2px_0_rgba(0,0,0,1)] border-2 border-black">
                                {t.home.admin.themes[((post.themes?.[0] || post.theme) as keyof typeof t.home.admin.themes)] || post.themes?.[0] || post.theme || 'Review'}
                             </span>
                        </div>

                        {/* Scheduled Badge Overlay */}
                        {isScheduled && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                                <span className="text-yellow-500 font-retro text-2xl border-2 border-yellow-500 px-4 py-2 -rotate-12 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                    {t.home.postDetail.scheduledBadge}
                                </span>
                            </div>
                        )}
                        
                        {/* Bottom Title Area */}
                        <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                             <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                 <Icon name="play-circle" size={14} className="text-red-500" />
                                 <span className="text-xs uppercase tracking-widest text-red-400 font-bold">{t.home.series.badge}</span>
                             </div>
                             <h3 className="text-xl md:text-2xl font-retro text-white leading-none drop-shadow-lg group-hover:text-red-500 transition-colors duration-300">
                                {displayTitle}
                             </h3>
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
          <div className="text-6xl mb-6">📺</div>
          <h3 className="text-2xl font-retro text-gray-400 mb-2">{t.home.series.emptyTitle}</h3>
          <p className="text-gray-500">{t.home.series.emptyDesc}</p>
        </div>
      )}
    </section>
  );
};
