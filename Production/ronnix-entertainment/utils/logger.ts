/**
 * utils/logger.ts — Einheitliche, PII-sichere Logs (AGENTS.md §5).
 *
 * Feature: `logInfo`/`logWarn`/`logError(scope, message, data?)` mit
 * `[scope]`-Prefix. Payloads werden vor dem Loggen redigiert: E-Mails →
 * `[redacted-email]`, URL-Queries → `[redacted-query]`, sensible Keys
 * (pass/token/secret/credential/...) → `[redacted]`, Errors → nur
 * `{name, message, code}` (keine Stacks/Payloads in Prod), lange Strings
 * und JSON werden gekappt. Inline-Binärdaten (Base64/Data-URLs) fallen unter
 * die Längenkappe und werden als gekürzte Platzhalter sichtbar.
 * Benutzung: überall statt rohem `console.*` mit Objekten. Gehört NICHT
 * hierher: GenAI-Call-Protokolle (keine GenAI-Calls im Frontend),
 * Telemetrie-Versand (nur Konsole).
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const MAX_STRING = 500;
const MAX_JSON = 2000;
const SENSITIVE_KEY_RE = /(pass|token|secret|credential|authorization|api[_-]?key|session)/i;

/** Kürzt und entschärft Strings (E-Mails, URL-Queries, Länge). */
const redactString = (value: string): string => {
  const withoutQuery = value.replace(/\?[^#\s]{1,500}/g, '?[redacted-query]');
  const withoutEmails = withoutQuery.replace(EMAIL_RE, '[redacted-email]');
  return withoutEmails.length > MAX_STRING
    ? `${withoutEmails.slice(0, MAX_STRING)}…[truncated ${withoutEmails.length} chars]`
    : withoutEmails;
};

/** Redigiert beliebige Payloads rekursiv (Tiefe 3, danach Typ-Platzhalter). */
const redactValue = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Error) {
    const code = (value as { code?: unknown }).code;
    const safe: Record<string, unknown> = {
      name: value.name,
      message: redactString(value.message),
    };
    if (typeof code === 'string' || typeof code === 'number') safe.code = code;
    return safe;
  }
  if (depth >= 3) return `[object ${Object.prototype.toString.call(value)}]`;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redactValue(item, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_RE.test(key) ? '[redacted]' : redactValue(entry, depth + 1);
    }
    return out;
  }
  return `[${typeof value}]`;
};

const formatArgs = (scope: string, message: string, data?: unknown): unknown[] => {
  if (data === undefined) return [`[${scope}] ${message}`];
  const redacted = redactValue(data);
  const json = (() => {
    try {
      return JSON.stringify(redacted);
    } catch {
      return '[unserializable]';
    }
  })();
  const payload = json.length > MAX_JSON ? `${json.slice(0, MAX_JSON)}…[truncated]` : redacted;
  return [`[${scope}] ${message}`, payload];
};

/**
 * Info-Log (Funktionsaufrufe, Timings). Payload wird redigiert.
 * @param scope Datei-/Feature-Kürzel, z. B. `'sso-callback'`.
 * @param message Kurzbeschreibung.
 * @param data Optionale, redigierte Zusatzdaten.
 */
export const logInfo = (scope: string, message: string, data?: unknown): void => {
  console.info(...formatArgs(scope, message, data));
};

/**
 * Warn-Log (Degradation, Timeouts, Fallbacks). Payload wird redigiert.
 */
export const logWarn = (scope: string, message: string, data?: unknown): void => {
  console.warn(...formatArgs(scope, message, data));
};

/**
 * Error-Log (Fehler mit Kontext, nie PII im Klartext).
 * @param err Fehlerobjekt oder Kontext — wird sicher serialisiert.
 */
export const logError = (scope: string, message: string, err?: unknown): void => {
  console.error(...formatArgs(scope, message, err));
};
