/**
 * pages/Search.tsx — Volltextähnliche Suche über Posts (Titel, substrings).
 *
 * Feature: Eingabe mit 300-ms-Debounce, lädt die 50 neuesten Posts
 * (Gäste: nur Veröffentlichte) und filtert clientseitig über DE/EN-Titel
 * (case-insensitive, substring). Ergebnis-Karten mit Cover, Kategorie-Badge
 * und lokalisiertem Link. Route ist `noIndex` (Thin Content), macht aber die
 * `SearchAction` im WebSite-Schema gültig (`/search?q=`).
 * Benutzung: `/search` (+ `/en/search`, auch `?q=`-Deep-Link) in `App.tsx`.
 * Gehört NICHT hierher: Ranking/Backend-Suche (Algolia o. Ä. bei Bedarf),
 * Filter-UI (Kategorie-Filter = Backlog).
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { localizePath } from '../../utils/domainConfig';
import { logError } from '../../utils/logger';
import { Icon } from '../icons/Icon';
import { SEO } from '../SEO';

const DEBOUNCE_MS = 300;
const MAX_DOCS = 50;

interface SearchHit {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  coverUrl: string;
  themes?: string[];
}

export const Search: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const [input, setInput] = useState(params.get('q') || '');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  const q = (params.get('q') || '').trim().toLowerCase();

  // Eingabe → URL (debounced, damit `q` teilbar/bookmarkbar bleibt)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = input.trim();
      if (next === (params.get('q') || '')) return;
      setParams(next ? { q: next } : {}, { replace: true });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [input, params, setParams]);

  // Suche bei `q`-Änderung (Titel-Substring über die neuesten 50 Posts)
  useEffect(() => {
    let cancelled = false;
    if (!q) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const run = async () => {
      try {
        const constraints = [orderBy('publishedAt', 'desc'), limit(MAX_DOCS)] as any[];
        if (!isAdmin) constraints.push(where('publishedAt', '<=', Timestamp.now()));
        const snap = await getDocs(query(collection(db, 'posts'), ...constraints));
        if (cancelled) return;
        const now = Timestamp.now().seconds;
        const found: SearchHit[] = [];
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (!isAdmin && (data.publishedAt?.seconds ?? 0) > now) return;
          const title = typeof data.title === 'string' ? data.title : '';
          const titleEn = typeof data.titleEn === 'string' ? data.titleEn : '';
          const haystack = [
            title, titleEn,
            data.author, data.itemAuthor, data.artist, data.publisherDe, data.publisher,
            Array.isArray(data.coverArtists) ? data.coverArtists.join(' ') : '',
          ].filter(Boolean).join(' ').toLowerCase();
          if (haystack.includes(q)) {
            found.push({
              id: docSnap.id,
              title,
              titleEn,
              category: typeof data.category === 'string' ? data.category : 'news',
              coverUrl: typeof data.coverUrl === 'string' ? data.coverUrl : '',
              themes: Array.isArray(data.themes) ? data.themes : (data.theme ? [data.theme] : []),
            });
          }
        });
        setHits(found);
      } catch (e) {
        logError('search', 'Suche fehlgeschlagen', e);
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [q, isAdmin]);

  return (
    <div className="container mx-auto px-6 py-24 animate-fade-in min-h-[60vh]">
      <SEO title={t.home.search.title} noIndex />

      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-retro text-white text-center mb-8 drop-shadow-[2px_2px_0_rgba(220,38,38,1)]">
          {t.home.search.title}
        </h1>

        <div className="relative mb-10">
          <Icon name="search" size={20} className="absolute left-4 top-4 text-gray-500" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.home.search.placeholder}
            aria-label={t.home.search.title}
            className="w-full bg-black border border-neutral-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors placeholder-gray-500 text-lg"
          />
        </div>

        {searching ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        ) : q ? (
          hits.length > 0 ? (
            <>
              <p className="text-gray-400 mb-6 text-center">
                {t.home.search.resultsFor} “{params.get('q')?.trim()}” — {hits.length}
              </p>
              <ul className="space-y-4">
                {hits.map((hit) => {
                  const displayTitle = language === 'en' && hit.titleEn ? hit.titleEn : hit.title;
                  return (
                    <li key={hit.id}>
                      <Link
                        to={localizePath(`/post/${hit.id}`, language)}
                        className="flex items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-red-600 transition-colors group p-3"
                      >
                        {hit.coverUrl ? (
                          <img
                            src={hit.coverUrl}
                            alt={displayTitle}
                            loading="lazy"
                            decoding="async"
                            className="w-16 h-16 object-cover rounded-lg border border-neutral-700 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-neutral-800 border border-neutral-700 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate group-hover:text-red-400 transition-colors">
                            {displayTitle}
                          </p>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{hit.category}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="text-center text-gray-500 py-12">{t.home.search.noResults}</p>
          )
        ) : (
          <p className="text-center text-gray-600">{t.home.search.hint}</p>
        )}
      </div>
    </div>
  );
};
