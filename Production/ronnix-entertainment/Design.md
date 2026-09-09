# Design.md — RonniX Entertainment (lebendige Feature-Doku, Single Source of Truth)

> Jede Code-Änderung an einem Feature aktualisiert diese Datei in derselben
> Arbeitseinheit (AGENTS.md §12). `docs/` bleibt für Spezialthemen
> (`FIREBASE_DEPLOY.md`, `PRERENDER.md`).

## 1. Domain-Routing (6 Domains, 1 Codebase)

- **Zweck:** Eine Codebase dient 6 Domains, je Domain eine Heimatansicht.
- **Mapping** (`utils/domainConfig.ts`, `DOMAIN_MAP`): `main` → `ronnixentertainment.de`,
  `comics` → `ronnixcomix.de`, `boox` → `ronnixboox.de`, `gamez` → `lamazgamez.de`,
  `moviez` → `ronnixmoviez.de`, `seriez` → `ronnixseriez.de`.
- **Use Cases:** Navbar-Links, Kategorie-Routen (`/comix`, `/boox`, …), SEO-Canonicals,
  lokale `?site=`-Simulation (+ `localStorage`, nur localhost/DEV-Site-Switcher).
- **Haupt-Komponenten:** `App.tsx` (Heimatroute, `ExternalRedirect`), `components/Navbar.tsx`
  (`getLinkUrl`), `components/SEO.tsx` (hreflang), Functions-`sitemap` (host-aware).
- **Konfiguration:** `DOMAIN_MAP` in `domainConfig.ts`; SSO-Werte in `utils/ssoConfig.ts`.
- **Einschränkungen:** Kategorie-Pfade auf Fremd-Domains werden auf `/` normalisiert;
  Deep-Links (`/post/:id`) bleiben pro Domain erhalten.

## 2. Cross-Domain-SSO (unsichtbar-first)

- **Zweck:** Login auf einer Domain gilt überall, ohne sichtbare Reload-Kaskaden.
  Auth-Authority ist die Main-Domain.
- **Use Cases:** (a) Klick auf Fremd-Domain mit Session-Mitnahme, (b) Auto-Login beim
  Betreten einer Subdomain, (c) Login auf Subdomain → Upstream-Seed zu Main,
  (d) Global Logout überall.
- **Haupt-Komponenten/Hooks:**
  - `utils/ssoConfig.ts` — einzige Quelle für Main-Origin, Allowlist, Timeouts
    (`tokenTimeoutMs` 8s, `silentCheckTimeoutMs` 8s, `tokenCacheMs` 30 Min,
    `authCrossfadeMs` 180ms), Keys (`ronnix_sso_checked`, `ronnix-sso-hint`,
    `logged_out`), Schalter (`useFragmentTransport`, `enableSilentCheck`).
  - `utils/ssoValidation.ts` — `sanitizeReturnUrl` (nur relative Pfade),
    `sanitizeCallbackUrl` (volle URL + Allowlist), `extractSsoParams`
    (Fragment zuerst, Query als Fallback), `buildSsoUrl`/`buildBounceUrl`/`buildSeedUrl`,
    `stripSsoParamsFromUrl`.
  - `hooks/useCrossDomainToken.ts` — Single-Flight + Prefetch; Cache/Timeout kanonisch
    in `context/AuthContext.tsx#getCrossDomainToken` (nur Token-Länge wird geloggt).
  - `components/SSOAutoLogin.tsx` — Hidden-Iframe zu `main/sso-bounce?mode=silent`,
    Token per `postMessage`, Gäste ohne Navigation. Fallback Full-Bounce nur bei
    Timeout/Fehler UND Login-Hinweis (`localStorage ronnix-sso-hint`).
  - `components/pages/SSOBounce.tsx` — `mode=silent`: antwortet per `postMessage`
    (keine Navigation, minimale Seite); Voll-Modus: Token im Fragment zurück.
    IAM-Tipp nur in DEV, kein 6s-Block mehr.
  - `components/pages/SSOCallback.tsx` — `/sso`, liest Fragment+Query, validiert
    `returnUrl`, `signInWithCustomToken`, strippt sensible Params.
  - `components/pages/SSOSeed.tsx` — `/sso-seed`, Upstream-Login auf Main,
    Rücksprung via Allowlist-URL + `location.replace`.
  - `components/pages/GlobalLogout.tsx` — widerruft Tokens (`globalSignOut`),
    kehrt mit `?logged_out=true` zurück (Allowlist-geprüft).
  - `components/Navbar.tsx` (NavItem) + `App.tsx` (`ExternalRedirect`) — explizite
    Wechsel: Prefetch bei Hover, sofortiges `replace` mit Fragment-URL, kein Delay.
  - `components/AuthModal.tsx` — Seed nach Subdomain-Login (`replace` + Fragment);
    Google-Redirect-Abschluss global in `AuthProvider` (`getRedirectResult` + Sync).
- **Weiterleitungs-Inszenierung (Sector-Jump, kein Blitzen):**
  - `components/WarpScreen.tsx` — EINE Sprache für alle sichtbaren Wechsel
    (Navbar-Overlay, `/sso`, `/sso-bounce`-Vollmodus, `/sso-seed`, `/global-logout`):
    Zielsektor-Readout (`TARGET SECTOR — …`), Phasen am echten State
    (`preparing → transfer → docking → error`), System-Fonts only (kein FOUT),
    GPU-only-Motion, Reduced-Motion → statisch, Inline-SVG (keine neuen Icons).
  - `components/SEO.tsx` (`bareTitle`) — transiente Routen setzen markenreinen
    Tab-Titel (nur Site-Name), nie „SSO | …".
  - `components/ViewTransitionHandler.tsx` + `index.css`-Wipe — Same-Origin-Wechsel
    per View Transitions API (Warp-Wipe, 320 ms, `cubic-bezier(0.32,0.72,0,1)`);
    Fallback instant, Reduced-Motion instant, Browser-Zurück instant (Limitation).
  - Cross-Origin bleibt Reload, wirkt kontinuierlich: identischer `#0a0a0a`-Boot,
    identischer WarpScreen beidseitig, markenreiner Titel, Font-Preload in
    `index.html` für die Zielseite.
- **Konfiguration:** alles in `SSO_CONFIG` (`utils/ssoConfig.ts`); Hosting-Header in
  `firebase.json` (CSP `frame-src`/`frame-ancestors` für 6 Domains); Preconnects in
  `index.html` (5 Schwester-Domains, Functions-Origin, Google-Auth-Hosts).
- **Speed (kostenlos, Token-vor-Navigation bleibt):** Token-Cache 30 Min (Custom-Token
  1h gültig + innerhalb der Stunde mehrfach einlösbar), Warm-Prefetch nach Login und
  bei Tab-Rückkehr (`AuthContext`), Hover-Prefetch (Navbar), Timing via
  `durationMs` in `[sso]`-Logs (Token-Fetch, Silent-Check, Callback-Exchange).
- **Smoothness (keine Sprünge, CLS-Budget 0):** Erster Paint wartet auf Auth
  (Loader + Gate, keine Gast→User-Blitzer). Danach `components/AuthSlot.tsx`:
  Grid-gestapelte, flächengrößte Box + Opazitäts-Crossfade (`authCrossfadeMs`),
  Reduced-Motion → instant in derselben Box. Eingesetzt im Navbar-Auth-Button
  (Desktop/Mobil, Namen trunkiert via `truncate`+`max-w`). `PostDetail`-Reply immer
  gemountet (`disabled` statt konditional). Guards (`/profile`, `/create`) sehen dank
  Gate nur entschiedene Zustände.
- **Bekannte Einschränkungen:**
  - Safari ITP kann Iframe-Storage partitionieren → dann greift der
    Hinweis-Fallback (ein Full-Bounce).
  - `X-Frame-Options: DENY` wurde entfernt, weil es keine Allowlist kann; Schutz
    läuft über CSP `frame-ancestors` (6 eigene Origins). Reine XFO-Browser rahmen
    deshalb mehr zu — akzeptiert, dokumentiert.
  - Alte `?token=`-Links bleiben lesbar, werden aber nicht mehr erzeugt.

## 3. Auth & Profile

- **Zweck:** E-Mail- + Google-Login, Admin-Erkennung per UID, Profilsync.
- **Komponenten:** `context/AuthContext.tsx` (Status, Logout-Signale
  `logoutSignals/{uid}` + Legacy `users/{uid}`, Token), `components/AuthModal.tsx`,
  `components/pages/UserProfile.tsx`, Functions `updateProfileWithCooldown`,
  `globalSignOut`, `generateCrossDomainToken`.
- **Einschränkungen:** E-Mail-User brauchen Verifizierung für Votes/Comments/Profile.

## 4. Sprach-Handover

- **Zweck:** Sprache reist bei Domain-Wechseln mit (`?lang=`), wird einmalig
  konsumiert (`LanguageParamSynchronizer` löscht den Param) und danach manuell
  umschaltbar; Persistenz `localStorage ronnix-lang`, Tab-Sync via `storage`-Event.

## 5. Fonts (selbst gehostet, swap-frei)

- **Zweck:** Kein FOUT/FONT-Swap in Navbar & Co. — auch nicht beim Erstbesuch je Domain.
- **Ablage:** `public/fonts/` (Bangers 400, Press Start 2P 400, Roboto 400–700 variabel,
  je latin-Subset inkl. Umlaute/€; ~79 kB gesamt; Lizenzen in `LICENSES.md`, OFL/Apache).
- **Mechanik:** `@font-face` in `index.css` (`font-display: swap`, `unicode-range: latin`),
  Preload der kritischen Schnitte (Bangers, Roboto) in `index.html`,
  metrisch angepasste `local()`-Fallbacks (`Bangers-fb` ← Arial Black 64.06 %,
  `PS2P-fb` ← Courier New 166.64 %, `Roboto-fb` ← Arial 96.76 %; Werte aus
  Binär-Metriken vermessen, kein Raten) — selbst ein später Swap shiftet nicht.
- **Stacks** (`tailwind.config.js` + DEV-Block + Editor): Webfont → `-fb` → Systemschrift.
  Transiente Warp-Screens nutzen bewusst nur System-Fonts.
- **CSP:** kein Google-Fonts-Eintrag mehr (`firebase.json`); kein Drittanbieter zur Laufzeit.
- **Einschränkungen:** nur latin-Subset (ł, ě o. Ä. fallen auf Fallback); `font-black`
  wird aus 700 synthetisiert; iOS ohne Arial Black/Impact degradiert zu Sans (keine
  Regression: vorher `cursive`-Fallback).

## 6. Weitere Bereiche (Kurzüberblick, wird bei Berührung vertieft)

- Sections/News/Posts/Comments/Votes, Remote-Config-Flags + Maintenance-Banner,
  Prerender/SSG (`docs/PRERENDER.md`), Deploy (`docs/FIREBASE_DEPLOY.md`,
  AGENTS.md §1: nur `--project ronnix-comix --account "ronnixcomix@gmail.com"`,
  `--only hosting` live, kein Selbst-Deploy durch Agenten).

## 7. SEO, i18n & Discovery (Cluster A, 2026-09-09)

- **Zweck:** Indexierbarkeit je Domain + stabile EN-URLs, ohne zweiten Build.
- **Copy-Quelle:** `HOME_SEO` in `utils/domainConfig.ts` (keyword-first Titles,
  DE/EN-Descriptions je Domain); `SITE_NAMES`, `OG_IMAGES` (PNGs 1730×909 in
  `public/images/`: `preview.png` + 5 Sektor-Varianten) ebenda. `SEO.tsx` wählt
  Titel/Description/OG-Image je Sprache/Domain, setzt Canonicals (DE pfadrein,
  EN `/en/`-Prefix, Query-frei), hreflang (`de`/`en`/`x-default`, kein
  Cross-Domain), `og:image`-Maße/Alt, `article:published_time`, Twitter-`name`-Tags.
- **Statische Hülle:** `index.html` ohne obsolete Meta (`keywords`,
  `revisit-after`, `meta title`), Twitter-`name`-Attribute, Hostname-Canonical
  per Inline-Skript (1 Build, 6 Domains; No-JS-Fallback = Main).
- **EN-Architektur:** DE pfadrein, EN `/en/`-Prefix (alle Inhaltsrouten als
  Pfad-Arrays in `App.tsx`). `LanguagePathSynchronizer` (Pfad ↔ Context,
  `/de/` → Redirect auf clean, gespeichertes EN → Redirect auf `/en/`),
  `LanguageParamSynchronizer` konsumiert `?lang=` (Handover) in stabile Pfade.
  `getLinkUrl`/`localizePath` lokalisieren interne Links (Navbar, QuickNav,
  Footer, alle Post-Links, Profil, Language-Switcher navigiert zum Pendant).
  Transiente Routen (`TRANSIENT_PATHS`: SSO/Logout) nie präfixiert.
- **StructuredData:** `WebSite` je Domain + `Organization` (Main, inkl. `sameAs`),
  `BlogPosting`/`Review` OHNE `reviewRating` (kein Rating-System),
  Publisher-Logo mit echten Maßen (891×838), `BreadcrumbList` (PostDetail),
  `ItemList` via `PostItemListSchema` (nur veröffentlichte Posts, 6 Sections +
  Latest). `SearchAction` entfernt (Route `/search` kommt mit Cluster C).
- **Draft-Guard:** `PostDetail`-Coming-Soon-Branch rendert `noIndex`
  (Nicht-Admins sehen Scheduled nie mit Index-Signal).
- **Robots/Sitemap:** `robots`-Function (host-aware, `firebase.json`-Rewrite,
  `public/robots.txt` nur Fallback), `sitemap`-Function mit www-Strip,
  statischen Routen je Domain, `/en/`-Varianten überall und xhtml-hreflang.
- **GEO:** `public/llms.txt` (Sektoren, Sprachen, Kern-URLs, Zitier-Hinweise).
- **Einschränkungen:** CSR bleibt Default (`docs/PRERENDER.md`: SSG-Kette
  unvollständig — Entries/Plugin/Dist-Mapping/Router-Abstraktion fehlen);
  No-JS-Crawler sehen statische Hülle + Sitemap/llms, kein Volltext.

## 8. Kontakt, Hero & Lint-Gate (Cluster B, 2026-09-09)

- **Kontakt:** FormSubmit bleibt (Honeypot `_honey`), aber `_next` zeigt
  same-origin auf `/danke` (statt toter GitHub-URL) — läuft auf allen 6 Domains
  korrekt. `Danke.tsx` (eigene Datei, lazy) mit Empfangsbestätigung + Home-Link,
  Route `/danke` (+ `/en/danke`), `noIndex`.
- **Assets:** `noise.svg` (eigene feTurbulence-Textur — der Vercel-Hotlink war
  tot/404, Hero-Textur fehlte in Production) und `google.svg` (ex-Gstatic)
  liegen in `public/images/`, kein Drittanbieter zur Laufzeit mehr.
- **Hero:** Logo (echte Maße 2192×754, `fetchpriority=high`) + H1 + Subtext
  (`hero.subtitle`, ≤20 Worte) + 1 primärer CTA (`hero.ctaPrimary` → News,
  lokalisiert, Skew-Pill) + `QuickNav` (7 Sektoren, lokalisiert) als Abschluss.
  Intro nur per Session-Flag (Lazy-Initializer, kein Effect-setState),
  Animationen via `motion-safe:`, Deko mit `aria-hidden`.
- **i18n-Keys neu:** `hero.ctaPrimary`, `contact.thanksTitle/thanksText/backHome`
  (je DE/EN in `locales/home.ts`).
- **Lint-Gate:** `eslint` (+ `@eslint/js`, `typescript-eslint`, `globals`,
  `eslint-plugin-react-hooks`) nachgerüstet, `eslint.config.js` (Flat):
  `rules-of-hooks` + `exhaustive-deps` an (2 echte Hooks-Fehler gefixt:
  `CreatePost`-Effekt über Early-Return gehoben + Deps ergänzt,
  `SEO`/`MaintenanceBanner` auf unbedingte Hook-Calls umgestellt via
  `useLanguageOptional`), 7 ungenutzte Vars/Imports entfernt, `vite.config`
  ohne `as any` typisiert. Geparkt mit Begründung: `no-explicit-any` (Altbestand,
  Typisierung in Cluster C), v6-Meinungsregeln (`set-state-in-effect`,
  `static-components`, `refs` → echte Refactors in Cluster C/D),
  `allowEmptyCatch` (bewusstes Storage-Guard-Muster), `^React$`-Importe
  (Cleanup beim Datei-Split). `npm run lint` grün (0/0).
- **Einschränkungen:** Functions-Backend wird mitgelintet (CommonJS-Block);
  `no-explicit-any` wieder anschalten, sobald Cluster C typisiert.

## 9. Icons, Datei-Splits, Suche (Cluster C, 2026-09-09)

- **Icon-System (`components/icons/Icon.tsx`, 74 Glyphs):** `lucide-react` ist
  raus (Paket deinstalliert, `icons`-Chunk aus `vite.config.ts` entfernt).
  Eine Familie, Strichstärke-Default 2 (chunky Comic-Look), `currentColor`,
  `IconName`-Union für Wert-Positionen. Migration per Skript
  (`Temp/opencode/migrate-icons.mjs`, Dry-Run-Default): 12 Dateien automatisch
  (144 Ersetzungen), 4 per Hand (Icon-als-Wert: Navbar, QuickNav, Footer,
  RichTextEditor-Toolbar). Vote-Füllung (`fill`) entfiel — Zustand trägt Farbe.
- **Splits:** `PostDetail` (870→~420: `post/CommentItem.tsx` rekursiv,
  `post/PostComments.tsx` mit eigenem State/Listener/Handlern),
  `RichTextEditor` (550→~215: `editor/EditorToolbar.tsx`,
  `editor/EditorModals.tsx`; Inline-`<style>` gelöscht — Single Source ist
  `index.css`), `CreatePost` (652→~430: `post/PostMetaFields.tsx` inkl.
  Cover-Upload), `Navbar` (573→~300: `nav/NavItem.tsx`, `nav/navStyles.ts`,
  `nav/Flags.tsx`, `nav/MobileDrawer.tsx`). Alle Moves verbatim (Dry-Run-Cuts),
  Verhalten identisch; einziger Fix nebenbei: mobiles Profil-Link lokalisiert.
- **Docs/Config/Logging:** Dateiköpfe für alle 15 Rest-Dateien, Docstrings für
  Kern-Helper (`useCachedPosts`, `formatDate`, `getCategoryIcon`,
  `getLinkUrl`). `utils/appConfig.ts` neu (ADMIN_UID, Kontakt-Endpunkt, Cache).
  `utils/logger.ts` neu (PII-Redaction: E-Mails/Queries/sensible Keys/Errors,
  Kappen) — alle 48 `console.*`-Stellen laufen darüber; SSO-Timings unverändert.
- **Suche (`pages/Search.tsx`, lazy):** 300-ms-Debounce, 50 neueste Posts
  (Gäste nur Veröffentlichtes), Substring über DE/EN-Titel, `?q=`-Deep-Links,
  lokalisierte Ergebnis-Links, Route `/search` (+ `/en/search`, `noIndex`).
  `SearchAction` im WebSite-Schema ist damit gültig (je Domain).
  i18n-Keys `home.search.*` (DE/EN).
- **Einschränkungen:** `no-explicit-any` bleibt aus (Typisierung nächster
  Schritt); v6-Meinungsregeln geparkt (echte Refactors); Entry-Logs nur für
  SSO/Auth-Flows (breiterer Ausbau = Backlog); Suche ohne Ranking/Filter.

## 10. Welt-System: Karten, Buttons, Motion (Cluster D, 2026-09-09)

- **SectorCard (`components/SectorCard.tsx`):** Comic-Bezel-Hülle für alle
  Post-Karten (weißer Rahmen, schwarzer Doppelrand, harter Offset-Schatten in
  Sektor-Farbe bei Hover, Tilt −1°/+1° im Wechsel). `categoryAccent()` mappt
  Firestore-Kategorien auf Akzente (Single Source). Eingesetzt in LatestPosts
  + 5 Sections (ComicsSection ist das Ur-Muster und bleibt Referenz).
- **ComicButton (`components/ComicButton.tsx`):** die EINE Button-Sprache
  (Skew-Pill, harter Schatten, Druck-Feedback) als Link/Anchor/Button mit
  `tone` (Default Rot) und Größen-`className`. Ersetzt Navbar-Login,
  Hero-CTA, Danke-Link, Kontakt-Submit (Gradient-Pill raus) und alle 7
  QuickNav-Buttons (Pill-Rund raus).
- **Farben:** Rot+Neutral-Disziplin (Hero-Glow Sky→Rot, Logo-Glow Rot, Footer
  bewusst neutral). Sektor-Farben nur in Cards/Nav/Badges.
- **Eyebrows:** `SectionTitle` hat optionale `eyebrow`-Prop (PS2P-Pixel-Font,
  rot, sprachneutral): FRESH SIGNALS / NEWS FEED / PANEL / PAGE / ARCADE /
  CINEMA / BINGE SECTOR, OPEN CHANNEL; Hero: RONNIX UNIVERSE. PS2P ist damit
  aktiv genutzt (zuvor nur GameZ-Titel).
- **Spacing:** Sections `py-24 md:py-32`, App-Wrapper + Article/Search `py-24`.
- **ScrollReveal (`components/ScrollReveal.tsx`):** IntersectionObserver,
  einmalig, Fade-Up + Ent-Blur (Spiel-Kurve), `delay`-Prop; Reduced-Motion →
  sofort sichtbar (Hidden-Klassen nur unter `motion-safe:`). Eingesetzt auf
  allen 7 Grids + Kontakt-Formular. Kein `scroll`-Listener (verboten).
- **Reduced Motion global (`index.css`):** `animate-fade-in/slide-up/pulse/
  spin` werden statisch + `scroll-behavior: auto` (Warp/View-Transition hatten
  eigene Guards). Hover-Transitions bleiben (kurz, nutzerinitiiert).
- **Nav:** Desktop-Leiste erst ab `xl` (1024 war gequetscht), Drawer spiegelt
  nach links (Border, Schatten, Ausrichtung, `pt-24`), Mobile-Flags/Profil
  linksbündig.
- **Einschränkungen:** Admin-/Formular-Kleinbuttons bleiben `rounded-lg`
  (dezente Zweitsprache); Backdrop-Blur-Disziplin + Touch/Kontrast-Feinschliff
  folgen in Cluster E.

## 11. Performance & A11y (Cluster E, 2026-09-09)

- **Bilder:** LCP-Priority nur für echte LCPs (Hero-Logo, PostDetail-Cover,
  `fetchpriority=high`), alle anderen `loading="lazy" + decoding="async"`
  (Sections, Latest, Search, Avatare, Footer, Modals; Navbar-Logo eager).
  Container reservieren Ratios (Aspects/fixe Höhen) — kein `width/height`
  nötig; LatestPosts-Skeleton im Kartenmaß (5 Bezel-Platzhalter, kein CLS).
  `src/assets`-Umzug entfällt bewusst (unnötig seit Caching-Fix).
- **Caching (`firebase.json`):** `immutable 1y` nur noch `/assets/*` (Vite-
  Hashes), `public/`-Bilder/Fonts 30d `must-revalidate` (kein Stale-Logo mehr).
- **A11y:** Skip-Link `#main` (lokalisiert, `navigation.navbar.skipToContent`),
  globaler `:focus-visible`-Ring (Rot); nackte `focus:outline-none` entfernt
  (Burger, Editor-Fläche), Ersatz-Ringe bleiben. Kontraste: Icons/Footer
  grau-600→400, Placeholder →500, Editor-Platzhalter `#555`→`#737373`.
  Kleinschrift `text-[10px]` → `text-xs` (Badges/Meta); Eyebrows bleiben 10px
  PS2P-Kicker (Deko-Kurzcode, hochkontrastig, zoombar). Touch ≥44px: Flags,
  Logout-/Social-/Auth-Buttons, Comment-Votes, Share-Row, Search-Submit
  (`min-h/w` bzw. 44er-Kreis); Editor-Toolbar bewusst ausgenommen
  (Desktop-Präzisionswerkzeug). Labels: `htmlFor`+`id` überall in
  AuthModal/CreatePost/PostMetaFields/EditorModals (+ `id`-Prop und
  textbox-Rolle im Editor).
- **Viewport/Overflow:** `dvh` überall (`min-h-[100dvh]`, Drawer `h-[100dvh]`);
  `overflow-x-hidden` → `overflow-x-clip` (kein Scroll-Container → `sticky`
  lebt, Schutz bleibt); WarpScreen/Hero sind am Verursacher geclippt.
- **Blur/Transition:** Blur nur fixed/sticky (QuickNav-, Badge-, Drawer-,
  Karten-Blurs raus, opake Ersatzwerte); `transition-all` → `transition`
  überall; `ease-game`-Kurve zentral (`tailwind.config`, SectorCard,
  ComicButton, ScrollReveal).
- **Einschränkungen:** Navbar-`scroll`-Listener bleibt (ScrollReveal deckt
  Sektionen; Sticky-Refactor = Backlog); Hover-Transitions laufen unter
  Reduced Motion weiter (kurz, nutzerinitiiert).
