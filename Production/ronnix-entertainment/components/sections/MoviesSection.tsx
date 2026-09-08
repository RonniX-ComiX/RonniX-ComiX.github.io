
import React from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';
import { Film, Calendar, User, Clapperboard } from 'lucide-react';
import { useCachedPosts } from '../../hooks/useCachedPosts';

export const MoviesSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { posts, loading } = useCachedPosts('movies');

  // Helper to format date
  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(date);
  };

  return (
    <section className="min-h-[50vh]">
      <SectionTitle title={t.home.movies.title} />
      
      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
          {posts.map((post) => {
            const isScheduled = post.publishedAt?.seconds > Timestamp.now().seconds;
            
            // Language Logic
            const displayTitle = (language === 'en' && post.titleEn) ? post.titleEn : post.title;

            return (
                <Link to={`/post/${post.id}`} key={post.id} className={`group relative cursor-pointer block rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] transition-all duration-500 ${isScheduled ? 'opacity-75' : ''}`}>
                    
                    {/* Poster Image Container - REMOVED SCALE EFFECT HERE */}
                    <div className="aspect-[2/3] w-full relative overflow-hidden bg-black">
                        <img 
                            src={post.coverUrl} 
                            alt={displayTitle} 
                            className="w-full h-full object-cover transition-transform duration-700"
                        />
                        
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>

                        {/* Top Metadata (Date & Author) - Cinematic Style */}
                        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start">
                             <div className="flex flex-col gap-1 items-start">
                                <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 text-gray-300 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                                    <Calendar size={10} className="text-red-500" /> {formatDate(post.publishedAt)}
                                </span>
                                <span className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 text-gray-300 text-[10px] font-medium px-2 py-1 rounded">
                                    <User size={10} className="text-red-500" /> {post.authorName || 'RonniX'}
                                </span>
                             </div>

                             {/* Theme Badge */}
                             <span className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-lg border border-red-500/50">
                                {t.home.admin.themes[post.theme as keyof typeof t.home.admin.themes] || post.theme || 'Review'}
                             </span>
                        </div>

                        {/* Scheduled Badge Overlay */}
                        {isScheduled && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm z-20">
                                <span className="text-yellow-500 font-retro text-2xl border-2 border-yellow-500 px-4 py-2 -rotate-12 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                                    {t.home.postDetail.scheduledBadge}
                                </span>
                            </div>
                        )}
                        
                        {/* Bottom Title Area */}
                        <div className="absolute bottom-0 left-0 w-full p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                             <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                 <Clapperboard size={14} className="text-red-500" />
                                 <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">{t.home.movies.badge}</span>
                             </div>
                             <h3 className="text-xl md:text-2xl font-retro text-white leading-none drop-shadow-lg group-hover:text-red-500 transition-colors duration-300">
                                {displayTitle}
                             </h3>
                        </div>
                    </div>
                </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-neutral-800 rounded-xl bg-neutral-900/30">
          <div className="text-6xl mb-6">🎬</div>
          <h3 className="text-2xl font-retro text-gray-400 mb-2">{t.home.movies.emptyTitle}</h3>
          <p className="text-gray-500">{t.home.movies.emptyDesc}</p>
        </div>
      )}
    </section>
  );
};
