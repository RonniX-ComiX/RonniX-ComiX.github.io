/**
 * AuthContext.tsx — Firebase-Auth-Status, Global Logout und Cross-Domain-Token.
 *
 * Feature: stellt `currentUser`/`isAdmin` bereit, hört Global-Logout-Signale
 * (`logoutSignals/{uid}`, Legacy `users/{uid}.lastLogoutAt`), erzeugt kurzlebige
 * Cross-Domain-Tokens (`generateCrossDomainToken`, mit Timeout + Kurz-Cache) und
 * schließt Google-Redirect-Logins ab (`getRedirectResult`, damit der Seed nach
 * `signInWithRedirect` nicht verloren geht). Use Cases: alle SSO-Flows, Navbar,
 * AuthModal. Benutzung: `const { currentUser, getCrossDomainToken, logout } = useAuth();`
 * Gehört NICHT hierher: URL-Bau/Validierung (`utils/ssoValidation.ts`), Routing.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { auth, db, functions } from '../firebase';
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  getRedirectResult,
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getCurrentCategory, isLocalhost } from '../utils/domainConfig';
import { SSO_CONFIG, getSsoMainOrigin } from '../utils/ssoConfig';
import { ADMIN_UID } from '../utils/appConfig'; // Hartcodiert statt DB-Read: spart einen Read pro Page-Load
import { logError, logInfo, logWarn } from '../utils/logger';

/** Kurz-Cache für Cross-Domain-Token (ein Token pro Tab, bis ~30 Min, siehe SSO_CONFIG). */
let cachedToken: { token: string; expiresAt: number } | null = null;

/** Löscht den Token-Cache (z. B. bei Logout). */
export function clearSsoTokenCache(): void {
  cachedToken = null;
}

/**
 * Merkt, dass auf irgendeiner Domain eingeloggt wurde (Heuristik für
 * Silent-Check-Fallback). Kein Token, nur Zeitstempel.
 */
function setLoginHint(): void {
  try {
    localStorage.setItem(SSO_CONFIG.loginHintKey, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** Entfernt den Login-Hinweis (expliziter Logout). */
function clearLoginHint(): void {
  try {
    localStorage.removeItem(SSO_CONFIG.loginHintKey);
  } catch {
    /* ignore */
  }
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  getCrossDomainToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Monitor Auth State (+ Redirect-Abschluss für Google-Login via Redirect)
  useEffect(() => {
    let cancelled = false;
    // Schließt einen evtl. ausstehenden Google-Redirect-Login ab (z. B. nach
    // signInWithRedirect aus AuthModal — dort ist das Modal nach Reload zu).
    getRedirectResult(auth)
      .then(async (result) => {
        if (cancelled || !result?.user) return;
        logInfo('auth-context', '[sso] Google-Redirect-Login abgeschlossen');
        const user = result.user;
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            { uid: user.uid, displayName: user.displayName || 'Anonymous Hero', photoURL: user.photoURL || '' },
            { merge: true },
          );
          if (user.email) {
            await setDoc(
              doc(db, 'usersPrivate', user.uid),
              { email: user.email, updatedAt: new Date().toISOString() },
              { merge: true },
            ).catch(() => {});
          }
        } catch (e) {
          logError('auth-context', '[auth] Redirect-User-Sync fehlgeschlagen', e);
        }
        setLoginHint();
      })
      .catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      setCurrentUser(user);

      if (user) {
        // Optimization: Check UID directly instead of fetching DB document
        setIsAdmin(user.uid === ADMIN_UID);
        setLoginHint();
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // 2. Realtime Global Logout Listener (logoutSignals, mit Legacy-Fallback users)
  useEffect(() => {
    if (!currentUser) return;

    const checkSnap = (docSnap: any) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.lastLogoutAt?.toDate) {
                const lastLogoutTime = data.lastLogoutAt.toDate().getTime();
                const currentSessionTime = new Date(currentUser.metadata.lastSignInTime || 0).getTime();
                if (lastLogoutTime > currentSessionTime + 2000) {
                    logInfo("auth-context", "Global logout detected. Signing out local session...");
                    clearSsoTokenCache();
                    clearLoginHint();
                    try {
                      sessionStorage.setItem(SSO_CONFIG.checkedKey, 'true');
                    } catch { /* ignore */ }
                    firebaseSignOut(auth).then(() => {
                         window.location.href = '/';
                    });
                }
            }
        }
    };

    // Primär: logoutSignals/{uid} (neu, PII-frei)
    const ref = doc(db, 'logoutSignals', currentUser.uid);
    const unsub = onSnapshot(ref, checkSnap);
    // Fallback: users/{uid}.lastLogoutAt (Legacy, wird nach Migration entfernt)
    const legacyRef = doc(db, 'users', currentUser.uid);
    const unsubLegacy = onSnapshot(legacyRef, checkSnap);

    return () => { unsub(); unsubLegacy(); };
  }, [currentUser]);

  const logout = async () => {
    // 1. Sign out locally immediately
    clearSsoTokenCache();
    clearLoginHint();
    try {
      // Loop-Schutz: derselbe Key, den SSOAutoLogin liest.
      sessionStorage.setItem(SSO_CONFIG.checkedKey, 'true');
    } catch { /* ignore */ }
    await firebaseSignOut(auth);

    // 2. Determine if we need a Global Logout Redirect
    // Auf localhost: nur lokal ausloggen, nie auf Live-Domains springen.
    if (isLocalhost()) return;
    const currentCategory = getCurrentCategory();

    if (currentCategory !== 'main') {
        const mainOrigin = getSsoMainOrigin();
        const returnUrl = window.location.href;

        window.location.replace(`${mainOrigin}/global-logout?returnUrl=${encodeURIComponent(returnUrl)}`);
    } else {
       try {
           const globalSignOutFn = httpsCallable(functions, 'globalSignOut');
           await globalSignOutFn();
       } catch (e) {
           logError("auth-context", "Global SignOut Backend Error", e);
       }
    }
  };

  /**
   * Erzeugt ein Cross-Domain-Token (mit Timeout + Lang-Cache + Timing).
   * Warm-Strategie: nach Login und bei Tab-Rückkehr still vorausgeholt, damit
   * Domain-Klicks den Cache treffen. Loggt nur Dauer/Länge, nie Token-Inhalte.
   */
  const getCrossDomainToken = useCallback(async (): Promise<string | null> => {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : 0;
    logInfo('auth-context', '[sso] getCrossDomainToken aufgerufen', { hasUser: !!currentUser });
    if (!currentUser) {
        logWarn('auth-context', '[sso] kein User, kein Token');
        return null;
    }
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      logInfo('auth-context', '[sso] Token aus Cache');
      return cachedToken.token;
    }
    try {
        const generateToken = httpsCallable<void, { token: string }>(functions, 'generateCrossDomainToken');
        const timeout = new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error(`sso-token-timeout-${SSO_CONFIG.tokenTimeoutMs}ms`)), SSO_CONFIG.tokenTimeoutMs);
        });
        const result = (await Promise.race([generateToken(), timeout])) as { data: { token: string } };
        const token = result?.data?.token ?? null;
        if (token) {
          cachedToken = { token, expiresAt: Date.now() + SSO_CONFIG.tokenCacheMs };
          logInfo('auth-context', '[sso] Token erhalten', {
            length: token.length,
            type: 'customToken',
            durationMs: startedAt ? Math.round(performance.now() - startedAt) : -1,
          });
        }
        return token;
    } catch (error: any) {
        logError('auth-context', '[sso] Token-Erzeugung fehlgeschlagen', {
          error,
          durationMs: startedAt ? Math.round(performance.now() - startedAt) : -1,
        });
        return null;
    }
  }, [currentUser]);

  // Warm-Token: nach Login still vorausfüllen, damit der erste Klick Cache trifft.
  const tokenFnRef = useRef(getCrossDomainToken);
  tokenFnRef.current = getCrossDomainToken;
  useEffect(() => {
    if (currentUser) void tokenFnRef.current();
  }, [currentUser]);
  // Warm-Token: bei Tab-Rückkehr nachfüllen, falls Cache inzwischen ablief.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tokenFnRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const value = {
    currentUser,
    loading,
    isAdmin,
    logout,
    getCrossDomainToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
