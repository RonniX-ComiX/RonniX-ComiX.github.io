# Prerender / SSG (Phase 2)

Status: CSR-Build ist stabil (`npm run build`). Prerender ist vorbereitet, aber noch nicht Default,
weil `vite-ssg` (Vue) nicht zu React passt und `vite-ssg-react@0.1.8` noch experimentell ist.

## Empfohlener Weg
1. `npm run build` deployen (Hosting bleibt Firebase Hosting, kein App Hosting).
2. Danach: `npx vite-ssg-react build` testen für `/, /news, /contact, /impressum, /datenschutz, /agb`
   (`/post/:id, /edit/:id, /profile, /create` ausschließen — dynamisch/auth).
3. Wenn stabil: `npm run build:ssg` zum Default machen.

## Voraussetzungen (bereits erledigt)
- `utils/domainConfig.ts` SSG-safe (`typeof window` Guards)
- `SEO.tsx` mit `canonical/hreflang/document.lang`, `noIndex` für `/profile,/create,/edit,/sso*`
- `robots.txt` mit Disallows + host-aware Sitemap-Function (mit Image-Namespace)
- `App.tsx` mit `Suspense` Code-Splitting + 404-Route
- `firebase.ts` mit `getApps`-Guard (kein Doppel-Init im Prerender)

## Hosting (6 Domains behalten)
- 1 Build (`dist`), 6 Custom Domains in Firebase Hosting.
- Alternative: 6 Hosting-Targets (ein Build, 6 Deploys) für getrennte Headers/Cache.
- `firebase.json` bereits: Security-Header, `no-cache` für `*.html`, `immutable` für Assets,
  `sitemap`-Rewrite mit Region `europe-west1`, `firestore/storage/remoteconfig/auth`-Blöcke.
