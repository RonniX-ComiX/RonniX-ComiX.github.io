/**
 * ssoValidation.ts — Sicherheits- und Transport-Helfer für Cross-Domain-SSO.
 *
 * Feature: validiert untrusted URL-Eingaben (returnUrl, Callback-URLs), baut
 * SSO-Ziel-URLs mit Fragment-Transport (`#token=...`, nie Server-Logs) und liest
 * Token aus Query ODER Fragment (Migration: alte `?token=`-Links bleiben lesbar).
 * Use Cases: SSOCallback, SSOBounce, SSOSeed, Navbar, ExternalRedirect, AuthModal.
 * Benutzung: `sanitizeReturnUrl()` für jede Weiterleitung nach Login; `buildSsoUrl()`
 * für jede Weiterleitung MIT Token; `extractSsoParams()` beim Empfang.
 * Gehört NICHT hierher: Config-Werte (siehe `utils/ssoConfig.ts`).
 */

import { SSO_CONFIG, getSsoMainOrigin, isSsoAllowedHost, isSsoAllowedOrigin } from './ssoConfig';

/** Maximale Länge für returnUrl/final_path (Schutz vor Log-Bloat). */
const MAX_PATH_LEN = 2048;

/**
 * Entfernt sensible SSO-Parameter aus der Adresszeile (kein Token-Leak via
 * History/Referrer/Logs). Behält harmlose Parameter (z. B. `lang`).
 */
export function stripSsoParamsFromUrl(): void {
  try {
    const url = new URL(window.location.href);
    let touched = false;
    for (const key of ['token', 'status', 'callback', 'final_path']) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        touched = true;
      }
    }
    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      let hashTouched = false;
      for (const key of ['token', 'status', 'returnUrl']) {
        if (hashParams.has(key)) {
          hashParams.delete(key);
          hashTouched = true;
        }
      }
      url.hash = hashParams.toString() ? `#${hashParams.toString()}` : '';
      touched = touched || hashTouched;
    }
    if (touched) window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Validiert einen internen Weiterleitungs-Pfad nach Login.
 * Erlaubt nur relative Pfade (`/post/123?lang=de`), blockt `//evil`, `http:`,
 * Backslashes und überlange Werte.
 * @param raw Rohwert aus Query/Fragment.
 * @param fallback Rückfall bei ungültig (Default `/`).
 */
export function sanitizeReturnUrl(raw: string | null, fallback = '/'): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const v = raw.trim().slice(0, MAX_PATH_LEN);
  if (!v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) return fallback;
  try {
    const u = new URL(v, 'https://local.invalid');
    if (u.origin !== 'https://local.invalid') return fallback;
    if (/[<>"\s]/.test(v)) return fallback;
    return `${u.pathname}${u.search}${u.hash}` || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Validiert eine volle Callback-/Return-URL (Marlowe-Domain, https, kein Token-Leak-Ziel).
 * @param raw Absolute URL, z. B. `https://ronnixcomix.de/sso`.
 * @returns Normalisierte URL oder `null` bei ungültig.
 */
export function sanitizeCallbackUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' && u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') return null;
    if (!isSsoAllowedHost(u.hostname)) return null;
    u.hash = '';
    u.searchParams.delete('token');
    return u.toString();
  } catch {
    return null;
  }
}

/** Alias für Seed-/Logout-Rücksprünge (volle URL, Allowlist-geprüft). */
export const sanitizeReturnCallbackUrl = sanitizeCallbackUrl;

export interface ExtractedSsoParams {
  token: string | null;
  returnUrl: string;
  status: string | null;
}

/**
 * Liest SSO-Parameter aus Query UND Fragment. Fragment hat Vorrang (neuer
 * Standard seit Fragment-Transport), Query bleibt als Fallback lesbar.
 * @param search `window.location.search`, @param hash `window.location.hash`.
 */
export function extractSsoParams(search: string, hash: string): ExtractedSsoParams {
  const q = new URLSearchParams(search || '');
  const h = new URLSearchParams((hash || '').replace(/^#/, ''));
  const token = h.get('token') || q.get('token');
  const status = h.get('status') || q.get('status');
  const rawReturn = h.get('returnUrl') || q.get('returnUrl') || '/';
  return { token, status, returnUrl: sanitizeReturnUrl(rawReturn) };
}

/**
 * Baut die SSO-Lande-URL auf der Ziel-Domain.
 * Mit Fragment-Transport: `{origin}/sso#token=...&returnUrl=...` (Token nie im
 * Query → nie in Server-Logs); sonst Query-Fallback.
 */
export function buildSsoUrl(targetOrigin: string, token: string, returnPath: string): string {
  const origin = targetOrigin.replace(/\/$/, '');
  const safeReturn = sanitizeReturnUrl(returnPath);
  if (SSO_CONFIG.useFragmentTransport) {
    const h = new URLSearchParams({ token, returnUrl: safeReturn }).toString();
    return `${origin}/sso#${h}`;
  }
  return `${origin}/sso?token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(safeReturn)}`;
}

/**
 * Baut die Bounce-URL zur Main-Domain (enthält NIE ein Token, nur Routing-Info).
 */
export function buildBounceUrl(callbackUrl: string, finalPath: string, mode: 'full' | 'silent' = 'full'): string {
  const safeFinal = sanitizeReturnUrl(finalPath);
  const params = new URLSearchParams({ callback: callbackUrl, final_path: safeFinal });
  if (mode === 'silent') params.set('mode', 'silent');
  return `${getSsoMainOrigin()}/sso-bounce?${params.toString()}`;
}

/**
 * Baut die Seed-URL zur Main-Domain (Upstream-Sync nach Login auf Subdomain).
 * Nutzt Fragment-Transport, damit das Token nicht im Query steht.
 */
export function buildSeedUrl(token: string, returnUrl: string): string {
  const safeReturn = sanitizeCallbackUrl(returnUrl) ?? `${getSsoMainOrigin()}/`;
  if (SSO_CONFIG.useFragmentTransport) {
    const h = new URLSearchParams({ token, returnUrl: safeReturn }).toString();
    return `${getSsoMainOrigin()}/sso-seed#${h}`;
  }
  return `${getSsoMainOrigin()}/sso-seed?token=${encodeURIComponent(token)}&returnUrl=${encodeURIComponent(safeReturn)}`;
}

export { isSsoAllowedHost, isSsoAllowedOrigin };
