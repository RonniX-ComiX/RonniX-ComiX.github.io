/**
 * sections/BooksSection.tsx — BooX-Kategorieansicht (Buch-Karten + ItemList).
 *
 * Feature: lädt Bücher-Posts (`useCachedPosts('books')`), rendert Karten mit
 * Cover/Datum/Autor (lokalisiert, Scheduled-Badge für Admins) und
 * `PostItemListSchema` für Crawler. Benutzung: BooX-Domain `/` + lokal
 * `/boox` (`App.tsx`). Gehört NICHT hierher: andere Kategorien, Post-Detail.
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

export const BooksSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { posts, loading } = useCachedPosts('books');

  // Helper to format date - Changed to numeric month
  /** Firestore-Timestamp → `TT.MM.JJ` (aktuelle Sprache), `''` bei Falsy. */
  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(date);
  };

  // Helper to strip HTML for excerpt
  const getExcerpt = (html: string) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent?.substring(0, 150) + '...' || '';
  };

  return (
    <section className="min-h-[50vh]">
      <SectionTitle title={t.home.books.title} eyebrow="PAGE SECTOR" />
      <PostItemListSchema posts={posts} name={t.home.books.title} />
      
      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto px-4">
           {posts.map((book) => {
             const isScheduled = book.publishedAt?.seconds > Timestamp.now().seconds;
             
             // Language Logic
             const displayTitle = (language === 'en' && book.titleEn) ? book.titleEn : book.title;
             const displayContent = (language === 'en' && book.contentEn) ? book.contentEn : book.content;

              return (
                 <SectorCard to={localizePath(`/post/${book.id}`, language)} key={book.id} accent="blue" dimmed={isScheduled}>
                 <div className="flex flex-col sm:flex-row bg-neutral-900 rounded-lg overflow-hidden w-full">

                 {/* Left: Cover Image - Fixed width for "book cover" feel */}
                <div className="sm:w-[220px] flex-shrink-0 relative overflow-hidden bg-black border-r border-neutral-800">
                    <div className="w-full h-full min-h-[300px] sm:min-h-full relative">
                         <img
                             src={book.coverUrl}
                             alt={displayTitle}
                             loading="lazy"
                             decoding="async"
                             className="w-full h-full object-cover"
                         />
                        {/* Overlay gradient for depth */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/40"></div>
                        
                        {/* Spine effect line */}
                        <div className="absolute left-1 top-0 bottom-0 w-1 bg-white/10 blur-[1px]"></div>
                    </div>

                    {isScheduled && (
                        <div className="absolute top-2 left-2 bg-yellow-600 text-black text-xs font-bold px-2 py-1 rounded shadow-lg">
                            {t.home.postDetail.scheduledBadge}
                        </div>
                    )}
                </div>

                {/* Right: Content */}
                <div className="p-6 flex flex-col justify-between flex-grow relative">
                    
                    {/* Header: Date & Author */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-mono border-b border-neutral-800 pb-2">
                        <span className="flex items-center gap-1 text-red-500">
                            <Icon name="calendar" size={12} /> {formatDate(book.publishedAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Icon name="user" size={12} /> {book.authorName || 'RonniX'}
                        </span>
                    </div>

                    <div>
                        <div className="flex items-start justify-between mb-2">
                             <span className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-neutral-800 px-2 py-1 rounded">
                                {t.home.admin.themes[book.theme as keyof typeof t.home.admin.themes] || book.theme || 'Review'}
                             </span>
                        </div>
                        {/* Changed font-retro to font-serif for book feel */}
                        <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-red-500 mb-3 font-serif transition-colors leading-tight">
                            {displayTitle}
                        </h3>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed line-clamp-3 mb-6 font-serif">
                            {getExcerpt(displayContent)}
                        </p>
                    </div>

                    <div className="flex items-center justify-end mt-auto pt-4 border-t border-neutral-800/50">
                        <span className="text-red-500 font-bold text-sm uppercase tracking-wider group-hover:underline flex items-center gap-1 transition">
                            {t.home.books.readMore} <span>→</span>
                        </span>
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
          <div className="text-6xl mb-6">📚</div>
          <h3 className="text-2xl font-retro text-gray-400 mb-2">{t.home.books.emptyTitle}</h3>
          <p className="text-gray-500">{t.home.books.emptyDesc}</p>
        </div>
      )}
    </section>
  );
};
