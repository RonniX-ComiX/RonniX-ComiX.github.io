/**
 * hooks/useCachedPosts.ts — Post-Listen mit SWR-Cache (Memory + localStorage).
 *
 * Feature: lädt Posts je Kategorie (`latest` = alle, Limit je Aufruf),
 * filtert Scheduled für Gäste heraus, Admins sehen alles. Cache-Fenster und
 * Key-Prefix kommen aus `utils/appConfig.ts` (§4); Keys tragen zusätzlich die
 * Build-ID (`versionedCacheKey`) — nach jedem Release verfallen alte
 * Generationen automatisch, beim Start wird genau einmal gepurgt (keine
 * veralteten Inhalte nach Domain-Wechsel/Refresh). User-Daten und Präferenzen
 * (Drafts, Sprache, SSO-Hints) sind davon ausgenommen und überleben Releases.
 * Benutzung: `useCachedPosts('comics')` in Sections. Gehört NICHT hierher:
 * Rendering (Sections), Einzel-Post (`pages/PostDetail.tsx`).
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp, limit, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CACHE_DURATION_MS, CACHE_KEY_PREFIX, CACHE_NAMESPACE, versionedCacheKey } from '../utils/appConfig';
import { logError } from '../utils/logger';

// In-Memory + localStorage Persist (SWR: sofort Cache, dann Revalidate)
const memCache: Record<string, { data: any[], timestamp: number }> = {};
const CACHE_DURATION = CACHE_DURATION_MS;

/**
 * Löscht Cache-Einträge älterer Build-Generationen (einmal je Page-Load).
 * Entfernt nur Keys mit `CACHE_KEY_PREFIX`, die NICHT den aktuellen
 * `CACHE_NAMESPACE` tragen — Drafts, Sprache und SSO-Keys bleiben unangetastet.
 */
function purgeStaleCacheGenerations(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const currentPrefix = `${CACHE_KEY_PREFIX}${CACHE_NAMESPACE}_`;
    const stale: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(CACHE_KEY_PREFIX) && !k.startsWith(currentPrefix)) stale.push(k);
    }
    stale.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* Private Mode o. Ä.: still weiter ohne Purge */
  }
}

// Modul-Init: genau einmal pro Page-Load (Import läuft vor erstem Hook-Aufruf).
purgeStaleCacheGenerations();

/**
 * Liest einen Cache-Eintrag aus localStorage (nur innerhalb `CACHE_DURATION_MS` gültig).
 * Der Key wird automatisch mit der Build-ID versioniert (Release-scharf).
 * @param key Fachlicher Schlüssel ohne Prefix/Namespace.
 * @returns Geparste Daten oder `null` (fehlt/alt/kaputt).
 */
const readPersisted = (key: string) => {
  try {
    const raw = localStorage.getItem(versionedCacheKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_DURATION) return parsed.data;
  } catch {}
  return null;
};
/**
 * Schreibt einen Cache-Eintrag mit Zeitstempel nach localStorage (still bei Quota-Fehlern).
 * Der Key wird automatisch mit der Build-ID versioniert (Release-scharf).
 * @param key Fachlicher Schlüssel ohne Prefix/Namespace.
 * @param data Zu persistierende Post-Liste.
 */
const writePersisted = (key: string, data: any[]) => {
  try {
    localStorage.setItem(versionedCacheKey(key), JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
};

/**
 * Lädt Posts mit SWR-Semantik (Memory → localStorage → Firestore-Revalidate).
 * Gäste bekommen nur Veröffentlichtes (`publishedAt <= now`), Admins alles.
 * @param category Firestore-Kategorie oder `'latest'` (alle, Default-Limit 5).
 * @param limitCount Max. Docs (Default: 5 bei `latest`, sonst 12).
 * @returns `{ posts, loading, error }`.
 */
export const useCachedPosts = (category: string | 'latest', limitCount?: number) => {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      const cacheKey = `${category}_${isAdmin ? 'admin' : 'public'}_${limitCount || 'all'}`;
      const now = Date.now();

      if (memCache[cacheKey] && (now - memCache[cacheKey].timestamp < CACHE_DURATION)) {
        setPosts(memCache[cacheKey].data);
        setLoading(false);
        return;
      }
      const persisted = readPersisted(cacheKey);
      if (persisted) {
        setPosts(persisted);
        setLoading(false);
        // SWR: im Hintergrund revalidieren
      } else {
        setLoading(true);
      }

      try {
        const constraints: QueryConstraint[] = [orderBy('publishedAt', 'desc')];
        if (category !== 'latest') constraints.push(where('category', '==', category));
        if (!isAdmin) constraints.push(where('publishedAt', '<=', Timestamp.now()));
        // Default-Limit gegen Full-Scans (Remote Config posts_page_size, Default 12; latest 5)
        const effLimit = limitCount ?? (category === 'latest' ? 5 : 12);
        constraints.push(limit(effLimit));

        const q = query(collection(db, 'posts'), ...constraints);
        const snapshot = await getDocs(q);

        const postsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const sanitize = (val: any): any => {
                if (!val) return val;
                if (typeof val.toMillis === 'function' && typeof val.seconds === 'number') {
                    return { seconds: val.seconds, nanoseconds: val.nanoseconds };
                }
                if (val.firestore && val.path) return val.path;
                if (Array.isArray(val)) return val.map(sanitize);
                if (typeof val === 'object') {
                    const res: any = {};
                    for (const k in val) res[k] = sanitize(val[k]);
                    return res;
                }
                return val;
            };
            const sanitizedData = sanitize(data);
            return {
                id: doc.id,
                ...sanitizedData,
                coverUrl: typeof data.coverUrl === 'string' ? data.coverUrl : '',
                category: typeof data.category === 'string' ? data.category : 'comics',
                authorName: typeof data.authorName === 'string' ? data.authorName : 'RonniX',
            };
        });

        memCache[cacheKey] = { data: postsData, timestamp: now };
        writePersisted(cacheKey, postsData);
        if (!cancelled) setPosts(postsData);
      } catch (err: any) {
          logError('cached-posts', `Error fetching ${category}`, err);
          if (!cancelled) setError(err?.code || 'fetch-failed');
      } finally {
          if (!cancelled) setLoading(false);
      }
    };

    fetchPosts();
    return () => { cancelled = true; };
  }, [category, isAdmin, limitCount]);

  return { posts, loading, error };
};
