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
