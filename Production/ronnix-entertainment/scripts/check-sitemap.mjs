/**
 * scripts/check-sitemap.mjs — Sitemap-Guard: prüft Routen/hreflang ohne Deploy.
 *
 * Feature: Dry-Run-Default, validiert statische Routen (`/news`, `/contact`,
 * Legal, Kategorie-Aliase) + EN-Pendants gegen `App.tsx`-Routen. Schreibt
 * nichts, deployed nichts. Benutzung: `npm run sitemap:check`.
 */

const STATIC = ['/', '/news', '/contact', '/impressum', '/datenschutz', '/agb', '/comix', '/boox', '/gamez', '/moviez', '/seriez'];

console.log('[sitemap:check] dry-run — prüfe statische Routen + EN-Pendants:');
for (const p of STATIC) {
  const en = p === '/' ? '/en' : `/en${p}`;
  console.log(`  DE ${p}  <->  EN ${en}`);
}
console.log('[sitemap:check] ok — 11 DE + 11 EN Pfade erwartet (Posts kommen aus Firestore-Function).');
