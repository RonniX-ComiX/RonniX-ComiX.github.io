/**
 * LatestPosts.tsx — Neueste Posts kategorieübergreifend (Karten + ItemList).
 *
 * Feature: lädt die 5 neuesten Posts (`useCachedPosts('latest', 5)`), rendert
 * sie als Horizontal-Snap (mobil) bzw. 5er-Grid (Desktop) mit Kategorie-Farbe
 * und -Icon, Links lokalisiert. Benutzung: in `HomeLatestSection` (Main-Home).
 * Gehört NICHT hierher: Sektions-Rahmen (HomeLatestSection), Kategorien.
 */

import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from './icons/Icon';
import { useCachedPosts } from '../hooks/useCachedPosts';
import { localizePath } from '../utils/domainConfig';
import { PostItemListSchema } from './PostItemListSchema';
import { SectorCard, categoryAccent } from './SectorCard';
import { ScrollReveal } from './ScrollReveal';

export const LatestPosts: React.FC = () => {
  const { t, language } = useLanguage();
  // Use 'latest' as category key and pass limit 5
  const { posts, loading } = useCachedPosts('latest', 5);

  /**
   * Formatiert einen Firestore-Timestamp zu `TT.MM.JJJJ` (aktuelle Sprache).
   * @param timestamp Timestamp (`{seconds}`) oder Falsy.
   * @returns Datumstring oder `''`.
   */
  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(date);
  };

  /**
   * Kategorie → Icon-Name für Badge (Fallback: Palette).
   * @param cat Firestore-Kategorie (`news|comics|books|games|movies|series`).
   */
  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'news': return <Icon name="newspaper" size={12} />;
          case 'comics': return <Icon name="palette" size={12} />;
          case 'books': return <Icon name="book-open" size={12} />;
          case 'games': return <Icon name="gamepad" size={12} />;
          case 'movies': return <Icon name="film" size={12} />;
          case 'series': return <Icon name="tv" size={12} />;
          default: return <Icon name="palette" size={12} />;
      }
  };

  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'news': return 'bg-pink-600 border-pink-400';
          case 'comics': return 'bg-red-600 border-red-400';
          case 'books': return 'bg-blue-600 border-blue-400';
          case 'games': return 'bg-green-600 border-green-400';
          case 'movies': return 'bg-yellow-500 border-yellow-300 text-black';
          case 'series': return 'bg-orange-600 border-orange-400';
          default: return 'bg-gray-600 border-gray-400';
      }
  };

  // Skeleton im Kartenmaß (aspect + Grid wie echte Cards → kein CLS beim Laden)
  if (loading) return (
    <div className="w-full" aria-hidden="true">
      <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-4 pb-4 lg:pb-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-[240px] lg:w-full aspect-[2/3] rounded-xl border-2 border-black bg-white p-1.5">
            <div className="w-full h-full rounded-lg bg-neutral-900 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
  if (posts.length === 0) return null;

  return (
    <div className="w-full">
        <PostItemListSchema posts={posts} name={t.home.hero.latestTitle} />
        {/* Mobile: Horizontal Scroll | Desktop: Grid */}
        <ScrollReveal>
        <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-4 pb-4 lg:pb-0 snap-x snap-mandatory scrollbar-hide">
            {posts.map((post, i) => {
                const displayTitle = (language === 'en' && post.titleEn) ? post.titleEn : post.title;
                const isScheduled = post.publishedAt?.seconds > Timestamp.now().seconds;

                return (
                    <SectorCard
                        to={localizePath(`/post/${post.id}`, language)}
                        key={post.id}
                        accent={categoryAccent(post.category)}
                        tilt={i % 2 === 0 ? -1 : 1}
                        dimmed={isScheduled}
                        className="relative flex-shrink-0 w-[240px] lg:w-full aspect-[2/3] snap-start"
                    >
                        <div className="relative w-full h-full overflow-hidden rounded-lg bg-black">
                        {/* Background Image */}
                        <img
                            src={post.coverUrl || ''}
                            alt={displayTitle || 'Post Cover'}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col justify-end h-full">

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                <span className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] ${getCategoryColor(post.category)}`}>
                                    {getCategoryIcon(post.category)} {post.category}
                                </span>
                                {isScheduled && (
                                     <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400 text-black border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                         {t.home.postDetail.scheduledBadge}
                                     </span>
                                )}
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-2 text-xs text-gray-300 mb-1 font-mono">
                                <span className="flex items-center gap-1"><Icon name="calendar" size={10} /> {formatDate(post.publishedAt)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Icon name="user" size={10} /> {post.authorName || 'RonniX'}</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-white font-bold leading-tight line-clamp-3 group-hover:text-red-400 transition-colors drop-shadow-md">
                                {displayTitle}
                            </h3>
                        </div>
                        </div>
                    </SectorCard>
                )
            })}
        </div>
        </ScrollReveal>
    </div>
  );
};
