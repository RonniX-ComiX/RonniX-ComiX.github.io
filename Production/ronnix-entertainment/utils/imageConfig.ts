/**
 * imageConfig.ts — Zentrale Bild-Konfiguration (AGENTS.md §4, Single Source).
 *
 * Feature: bündelt alle responsiven Brand-Assets (Hero-LCP, Logo, OG/Cover)
 * an einem Ort statt verstreuter Magic Strings: Basispfade (PNG-Fallback),
 * WebP-Varianten mit Breiten (`-640`/`-1024`/…-Suffixe, erzeugt mit
 * `npx webp-image-cli convert <png> -q 80 -w <breite>`), `srcset`-Strings und
 * `sizes`-Hints je Einsatzort sowie intrinsische Maße (CLS-Schutz).
 * PNGs bleiben als Fallback für alte Browser + Social-Scraper (`og:image`
 * braucht breit unterstützte Rasterformate). Benutzung: `ResponsiveImage`
 * (`components/ResponsiveImage.tsx`) + Preloads in `index.html`.
 * Gehört NICHT hierher: versionierte URLs (`appConfig.versionedAssetUrl`),
 * User-Cover aus Firestore (externe URLs, kein srcset möglich).
 */

/** Breiten-Variante eines Brand-Assets (Datei + deskriptive Breite). */
export interface ImageVariant {
  /** Pfad ab Root, z. B. `/images/RonniX-640.webp`. */
  src: string;
  /** Intrinsische Breite der Variante in px (für `w`-Deskriptoren). */
  width: number;
}

/** Vollständig beschriebenes responsives Bild (Fallback + Varianten + Maße). */
export interface ResponsiveImageSpec {
  /** PNG-Fallback (alte Browser), z. B. `/images/RonniX.png`. */
  fallback: string;
  /** WebP in Originalgröße (größte Variante). */
  webp: string;
  /** Kleinere WebP-Varianten aufsteigend sortiert (für `srcset`). */
  variants: ImageVariant[];
  /** Intrinsische Maße des Originals (CLS: reserviert Ratio vor Load). */
  width: number;
  height: number;
  /** `sizes`-Hint je Einsatzort (muss zum CSS-Layout passen). */
  sizes: string;
}

/**
 * Baut einen `srcset`-String (`url w, url w, …`) inkl. Vollvariante.
 * @param spec Bild-Spec aus dieser Datei.
 * @returns `"…-640.webp 640w, …-1024.webp 1024w, ….webp 2192w"`.
 */
export function buildSrcSet(spec: ResponsiveImageSpec): string {
  const parts = spec.variants.map((v) => `${v.src} ${v.width}w`);
  parts.push(`${spec.webp} ${spec.width}w`);
  return parts.join(', ');
}

/**
 * Hero-LCP (2192×754, angezeigt max. ~896px im `max-w-4xl`-Container).
 * Varianten: 640 (Mobil) / 1024 (Desktop) / 1600 (große Screens) / voll.
 */
export const HERO_IMAGE: ResponsiveImageSpec = {
  fallback: '/images/RonniX.png',
  webp: '/images/RonniX.webp',
  variants: [
    { src: '/images/RonniX-640.webp', width: 640 },
    { src: '/images/RonniX-1024.webp', width: 1024 },
    { src: '/images/RonniX-1600.webp', width: 1600 },
  ],
  width: 2192,
  height: 754,
  sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 896px',
};

/**
 * Brand-Logo (891×838, angezeigt 149px Navbar / 80px Footer).
 * Varianten: 180 (≈2x Footer) / 360 (≈2x Navbar) / voll (Schema-Org-Logo).
 */
export const LOGO_IMAGE: ResponsiveImageSpec = {
  fallback: '/images/ronnix_logo.png',
  webp: '/images/ronnix_logo.webp',
  variants: [
    { src: '/images/ronnix_logo-180.webp', width: 180 },
    { src: '/images/ronnix_logo-360.webp', width: 360 },
  ],
  width: 891,
  height: 838,
  sizes: '(max-width: 768px) 149px, 180px',
};

/** OG-/Cover-Fallback je Sektor (WebP für In-App-Covers, PNG für `og:image`). */
export const COVER_WEBP_FALLBACK = '/images/preview.webp';
