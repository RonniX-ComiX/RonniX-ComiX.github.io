/**
 * LatestPosts.tsx — Neueste Posts kategorieübergreifend als Horizontal-Carousel.
 *
 * Feature: lädt die 10 neuesten Posts (`useCachedPosts('latest', 10)`), rendert
 * sie immer horizontal (Snap + versteckte Scrollbar) mit Pfeil-Steuerung
 * (Zurück/Vor, Disabled an den Rändern), Touch-Swipe und Tastatur. Sektion
 * behält dadurch konstante Höhe — kein zusätzliches vertikales Scrollen.
 * Kategorie-Farbe/-Icon, Tilt, Dimm (Scheduled) wie gehabt, Links lokalisiert.
 * Benutzung: in `HomeLatestSection` (Main-Home). Gehört NICHT hierher:
 * Sektions-Rahmen (HomeLatestSection), Kategorien.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from './icons/Icon';
import { useCachedPosts } from '../hooks/useCachedPosts';
import { localizePath } from '../utils/domainConfig';
import { PostItemListSchema } from './PostItemListSchema';
import { SectorCard, categoryAccent } from './SectorCard';
import { ScrollReveal } from './ScrollReveal';

/** Fallback-Kartenbreite inkl. Gap (px), falls kein `<a>` im Track gefunden wird. */
const FALLBACK_STEP = 256; // 240px Karte + 16px Gap
/** Feste Kartenbreite bleibt gleich (mobil wie Desktop) — Höhe konstant. */
const CARD_CLASS = 'relative flex-shrink-0 w-[240px] md:w-[260px] aspect-[2/3] snap-start';

export const LatestPosts: React.FC = () => {
  const { t, language } = useLanguage();
  // 'latest' als Kategorie-Key, 10 Posts für echten Carousel-Weg.
  const { posts, loading } = useCachedPosts('latest', 10);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

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
          case 'games': return 'bg-teal-500 border-teal-300 text-black';
          case 'movies': return 'bg-green-600 border-green-400';
          case 'series': return 'bg-orange-600 border-orange-400';
          default: return 'bg-gray-600 border-gray-400';
      }
  };

  /** Aktualisiert die Ränder-Zustände (Pfeile) am echten Scroll-Zustand. */
  const updateEdgeState = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  // Ränder nach Ladefortschritt, Scroll und Resize nachziehen.
  useEffect(() => {
    updateEdgeState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateEdgeState, { passive: true });
    window.addEventListener('resize', updateEdgeState);
    return () => {
      el.removeEventListener('scroll', updateEdgeState);
      window.removeEventListener('resize', updateEdgeState);
    };
  }, [loading, posts.length]);

  // Mausrad: vertikales Wheel wird horizontal konsumiert (Desktop-Carousel-Gefühl),
  // nur solange der Track noch Luft hat — sonst scrollt die Seite normal weiter.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      const atStart = el.scrollLeft <= 4;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      const consumes = (e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atStart);
      if (!consumes) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  /** Scrollt um ~2 Karten (Richtung: -1 zurück, +1 vor). */
  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // SectorCard rendert einen `<a>` — Kartenbreite daraus ableiten.
    const card = el.querySelector<HTMLElement>('a');
    const step = (card?.offsetWidth ?? FALLBACK_STEP) * 2;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  // Skeleton im Kartenmaß (gleiche Streifen-Höhe → kein CLS beim Laden).
  if (loading) return (
    <div className="w-full" aria-hidden="true">
      <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 w-[240px] md:w-[260px] aspect-[2/3] rounded-xl border-2 border-black bg-white p-1.5">
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
        <ScrollReveal>
        {/* Pfeil-Steuerung (im Spiel-Stil, eigene SVG-Glyphen) */}
        <div className="flex items-center justify-end gap-3 mb-4">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              disabled={!canPrev}
              aria-label={t.home.hero.carouselPrev}
              className="h-11 w-11 rounded-full border-2 border-neutral-700 bg-black text-neutral-300 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
            >
              <Icon name="arrow-left" size={20} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              disabled={!canNext}
              aria-label={t.home.hero.carouselNext}
              className="h-11 w-11 rounded-full border-2 border-neutral-700 bg-black text-neutral-300 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
            >
              <Icon name="arrow-right" size={20} />
            </button>
        </div>

        {/* Horizontale Snap-Leiste (kein Vertikal-Wachstum mehr) */}
        <div
          ref={trackRef}
          role="region"
          aria-label={t.home.hero.latestTitle}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-4"
        >
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
                        className={CARD_CLASS}
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
