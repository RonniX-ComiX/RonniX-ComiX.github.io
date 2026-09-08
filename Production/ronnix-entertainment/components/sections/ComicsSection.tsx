
import React from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { SectionTitle } from '../SectionTitle';
import { useLanguage } from '../../context/LanguageContext';
import { useCachedPosts } from '../../hooks/useCachedPosts';

export const ComicsSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { posts, loading } = useCachedPosts('comics');

  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: '2-digit'
      }).format(date);
  };

  return (
    <section className="min-h-[50vh]">
      <SectionTitle title={t.home.comics.title} />
      
      {loading ? (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
          {posts.map((post) => {
            const isScheduled = post.publishedAt?.seconds > Timestamp.now().seconds;
            const displayTitle = (language === 'en' && post.titleEn) ? post.titleEn : post.title;

            return (
                <Link to={`/post/${post.id}`} key={post.id} className={`group relative cursor-pointer block ${isScheduled ? 'opacity-75' : ''}`}>
                <div className="relative bg-white p-2 transform rotate-[-1deg] transition-all duration-300 group-hover:rotate-0 group-hover:scale-105 group-hover:shadow-[5px_5px_0_rgba(220,38,38,1)]">
                    
                    {/* Date & Author Badge - Comic Style */}
                    <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1 font-sans pointer-events-none">
                         <span className="bg-yellow-400 text-black text-xs font-black uppercase px-2 py-0.5 border-2 border-black transform -rotate-3 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                             {formatDate(post.publishedAt)}
                         </span>
                         <span className="bg-neutral-900 text-white text-xs font-bold px-2 py-0.5 border-2 border-black transform rotate-2 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                             {post.authorName || 'RonniX'}
                         </span>
                    </div>

                    <div className="aspect-[2/3] overflow-hidden bg-gray-900 relative border border-black">
                        <img 
                            src={post.coverUrl} 
                            alt={displayTitle} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                        {isScheduled && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-yellow-500 font-retro text-2xl border-2 border-yellow-500 px-4 py-2 rotate-12">
                                    {t.home.postDetail.scheduledBadge}
                                </span>
                            </div>
                        )}
                        
                        {/* Title Label - Now INSIDE the image container to respect the white border padding */}
                        <div className="absolute bottom-0 left-0 w-full bg-black/90 p-3 border-t-2 border-black">
                            <p className="text-white font-retro text-xl text-center truncate px-2">{displayTitle}</p>
                        </div>
                    </div>

                    {/* Dynamic Theme Badge */}
                    <div className="absolute top-4 right-4 bg-red-600 text-white font-retro px-3 py-1 text-lg transform rotate-3 shadow-md border-2 border-white uppercase z-30">
                        {t.home.admin.themes[post.theme as keyof typeof t.home.admin.themes] || post.theme || 'Review'}
                    </div>
                </div>
                </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-neutral-800 rounded-xl bg-neutral-900/30">
          <div className="text-6xl mb-6">🎨</div>
          <h3 className="text-2xl font-retro text-gray-400 mb-2">{t.home.comics.emptyTitle}</h3>
          <p className="text-gray-500">{t.home.comics.emptyDesc}</p>
        </div>
      )}
    </section>
  );
};
