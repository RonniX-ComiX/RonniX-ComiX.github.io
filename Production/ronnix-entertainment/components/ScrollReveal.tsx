/**
 * ScrollReveal.tsx — Scroll-getriebene Eintritts-Inszenierung (Single Source).
 *
 * Feature: blendet Kinder per IntersectionObserver ein (einmalig, Fade-Up +
 * Ent-Blurren, 700 ms Spiel-Kurve) statt statischem Erscheinen. Benutzung:
 * `<ScrollReveal delay={100}>…</ScrollReveal>` um Sektions-Grids.
 * Gehört NICHT hierher: `window.scroll`-Listener (verboten — IO statt
 * Reflow-Loops), Hero-Intro (Session-Flag in `Hero.tsx`).
 */

import React, { useEffect, useRef, useState } from 'react';

export interface ScrollRevealProps {
  children: React.ReactNode;
  /** Extra-Klassen der Hülle. */
  className?: string;
  /** Staffel-Verzögerung in ms. */
  delay?: number;
}

/**
 * Hülle, die beim Einscrollen sanft einblendet (einmalig).
 * @param delay Staffelung in ms für Rhythmus.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition duration-700 ease-game ${
        visible
          ? 'opacity-100 translate-y-0 blur-0'
          : 'opacity-0 translate-y-8 blur-sm'
      } ${className}`}
    >
      {children}
    </div>
  );
};
