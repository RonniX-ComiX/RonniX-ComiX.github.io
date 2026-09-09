/**
 * ssoConfig.ts — Zentrale Konfiguration für Cross-Domain-SSO und Domain-Weiterleitung.
 *
 * Feature: Single Sign-On über 6 Domains (eine Firebase-Codebase, Auth-Authority ist
 * die Main-Domain `ronnixentertainment.de`). Deckt ab: explizite Navigation mit
 * Session-Mitnahme (Navbar/ExternalRedirect), stille Auto-Login-Prüfung per Hidden-
 * Iframe (SSOAutoLogin), Bounce-Responder auf Main (SSOBounce), Upstream-Seed nach
 * Login auf Subdomain (SSOSeed/AuthModal) und Global Logout.
 *
 * Benutzung: ausschließlich über die Exporte hier lesen (keine hartcodierten Domains,
 * Timeouts oder Allowlisten anderswo). `DOMAIN_MAP` aus `domainConfig.ts` ist die
 * Quelle für Hostnamen; dieses Modul leitet Allowlist + Main-Origin daraus ab.
 *
 * Gehört NICHT hierher: URL-Validierungslogik (siehe `utils/ssoValidation.ts`),
 * Token-Erzeugung (Backend `functions/index.js`), UI-Komponenten.
 */

import { DOMAIN_MAP } from './domainConfig';
import type { SiteCategory } from './domainConfig';

/** Alle bekannten Site-Kategorien (6 Domains). */
export const SSO_SITE_CATEGORIES: SiteCategory[] = ['main', 'comics', 'boox', 'gamez', 'moviez', 'seriez'];

/** Hostname der Auth-Authority (Main-Domain). */
export const SSO_MAIN_HOST: string = DOMAIN_MAP.main;

/** Origin der Auth-Authority (immer https, außer localhost-Dev). */
export function getSsoMainOrigin(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname.toLowerCase();
    if (h.includes('localhost') || h === '127.0.0.1') return window.location.origin;
  }
  return `https://${SSO_MAIN_HOST}`;
}

/**
 * Allowlist aller eigenen Hosts (ohne Protokoll/Port, kleingeschrieben).
 * Wird für Callback-/ReturnUrl-Checks und postMessage-Origin-Checks genutzt.
 */
export function getSsoAllowedHosts(): string[] {
  const hosts = SSO_SITE_CATEGORIES.map((c) => DOMAIN_MAP[c].toLowerCase());
  return [...hosts, 'localhost', '127.0.0.1'];
}

/**
 * Prüft, ob ein Hostname zu uns gehört (exakt oder Subdomain davon).
 * @param hostname Hostname ohne Port, z. B. `ronnixcomix.de`.
 */
export function isSsoAllowedHost(hostname: string): boolean {
  const h = (hostname || '').toLowerCase();
  if (!h) return false;
  return getSsoAllowedHosts().some((allowed) => h === allowed || h.endsWith(`.${allowed}`));
}

/**
 * Prüft, ob eine Origin zu uns gehört (für postMessage).
 * @param origin Origin wie `https://ronnixcomix.de`.
 */
export function isSsoAllowedOrigin(origin: string): boolean {
  try {
    return isSsoAllowedHost(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export interface SsoConfig {
  /** Timeout für `generateCrossDomainToken`-Callable (ms). */
  tokenTimeoutMs: number;
  /** Wie lange der Silent-Iframe höchstens lädt, bevor als Gast weitergearbeitet wird (ms). */
  silentCheckTimeoutMs: number;
  /** Cache-Dauer für ein bereits geholtes Cross-Domain-Token im Speicher (ms). */
  tokenCacheMs: number;
  /** Dauer des Slot-Crossfades bei Auth-Wechseln (ms, 0 = instant). */
  authCrossfadeMs: number;
  /** Token nach Fragment-Transport (`#token=`) statt Query (`?token=`) übertragen. Fragment geht nie an Server/Logs. */
  useFragmentTransport: boolean;
  /** Stille Iframe-Prüfung statt Full-Page-Bounce für Auto-Login. */
  enableSilentCheck: boolean;
  /** SessionStorage-Key: Auto-Login wurde in diesem Tab bereits geprüft (Loop-Schutz). */
  checkedKey: string;
  /** LocalStorage-Key: Hinweis, dass auf irgendeiner Domain je eingeloggt war (Fallback-Heuristik). */
  loginHintKey: string;
  /** Query-Flag, das ein frischer Logout setzt (`?logged_out=true`). */
  loggedOutParam: string;
}

/** Zentrale SSO-Laufzeitwerte. Spannen in Klammern = zulässiger Änderungsbereich. */
export const SSO_CONFIG: SsoConfig = {
  tokenTimeoutMs: 8000, // (2000..15000)
  silentCheckTimeoutMs: 8000, // (3000..15000)
  // Custom-Token sind 1h gültig UND innerhalb der Stunde mehrfach einlösbar
  // (Firebase: "that's just how long you have to use that token to authenticate").
  // 30 Min Cache = Klick trifft fast immer, Rest-Gültigkeit 30 Min für signIn.
  tokenCacheMs: 1_800_000, // (0..3000000)
  authCrossfadeMs: 180, // (0..400; 0 = instant, Reduced-Motion erzwingt 0)
  useFragmentTransport: true, // (bool)
  enableSilentCheck: true, // (bool)
  checkedKey: 'ronnix_sso_checked', // (string, stabil halten: Tabs im Feld nutzen alten Key)
  loginHintKey: 'ronnix-sso-hint', // (string)
  loggedOutParam: 'logged_out', // (string)
};
