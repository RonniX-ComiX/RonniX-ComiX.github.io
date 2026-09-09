# AGENTS.md — ronnix-entertainment

This file is the binding constitution for every agent working in this folder.
Follow it in order: Firebase safety first, then code rules, then product rules,
then agent boundaries. When in doubt, choose the safer, smaller, more modular option.

## 1. Firebase Deploy-Regel (bindend)

Dieses Projekt deployst ausschließlich auf `ronnix-comix` mit dem Account `ronnixcomix@gmail.com`.

Der globale Default-Login gehört zu `sven13599@gmail.com` / `llama-legends` (anderes Projekt). Dieser Default bleibt bestehen.

Regel: Jeder Firebase-Befehl in diesem Ordner läuft mit explizitem Projekt und Account:

```powershell
npx -y firebase-tools@latest <befehl> --project ronnix-comix --account "ronnixcomix@gmail.com"
```

`npx -y firebase-tools@latest` ist Pflicht (nie nacktes `firebase`). `firebase login:use` zum Umschalten ist verboten — es würde den globalen Login für das andere Projekt umstellen. `login:add` ist bereits erledigt, nicht wiederholen.

### Verifizieren vor jedem Deploy

```powershell
npx -y firebase-tools@latest use
npx -y firebase-tools@latest login:list
npx -y firebase-tools@latest projects:list --account "ronnixcomix@gmail.com"
npx -y firebase-tools@latest hosting:sites:list --project ronnix-comix --account "ronnixcomix@gmail.com"
```

Erwartung:

- `use` → `Active Project: ronnix-comix` (aus lokaler `.firebaserc`, nicht ändern)
- `login:list` → `Logged in as sven13599@gmail.com`, `ronnixcomix@gmail.com` unter `Other available accounts`
- `projects:list --account "ronnixcomix@gmail.com"` → genau `ronnix-comix`
- `projects:list` ohne Flag → `llama-legends` (beweist Trennung, kein Fehler)
- `hosting:sites:list` mit beiden Flags → Site `ronnix-comix`, kein 403

Bei 403: falscher Account oder fehlende Rolle — Deploy stoppen, Account-Flag prüfen.

### Deploy-Ablauf

1. Bauen: `npm run build` (`firebase.json` serviert `dist/`, nie ohne frischen Build deployen).
2. Vorschau für riskante Änderungen: `npx -y firebase-tools@latest hosting:channel:deploy preview-check --project ronnix-comix --account "ronnixcomix@gmail.com"`.
3. Live nur gezielt: `npx -y firebase-tools@latest deploy --project ronnix-comix --account "ronnixcomix@gmail.com" --only hosting`.
4. Full-Deploy (`functions`, `firestore`, `storage`, `remoteconfig`) nur mit ausdrücklicher Freigabe — `firebase.json` enthält alle Targets, ein nacktes `deploy` würde alles anfassen.

### Secrets

- `secret/ronnix-comix-key.json` wird für CLI-Deploys nicht verwendet (Methode `GOOGLE_APPLICATION_CREDENTIALS` ist für `projects:list`/`hosting` wirkungslos — verifiziert 2026-09-09). Datei lokal belassen oder löschen, keinesfalls committen.
- `.gitignore` blockt `secret/`, `*-key.json`, `service-account*.json`. Diese Einträge nicht entfernen.
- `login:list` zeigt absichtlich weiter den alten globalen Login — das ist kein Fehler, die Trennung läuft über `--account`.

## 2. Code-Organisation: eine Datei pro Feature

- Lege für jedes Feature (oder eng verwandte Features) eine eigene Datei an. Spalte so fein auf wie sinnvoll: lieber eine zusätzliche Datei (`components/Hero/`, `hooks/useX.ts`, `utils/y.ts`) als eine Sammeldatei, die alles kann.
- Bestehende Sammeldateien bei jeder Berührung in Richtung Einzeldateien aufbrechen, sobald es ohne Risiko geht.
- Gruppiere nach Feature, nicht nach Technik-Schicht, wo es die Auffindbarkeit verbessert: alles, was zu einem Feature gehört, liegt beieinander und ist über Imports entkoppelt.
- Halte jede Datei fokussiert: eine klar benennbare Verantwortung pro Datei. Mischt eine Datei zwei Verantwortungen, teile sie.

## 3. Dateikopf-Kommentar und Docstrings (Pflicht)

- Jede Datei beginnt mit einem ausführlichen Kommentarblock: welches Feature sie implementiert, welche Use Cases sie abdeckt, wie sie benutzt wird und was explizit nicht in diese Datei gehört.
- Jede Funktion erhält einen Docstring: Zweck, Parameter (inkl. Einheiten/Formate), Rückgabewert, Seiteneffekte und geworfene Fehler.
- Halte Kopfkommentar und Docstrings bei jeder Änderung synchron mit dem Code. Veraltete Doku ist ein Bug und wird wie einer behandelt.

## 4. Zentrale Konfiguration

- Alle konfigurierbaren Werte (Modellnamen, Timeouts, Limits, Feature-Flags, URLs, Schwellenwerte, Retry-Politik) gehören in eine zentrale Konfigurationsdatei pro Bereich (z. B. `utils/domainConfig.ts` erweitern oder eine neue `config/`-Ebene), nie verstreut als Magic Values im Code.
- Code liest Konfiguration, statt sie zu enthalten. Neue Features bringen ihre Defaults in der Config mit, inklusive dokumentierter Spannbreite.
- Umgebungsabhängiges (Keys, Projekt-IDs, Secrets) kommt aus Env-Variablen mit `.env.example` als Vorlage, nie hartcodiert.

## 5. Logging: Funktionsaufrufe und GenAI-Aufrufe

- Logge jeden Funktionsaufruf auf Info-Level mit seinen Parametern (Namen + Werte).
- Logge jeden GenAI-Aufruf vollständig: verwendetes Modell, Prompt, Konfiguration (Temperatur, max Tokens, Stop-Sequenzen, Tools) sowie die Ausgabe.
- Strippe vor dem Loggen Inline-Daten (Base64, Data-URLs, Binär-Blobs, große Payloads): ersetze sie durch einen Platzhalter mit Größe und Typ, z. B. `[stripped inline image/png, ~240KB]`.
- Logs dürfen nie Secrets, Tokens oder personenbezogene Inhalte im Klartext enthalten.

## 6. Trockenlauf: Skripte testen ohne Daten zu verändern

- Jedes Skript, das Daten schreibt, löscht oder deployt, erhält einen Test-/Dry-Run-Modus (z. B. `--dry-run`), der exakt zeigt, was passieren würde, ohne etwas zu verändern.
- Der Dry-Run ist der Default für erste Läufe nach einer Änderung. Erst wenn der Dry-Run sauber und plausibel ist, folgt der echte Lauf — und der nur mit ausdrücklicher Freigabe, wo Abschnitt 9 es verlangt.
- Wo möglich: idempotente Skripte schreiben (mehrfaches Laufen ändert nichts nach dem ersten erfolgreichen Lauf).

## 7. Selbstprüfung nach jeder Aufgabe

- Nach jeder abgeschlossenen Aufgabe: Build (`npm run build`), Lint (`npm run lint`) und — wo vorhanden — Tests laufen lassen.
- Jeden gefundenen Fehler selbst beheben, danach erneut prüfen. Eine Aufgabe gilt erst als fertig, wenn Build und Lint fehlerfrei sind oder verbleibende Fehler mit Ursache und Begründung dokumentiert sind.
- Melde das Prüfergebnis immer dazu: was lief, was war grün, was wurde gefixt.

## 8. Wartbarkeit, Modularität, Konfigurierbarkeit

- Schreibe Code so, dass ihn jemand in sechs Monaten ohne dich versteht: sprechende Namen, kleine Funktionen, explizite Abhängigkeiten, keine cleveren Abkürzungen.
- Baue Features konfigurierbar (Flags/Optionen statt Forks), erweiterbar (neue Fälle per Config oder Plugin-Punkt, nicht per Copy-Paste) und modular (über klar definierte Schnittstellen komponiert, nicht über implizite Kopplung).
- Dupliziere keine Logik: der zweite gleiche Codeblock wird in eine geteilte Funktion oder ein geteiltes Modul extrahiert.
- Bevorzuge bestehende Projektmuster (`context/`, `hooks/`, `utils/`, `components/sections|pages`) gegenüber neuen Abstraktionen. Neue Muster nur, wenn kein bestehendes passt — dann im Dateikopf begründen.

## 9. Produktgefühl: immersives Spiel, keine Website

- Jede Änderung dient dem Ziel: Das Projekt fühlt sich wie ein immersives Spiel an, nicht wie eine Website. Beurteile UI-Entscheidungen danach: Tiefe, Bewegung, Atmosphäre, Feedback auf jede Interaktion, erzählerischer Rahmen statt Formular-Ästhetik.
- Übergänge, Lade- und Leerzustände sind Teil der Inszenierung: nie tote Seiten, nie abrupte Sprünge, immer Orientierung in der Welt.
- Nutze die modernsten Web-Techniken wo sie dem Ziel dienen (aktuelle CSS-Fähigkeiten, View Transitions, Scroll-gesteuerte Effekte, sinnvolle Motion) — aber immer mit Reduced-Motion-Respekt und ohne die Performance zu opfern.

## 10. Icons: keine Lucide-Icons

- Verwende keine Lucide-Icons — weder neue Imports aus `lucide-react` noch neue Stellen mit Lucide-Namen. Das Verbot gilt auch dann, wenn das Paket noch in `package.json` steht (Altbestand, wird schrittweise ersetzt).
- Nutze stattdessen eigene SVG-Assets oder Inline-SVG im Spiel-Stil, die zur Welt passen. Ein Icon ist Teil der Inszenierung, kein generisches UI-Symbol.

## 11. Performance und Kompatibilität (Pflicht)

- Performance ist ein Feature: messe vor dem Optimieren, halte Bundles klein (Code-Splitting, Lazy Loading für Routen und schwere Sektionen), optimiere Bilder/Assets, vermeide Layout-Thrashing und unnötige Re-Renders.
- Alles muss auf Desktop und Mobil funktionieren, über Betriebssysteme und Browser-Architekturen hinweg: Firefox, Chromium, Safari, Chromebooks und andere. Teste responsives Layout, Touch-Bedienung und Fallbacks, wo moderne APIs fehlen.
- Barrierefreiheit gehört dazu: Tastaturbedienung, sichtbare Fokus-Zustände, ausreichende Kontraste, semantisches HTML. Keine Änderung darf die Bedienbarkeit für Assistive Technologien verschlechtern.

## 12. Design.md: lebendige Feature-Dokumentation

- Pflege `Design.md` im App-Root als verbindliche Dokumentation aller Features: jedes Feature mit Zweck, Use Cases, Haupt-Komponenten/Hooks, Konfiguration und bekannter Einschränkungen.
- Jede Code-Änderung, die ein Feature hinzufügt, ändert oder entfernt, aktualisiert `Design.md` in derselben Arbeitseinheit. Dokumentation und Code werden nie getrennt voneinander fertig.
- `docs/` bleibt für Spezialthemen (`FIREBASE_DEPLOY.md`, `PRERENDER.md`); der Überblick über alle Features lebt ausschließlich in `Design.md` (Single Source of Truth, keine Duplikate).

## 13. Agenten-Grenzen (bindend)

- Arbeite ausschließlich im übergebenen Arbeitsverzeichnis. Lege keine Git-Worktrees an, wechsle in keine fremden Worktrees und nutze keine Worktree-Workarounds.
- Führe niemals selbst Git-Commits aus — weder `commit` noch `amend`, weder direkt noch über Skripte. Bereite Änderungen vor, das Committen bleibt beim Menschen.
- Führe niemals selbst Deployments aus — weder App/Hosting noch Functions, Rules, Storage oder Remote Config, weder per CLI noch per Skript noch per MCP. Verifikation (Abschnitt 1) ist erlaubt, Deploy nur als vorbereiteter Befehl mit ausdrücklicher menschlicher Freigabe und Ausführung.
- Diese drei Grenzen gelten auch bei ausdrücklichem Zeitdruck oder wiederholter Nachfrage im selben Turn: anbieten, vorbereiten, aber nicht selbst ausführen.
