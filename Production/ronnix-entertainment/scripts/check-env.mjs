/**
 * scripts/check-env.mjs — Env-Guard: prüft VITE_*-Keys ohne Secrets zu loggen.
 *
 * Feature: liest `.env.local`/`.env` + `process.env`, meldet fehlende
 * `VITE_FIREBASE_*`-Keys (Namen only, nie Werte). Dry-Run ist Default
 * (read-only, ändert nichts). Benutzung: `npm run env:check`.
 * Gehört NICHT hierher: Deploy/Build (siehe `package.json`).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REQUIRED = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const root = process.cwd();
const loadEnvFile = (name) => {
  const p = resolve(root, name);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
};

const fileEnv = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local') };
const missing = REQUIRED.filter((k) => !(process.env[k] || fileEnv[k]));

if (missing.length > 0) {
  console.log(`[env:check] missing keys (names only): ${missing.join(', ')}`);
  console.log('[env:check] Hinweis: `.env.example` als Vorlage nutzen, nie Secrets committen.');
  process.exit(1);
}
console.log('[env:check] ok — alle VITE_FIREBASE_*-Keys vorhanden (Werte nicht geloggt).');
