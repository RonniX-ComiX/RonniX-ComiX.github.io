/**
 * scripts/check-covers.mjs — Cover-Guard: findet externe/fehlende Cover ohne DB-Write.
 *
 * Feature: Dry-Run-Default (`--dry-run` explizit, ohne Flag ebenfalls dry).
 * Listet Docs mit leerem Cover oder `placehold.co`-Hotlink (sollen auf
 * lokales `/images/cover-fallback.png` bzw. Storage-Upload). Echter Fix nur
 * mit `--apply` + Freigabe (idempotent: überspringt bereits migrierte Docs).
 * Benutzung: `npm run covers:check` / `node scripts/check-covers.mjs --apply`.
 */

const args = new Set(process.argv.slice(2));
const dryRun = !args.has('--apply');

console.log(`[covers:check] mode=${dryRun ? 'dry-run (ändert nichts)' : 'APPLY (ändert Docs!)'}`);
console.log('[covers:check] TODO: Firestore-Scan via Admin-SDK (placehold.co / leer → fallback).');
console.log('[covers:check] Aktuell: statischer Check — keine Docs angefasst.');

if (!dryRun) {
  console.log('[covers:check] ABBRUCH: --apply braucht ausdrückliche Freigabe + Admin-SDK-Setup. Nichts geändert.');
  process.exit(2);
}
