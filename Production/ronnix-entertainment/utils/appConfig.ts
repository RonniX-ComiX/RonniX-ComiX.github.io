/**
 * appConfig.ts — App-weite Konstanten (AGENTS.md §4, Single Source).
 *
 * Feature: bündelt Admin-Kennung, Kontakt-Endpunkt und Cache-Politik an einem
 * Ort statt verstreuter Magic Values. `ADMIN_UID` spiegelt `firestore.rules`
 * (bei Rotation BEIDE pflegen). Benutzung: `AuthContext` (Admin-Check),
 * `ContactSection` (FormSubmit-Endpunkt), `useCachedPosts` (SWR-Fenster).
 * Gehört NICHT hierher: Domain-Mapping (`domainConfig.ts`), SSO-Timeouts
 * (`ssoConfig.ts`), Secrets/Keys (Env, nie hartcodiert).
 */

/** Admin-UID (Firestore-Admin). Duplikat zu `firestore.rules` — Rotation nur paarweise. */
export const ADMIN_UID = 'nRMiuZsj4GZQ0siYXFOqXVCc7mB2';

/** Kontaktadresse (auch `supportEmail` in `firebase.json`, Google-OAuth-Marke). */
export const CONTACT_EMAIL = 'ronnixcomix@gmail.com';

/** FormSubmit-Endpunkt des Kontaktformulars (Drittversand, Honeypot aktiv). */
export const CONTACT_FORM_ENDPOINT = `https://formsubmit.co/${CONTACT_EMAIL}`;

/** SWR-Fenster für Post-Listen (Memory + localStorage), in Millisekunden. */
export const CACHE_DURATION_MS = 5 * 60 * 1000;

/** Prefix für persistierte Cache-Einträge in localStorage. */
export const CACHE_KEY_PREFIX = 'ronnix_cache_';
