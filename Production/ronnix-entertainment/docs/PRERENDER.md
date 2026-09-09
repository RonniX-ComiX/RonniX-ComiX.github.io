# Prerender / SSG (Phase 2)

Status (verifiziert 2026-09-09): CSR-Build (`npm run build`) bleibt Default.
`npm run build:ssg` existiert, ist aber NOCH NICHT Default — die Kette ist
unvollständig, ein Flip jetzt würde den Deploy brechen:

1. `vite-ssg-react build` rendert nur `*.html.jsx`-Entries — keine vorhanden
   (Entry ist `index.html` + `index.tsx`).
2. Das `ssgReact()`-Plugin fehlt in `vite.config.ts`.
3. Output-Ziel ist `dist/public`, Hosting serviert `dist/`.
4. `App.tsx` nutzt `BrowserRouter` (braucht DOM/History) — `renderToString`
   ohne Router-Abstraktion (Static-/MemoryRouter) crasht.
5. Peer ist Vite 5 (`vite-ssg-react@0.1.8`), Projekt nutzt Vite 7.

Bis dahin tragen Crawler: host-aware Canonicals (`index.html`-Inline-Skript +
`SEO.tsx`), host-aware `robots.txt`/`sitemap.xml`-Functions mit `/en/`-Varianten
und hreflang, `llms.txt` sowie semantisches HTML + JSON-LD.

## Weg zum Default (wenn SSG kommt)

1. `index.html.jsx`-Entries je Route (`/`, `/news`, `/contact`, Legal, je `/en/`).
2. `ssgReact()` in `vite.config.ts`, Output-Mapping `dist/public` → `dist/`.
3. Router-Abstraktion in `App.tsx` (Browser vs. Static für SSG).
4. `npm run build:ssg` grün verifizieren, DANACH erst `build` umstellen.

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
