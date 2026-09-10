/**
 * canonical.js — Hostname-scharfer Canonical ohne Inline-Script (CSP-konform).
 *
 * Feature: 1 Build, 6 Domains. Spiegelt `index.html#static-canonical` +
 * `og:url` auf die echte Origin (Pfad ohne Trailing Slash), damit jede Domain
 * ihren eigenen Canonical trägt. Externe Datei statt Inline-`<script>`, weil
 * die CSP (`firebase.json`, `script-src 'self' …`) Inline-Ausführung blockt
 * (PageSpeed: "Executing inline script violates … script-src").
 * Läuft mit `defer` vor React-Hydration; Helmet (`SEO.tsx`) überschreibt feiner
 * je Route/Sprache. Benutzung: `<script src="/canonical.js" defer>` in
 * `index.html`. Gehört NICHT hierher: Sprach-Canonicals (`SEO.tsx`),
 * Sitemap/Robots (Functions).
 */
(function () {
  try {
    var origin = window.location.origin.toLowerCase();
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    var canonical = origin + path;
    var link = document.getElementById('static-canonical');
    if (link) link.setAttribute('href', canonical);
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonical);
  } catch (e) {
    /* statischer Fallback bleibt */
  }
})();
