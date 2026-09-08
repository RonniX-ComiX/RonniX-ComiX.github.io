
import React from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, User, Newspaper, Gamepad2, BookOpen, Palette, Film, Tv } from 'lucide-react';
import { useCachedPosts } from '../hooks/useCachedPosts';

export const LatestPosts: React.FC = () => {
  const { t, language } = useLanguage();
  // Use 'latest' as category key and pass limit 5
  const { posts, loading } = useCachedPosts('latest', 5);

  const formatDate = (timestamp: any) => {
      if (!timestamp?.seconds) return '';
      const date = new Date(timestamp.seconds * 1000);
      return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(date);
  };

  const getCategoryIcon = (cat: string) => {
      switch(cat) {
          case 'news': return <Newspaper size={12} />;
          case 'comics': return <Palette size={12} />;
          case 'books': return <BookOpen size={12} />;
          case 'games': return <Gamepad2 size={12} />;
          case 'movies': return <Film size={12} />;
          case 'series': return <Tv size={12} />;
          default: return <Palette size={12} />;
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

  if (loading) return <div className="h-48 w-full animate-pulse bg-neutral-900 rounded-xl"></div>;
  if (posts.length === 0) return null;

  return (
    <div className="w-full">
        {/* Mobile: Horizontal Scroll | Desktop: Grid */}
        <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-4 pb-4 lg:pb-0 snap-x snap-mandatory scrollbar-hide">
            {posts.map((post) => {
                const displayTitle = (language === 'en' && post.titleEn) ? post.titleEn : post.title;
                const isScheduled = post.publishedAt?.seconds > Timestamp.now().seconds;

                return (
                    <Link 
                        to={`/post/${post.id}`} 
                        key={post.id}
                        className={`relative flex-shrink-0 w-[240px] lg:w-full aspect-[2/3] rounded-xl overflow-hidden snap-start border border-neutral-800 group hover:border-gray-500 transition-all ${isScheduled ? 'opacity-70' : ''}`}
                    >
                        {/* Background Image */}
                        <img 
                            src={post.coverUrl || ''} 
                            alt={displayTitle || 'Post Cover'} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 w-full p-4 flex flex-col justify-end h-full">
                            
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-md ${getCategoryColor(post.category)}`}>
                                    {getCategoryIcon(post.category)} {post.category}
                                </span>
                                {isScheduled && (
                                     <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400 text-black border border-yellow-200">
                                         {t.home.postDetail.scheduledBadge}
                                     </span>
                                )}
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-2 text-[10px] text-gray-300 mb-1 font-mono">
                                <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(post.publishedAt)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><User size={10} /> {post.authorName || 'RonniX'}</span>
                            </div>

                            {/* Title */}
                            <h3 className="text-white font-bold leading-tight line-clamp-3 group-hover:text-red-400 transition-colors drop-shadow-md">
                                {displayTitle}
                            </h3>
                        </div>
                    </Link>
                )
            })}
        </div>
    </div>
  );
};
