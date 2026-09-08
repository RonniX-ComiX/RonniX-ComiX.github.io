
import React from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';
import { Gamepad2, Calendar, User, Trophy } from 'lucide-react';
import { useCachedPosts } from '../../hooks/useCachedPosts';

export const GamesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { posts, loading } = useCachedPosts('games');

  // Helper to format date
  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: '2-digit'
      }).format(date);
  };

  // Helper to strip HTML for excerpt
  const getExcerpt = (html: string) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent?.substring(0, 80) + '...' || '';
  };

  return (
    <section className="min-h-[50vh]">
      <SectionTitle title={t.home.games.title} />
      
      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
           {posts.map((game) => {
             const isScheduled = game.publishedAt?.seconds > Timestamp.now().seconds;
             
             // Language Logic
             const displayTitle = (language === 'en' && game.titleEn) ? game.titleEn : game.title;
             const displayContent = (language === 'en' && game.contentEn) ? game.contentEn : game.content;

             return (
                <Link to={`/post/${game.id}`} key={game.id} className={`group relative flex flex-col bg-neutral-900 rounded-xl overflow-hidden border-2 border-neutral-800 hover:border-red-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-2 ${isScheduled ? 'opacity-60 border-yellow-900 border-dashed' : ''}`}>
                    
                    {/* Game Cover Area (Portrait) */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-black">
                        <img 
                            src={game.coverUrl} 
                            alt={displayTitle} 
                            className="w-full h-full object-cover transition-transform duration-500" 
                        />
                        
                        {/* Gradient Overlay bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

                        {/* Top Right: Theme Badge (Like a Skill/Achievement) */}
                        <div className="absolute top-2 right-2">
                             <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white bg-red-600 border border-red-400 px-2 py-1 rounded shadow-lg transform rotate-2 group-hover:rotate-0 transition-transform">
                                <Trophy size={10} />
                                {t.home.admin.themes[game.theme as keyof typeof t.home.admin.themes] || game.theme || 'Review'}
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
                        <div className="bg-neutral-800/90 backdrop-blur-sm border border-neutral-700 p-3 rounded-lg mb-3 shadow-lg group-hover:border-red-500/50 transition-colors">
                            <div className="flex justify-between items-center text-xs font-mono text-green-400 mb-1">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} /> {formatDate(game.publishedAt)}
                                </span>
                                <span className="flex items-center gap-1 text-blue-400">
                                    <User size={12} /> {game.authorName || 'RonniX'}
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
                            <Gamepad2 size={20} className="text-neutral-600 group-hover:text-red-500 transition-colors animate-pulse" />
                            <span className="text-red-500 font-bold text-xs uppercase tracking-widest group-hover:animate-pulse">
                                {t.home.games.pressStart} ▶
                            </span>
                        </div>
                    </div>
                </Link>
             );
           })}
        </div>
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
