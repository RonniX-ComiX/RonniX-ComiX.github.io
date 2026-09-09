/**
 * useCrossDomainToken.ts — Dünner Wrapper um AuthContext.getCrossDomainToken.
 *
 * Feature: Single-Flight (parallele Rufe teilen einen Promise) + stiller Prefetch
 * für Hover/Fokus, damit Domain-Wechsel instant wirken. Cache + Timeout leben in
 * `context/AuthContext.tsx` (kanonisch). Use Cases: Navbar, ExternalRedirect.
 * Benutzung: `const { getToken, prefetch } = useCrossDomainToken();`
 * Gehört NICHT hierher: Token-Erzeugung selbst, Sign-in mit Token.
 */

import { useCallback, useRef } from 'react';
import { useAuth, clearSsoTokenCache } from '../context/AuthContext';

/**
 * Hook für SSO-Token mit Single-Flight + Prefetch.
 * @returns getToken ( Promise<string|null> ), prefetch (still), invalidate.
 */
export function useCrossDomainToken() {
  const { getCrossDomainToken } = useAuth();
  const inFlight = useRef<Promise<string | null> | null>(null);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (inFlight.current) return inFlight.current;
    const p = getCrossDomainToken().finally(() => {
      inFlight.current = null;
    });
    inFlight.current = p;
    return p;
  }, [getCrossDomainToken]);

  /** Lädt still vor (z. B. Link-Hover). Fehler werden geschluckt. */
  const prefetch = useCallback(() => {
    if (inFlight.current) return;
    void getToken().catch(() => {});
  }, [getToken]);

  const invalidate = useCallback(() => {
    clearSsoTokenCache();
  }, []);

  return { getToken, prefetch, invalidate };
}

export { clearSsoTokenCache as clearCrossDomainTokenCache };
