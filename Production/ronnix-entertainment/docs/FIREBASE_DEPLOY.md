# Firebase Deploy-Checkliste (Blaze aktiv)

## 1. Env
- `.env.local` aus `.env.example` anlegen (VITE_FIREBASE_*, VITE_RECAPTCHA_V3_SITE_KEY)
- Niemals `.env.local` committen (`*.local` ist ignoriert)

## 2. Basis
- `npx -y firebase-tools@latest login --no-localhost`
- `npx -y firebase-tools@latest use ronnix-comix`
- `npx -y firebase-tools@latest firestore:databases:list` (Edition prüfen: STANDARD erwartet)

## 3. Provisionierung (einmalig)
- Auth: `npx -y firebase-tools@latest deploy --only auth` (authorizedDomains aus firebase.json)
- Google OAuth: Origins + `__/auth/handler` für alle 6 Domains (siehe backend_instructions.md Schritt 5)
- IAM Credentials API aktivieren + `Service Account Token Creator` für Functions-Identity (Cross-Domain Tokens)
- App Check: Web-App mit reCAPTCHA v3 registrieren, Site-Key in `.env.local`
- Storage: Extension „Storage Resize Images“ für `covers/` Thumbs (AVIF/WebP)
- Remote Config: Template wird via `deploy --only remoteconfig` aus `remoteconfig.template.json` deployed

## 4. Deploy
```
cd functions && npm install && cd ..
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes,storage,remoteconfig
npx -y firebase-tools@latest deploy --only functions
npm run build
npx -y firebase-tools@latest deploy --only hosting
```

## 5. Nach Deploy
- Rules: `users` enthält keine `email` mehr (Migration: emails nach `usersPrivate/{uid}` kopieren, dann aus `users` löschen)
- Functions-Logs prüfen: `votePost, voteComment, updateProfileWithCooldown, onCommentCreated, sitemap, generateCrossDomainToken, globalSignOut`
- AppCheck-Enforcement: aktuell `enforceAppCheck:false` (Rollout-sicher). Nach Site-Key-Provisionierung auf `true` für vote-Functions stellen.
- Sitemap je Domain testen: `https://<domain>/sitemap.xml`
