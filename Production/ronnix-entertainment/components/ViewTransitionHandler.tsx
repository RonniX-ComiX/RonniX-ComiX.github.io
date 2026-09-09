/**
 * ViewTransitionHandler.tsx — Warp-Wipe für Same-Origin-Routenwechsel (SPA).
 *
 * Feature: React Router navigiert same-document (keine nativen Cross-Document
 * Transitions) — darum fängt dieser Handler interne Link-Klicks in der Capture-Phase
 * ab und wickelt sie in `document.startViewTransition()` (Wipe via `::view-transition`
 * in `index.css`). Fallbacks: ohne API, Modifier-Klicks,
 * `target/_blank`, `download` und externen URLs läuft alles nativ/instant weiter.
 * Browser-Zurück (Popstate) bleibt instant (Limitation, dokumentiert).
 * Use Cases: alle internen `<a href="/…">`/`<Link>`-Klicks. Benutzung: einmalig im
 * `<Router>` mounten (`<ViewTransitionHandler />`). Gehört NICHT hierher:
 * Cross-Origin-Wechsel (WarpScreen), Scroll-Verhalten (`ScrollToTop`).
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type DocumentWithVT = Document & {
  startViewTransition?: (callback: () => void) => void;
};

/**
 * Mountet den Capture-Listener für interne Navigation mit Warp-Wipe.
 */
export const ViewTransitionHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.getAttribute('rel')?.split(/\s+/).includes('external')) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      // Reiner Hash-Sprung auf derselben Seite: nativ laufen lassen.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const startVT = (document as DocumentWithVT).startViewTransition?.bind(document);
      if (typeof startVT !== 'function') return; // nativ/instant
      event.preventDefault();
      startVT(() => {
        navigate(`${url.pathname}${url.search}${url.hash}`, { replace: false });
      });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate]);

  return null;
};
