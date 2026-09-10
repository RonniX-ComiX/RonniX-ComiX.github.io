/**
 * ResponsiveImage.tsx — WebP-`<picture>` mit PNG-Fallback und srcset.
 *
 * Feature: rendert `<picture>` (WebP-`<source>` mit `srcset`/`sizes` +
 * PNG-`<img>`-Fallback) aus einer `ResponsiveImageSpec`
 * (`utils/imageConfig.ts`). LCP-Modus (`priority`): `fetchPriority="high"`
 * + `loading="eager"`, sonst `lazy` + `async`-Decoding. Intrinsische
 * `width`/`height` reservieren die Ratio (CLS-Schutz). Benutzung: Hero-LCP,
 * Navbar-/Footer-Logo. Gehört NICHT hierher: externe Firestore-Cover
 * (kein srcset möglich, direkt `<img>`).
 */

import React from 'react';
import { buildSrcSet, type ResponsiveImageSpec } from '../utils/imageConfig';
import { versionedAssetUrl } from '../utils/appConfig';

interface ResponsiveImageProps {
  /** Bild-Spec (Fallback, Varianten, Maße, sizes). */
  spec: ResponsiveImageSpec;
  /** Alternativer Text (Pflicht, A11y/SEO). */
  alt: string;
  /** True nur für das LCP-Bild der Seite (genau einmal verwenden). */
  priority?: boolean;
  /** Zusätzliche Klassen für das `<img>` (Layout beim Aufrufer). */
  className?: string;
}

/**
 * Responsives Brand-Bild mit WebP-srcset und PNG-Fallback.
 * @param spec Zentrale Spec (Pfade, Breiten, Maße).
 * @param alt Alt-Text (leer nie erlaubt — Deko nutzt `aria-hidden` außen).
 * @param priority LCP-Bild: eager + hohe Priorität, sonst lazy.
 * @param className CSS-Klassen für das innere `<img>`.
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  spec,
  alt,
  priority = false,
  className,
}) => {
  return (
    <picture>
      <source
        type="image/webp"
        srcSet={buildSrcSet(spec)}
        sizes={spec.sizes}
      />
      <img
        src={versionedAssetUrl(spec.fallback)}
        alt={alt}
        width={spec.width}
        height={spec.height}
        fetchPriority={priority ? 'high' : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        className={className}
      />
    </picture>
  );
};
