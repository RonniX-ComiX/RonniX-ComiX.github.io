import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getRemoteConfig, fetchAndActivate } from 'firebase/remote-config';

// Firebase Config via Vite Env (VITE_*), mit Fallback für lokale Dev-Umgebung.
// Lege eine `.env.local` an (siehe `.env.example`). committede Keys rotieren.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAvLLP1wy2dZsiwwPHWEG3JkHqH3PlUyMA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ronnix-comix.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ronnix-comix",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ronnix-comix.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "915988998321",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:915988998321:web:4dd91b767103c573695a90",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JGMLYWZ0JB",
};

// Reuse App für vite-ssg Prerender (kein Doppel-Init)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Persistenz explizit: Sessions überleben Reloads/Tab-Wechsel (wichtig für 6-Domain SSO)
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Offline-Persistenz mit Multi-Tab-Manager (SWR + weniger Reads)
try {
  initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  // bereits initialisiert (HMR/SSG) -> ignorieren
}
export const db = getFirestore(app);
export const functions = getFunctions(app, 'europe-west1'); // Region muss mit Cloud Functions übereinstimmen
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Hinweis: App Check / reCAPTCHA bewusst entfernt (Kosten/Entscheidung 2026-09-09).
// Abuse-Schutz läuft über Security Rules + serverseitige Functions-Validierung.

// Remote Config: Feature-Flags ohne Redeploy (Cooldown, PageSize, Maintenance)
export const remoteConfig = typeof window !== 'undefined' ? getRemoteConfig(app) : null;
if (remoteConfig) {
  remoteConfig.settings = {
    minimumFetchIntervalMillis: import.meta.env.DEV ? 60_000 : 3600_000,
    fetchTimeoutMillis: 10_000,
  };
  remoteConfig.defaultConfig = {
    cooldown_hours: 24,
    comments_page_size: 20,
    posts_page_size: 12,
    maintenance_mode: false,
    sitemap_cache_seconds: 3600,
  };
  // Fire-and-forget: Defaults gelten sofort, Server-Werte beim nächsten Start
  fetchAndActivate(remoteConfig).catch(() => {});
}

export default app;