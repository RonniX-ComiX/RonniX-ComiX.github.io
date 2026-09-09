/**
 * sections/GamesSection.tsx — GameZ-Kategorieansicht (Game-Karten + ItemList).
 *
 * Feature: lädt Games-Posts (`useCachedPosts('games')`), rendert Karten mit
 * Cover/Datum/Autor (lokalisiert, Scheduled-Badge für Admins) und
 * `PostItemListSchema` für Crawler. Benutzung: GameZ-Domain `/` + lokal
 * `/gamez` (`App.tsx`). Gehört NICHT hierher: andere Kategorien, Post-Detail.
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
import { getExcerpt as getSharedExcerpt } from '../../utils/postExcerpt';

export const GamesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { posts, loading } = useCachedPosts('games');

  // Helper to format date
  /** Firestore-Timestamp → `TT.MM.JJ` (aktuelle Sprache), `''` bei Falsy. */
  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: '2-digit'
      }).format(date);
  };

  // Helper to strip HTML for excerpt (SSG-sicher, Wortgrenze)
  const getExcerpt = (html: string) => getSharedExcerpt(html, 80);

  return (
    <section className="min-h-[50vh]">
      <SectionTitle title={t.home.games.title} />
      <AdminCreateButton category="games" />
      <PostItemListSchema posts={posts} name={t.home.games.title} />
      
      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
           {posts.map((game, i) => {
              const isScheduled = game.publishedAt?.seconds > Timestamp.now().seconds;

              // Language Logic
              const displayTitle = (language === 'en' && game.titleEn) ? game.titleEn : game.title;
              const displayContent = (language === 'en' && game.contentEn) ? game.contentEn : game.content;

              return (
                  <SectorCard to={localizePath(`/post/${game.id}`, language)} key={game.id} accent="teal" tilt={i % 2 === 0 ? -1 : 1} dimmed={isScheduled}>
                 <div className="bg-neutral-900 rounded-lg overflow-hidden flex flex-col h-full">

                     {/* Game Cover Area (Portrait) */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-black">
                        <img
                            src={game.coverUrl}
                            alt={displayTitle}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500"
                        />
                        
                        {/* Gradient Overlay bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

                        {/* Top Right: Theme Badge (Like a Skill/Achievement, erstes Multi-Theme) */}
                        <div className="absolute top-2 right-2">
                             <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white bg-red-600 border-2 border-black px-2 py-1 rounded shadow-[2px_2px_0_rgba(0,0,0,1)] transform rotate-2 group-hover:rotate-0 transition-transform">
                                <Icon name="trophy" size={10} />
                                {t.home.admin.themes[((game.themes?.[0] || game.theme) as keyof typeof t.home.admin.themes)] || game.themes?.[0] || game.theme || 'Review'}
                             </span>
                        </div>

                        {/* Scheduled Badge */}
                        {isScheduled && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                <span className="text-yellow-500 font-bold border-2 border-yellow-500 p-2 transform -rotate-12 font-retro text-xl shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                                    {t.home.postDetail.scheduledBadge}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content HUD (Heads Up Display Style) */}
                    <div className="p-4 flex flex-col flex-grow relative -mt-12 z-10">
                        {/* Metadata Box */}
                        <div className="bg-neutral-900 border border-neutral-700 p-3 rounded-lg mb-3 shadow-lg group-hover:border-red-500/50 transition-colors">
                            <div className="flex justify-between items-center text-xs font-mono text-green-400 mb-1">
                                <span className="flex items-center gap-1">
                                    <Icon name="calendar" size={12} /> {formatDate(game.publishedAt)}
                                </span>
                                <span className="flex items-center gap-1 text-blue-400">
                                    <Icon name="user" size={12} /> {game.authorName || 'RonniX'}
                                </span>
                            </div>
                            <div className="h-px w-full bg-neutral-700 my-2"></div>
                             {/* Title - Updated Font here */}
                            <h3 className="text-sm font-gaming text-white leading-relaxed group-hover:text-red-500 transition-colors tracking-wide">
                                {displayTitle}
                            </h3>
                        </div>

                        {/* Excerpt */}
                        <p className="text-gray-400 text-sm line-clamp-3 mb-4 font-sans px-1">
                            {getExcerpt(displayContent)}
                        </p>

                        {/* Footer / Press Start */}
                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-800">
                            <Icon name="gamepad" size={20} className="text-neutral-600 group-hover:text-red-500 transition-colors animate-pulse" />
                            <span className="text-red-500 font-bold text-xs uppercase tracking-widest group-hover:animate-pulse">
                                {t.home.games.pressStart} ▶
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
             <div className="text-6xl mb-6">🎮</div>
             <h3 className="text-2xl font-retro text-gray-400 mb-2">{t.home.games.emptyTitle}</h3>
             <p className="text-gray-500">{t.home.games.emptyDesc}</p>
        </div>
      )}
    </section>
  );
};
