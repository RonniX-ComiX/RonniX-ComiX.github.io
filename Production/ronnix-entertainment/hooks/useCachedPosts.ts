
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp, limit, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

// Simple in-memory cache outside the hook (global to the app session)
const cache: Record<string, { data: any[], timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes

export const useCachedPosts = (category: string | 'latest', limitCount?: number) => {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      
      // Create a unique cache key based on params
      const cacheKey = `${category}_${isAdmin ? 'admin' : 'public'}_${limitCount || 'all'}`;
      const now = Date.now();

      // Check Cache
      if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_DURATION)) {
        // console.log(`Serving ${category} from cache`);
        setPosts(cache[cacheKey].data);
        setLoading(false);
        return;
      }

      // Build Query
      try {
        const constraints: QueryConstraint[] = [orderBy('publishedAt', 'desc')];

        if (category !== 'latest') {
             constraints.push(where('category', '==', category));
        }

        if (!isAdmin) {
             constraints.push(where('publishedAt', '<=', Timestamp.now()));
        }
        
        if (limitCount) {
            constraints.push(limit(limitCount));
        }

        const q = query(collection(db, 'posts'), ...constraints);
        const snapshot = await getDocs(q);

        const postsData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Sanitize
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

        // Save to Cache
        cache[cacheKey] = {
            data: postsData,
            timestamp: now
        };

        setPosts(postsData);
      } catch (error) {
          console.error(`Error fetching ${category}:`, error);
      } finally {
          setLoading(false);
      }
    };

    fetchPosts();
  }, [category, isAdmin, limitCount]);

  return { posts, loading };
};
