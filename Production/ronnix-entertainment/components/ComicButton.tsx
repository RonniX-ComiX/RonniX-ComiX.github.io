/**
 * ComicButton.tsx — Die EINE Button-Sprache (Skew-Pill-System, Single Source).
 *
 * Feature: Comic-Button (skew `-10deg`, Hover `-5deg`, harter Offset-Schatten,
 * Druck-Feedback `active:scale`) als `<Link>` (`to`), `<a>` (`href`) oder
 * `<button>` (`type`/`onClick`/`disabled`). Text/Icon laufen im Counter-Skew-
 * Wrapper (lesbar trotz Schräglage). Farbe via `tone` (Default Rot, Sektoren
 * für QuickNav), Größe/Padding via `className`. Benutzung: alle primären CTAs
 * (Navbar-Login, Hero, Danke, Kontakt, QuickNav). Gehört NICHT hierher:
 * Formular-/Admin-Kleinbuttons (dezentes `rounded-lg`), Icons (`icons/Icon`).
 */

import React from 'react';
import { Link } from 'react-router-dom';

/** Standard-Ton: Rot (alle primären CTAs außer Sektor-Buttons). */
export const COMIC_BUTTON_RED = 'bg-red-700 hover:bg-red-600 border-red-500 text-white';

export interface ComicButtonProps {
  /** Internes Ziel (rendert `<Link>`). */
  to?: string;
  /** Externes Ziel (rendert `<a>`). */
  href?: string;
  target?: string;
  rel?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  title?: string;
  /** Farb-Ton (Default Rot). */
  tone?: string;
  /** Größe/Padding/Extras (z. B. `px-8 py-3 text-xl w-full md:w-auto`). */
  className?: string;
  children: React.ReactNode;
}

/**
 * Einheitlicher Comic-CTA in drei Render-Formen.
 * @param to Internes Ziel (Link).
 * @param href Externes Ziel (Anchor).
 * @param tone Farbklassen, Default Rot.
 * @param className Größen-/Layout-Klassen (Pflicht für Padding/Textgröße).
 */
export const ComicButton: React.FC<ComicButtonProps> = ({
  to,
  href,
  target,
  rel,
  type = 'button',
  disabled = false,
  onClick,
  title,
  tone = COMIC_BUTTON_RED,
  className = 'px-6 py-2.5 text-lg',
  children,
}) => {
  const cls = `inline-flex font-retro tracking-wider rounded-sm transform skew-x-[-10deg] hover:skew-x-[-5deg] transition duration-300 ease-game shadow-[4px_4px_0_rgba(0,0,0,0.5)] hover:shadow-[2px_2px_0_rgba(0,0,0,0.5)] border active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${tone} ${className}`;
  const inner = (
    <span className="flex items-center justify-center gap-2 skew-x-[10deg] hover:skew-x-[5deg] transition-transform">
      {children}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick} title={title}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={cls} onClick={onClick} title={title}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} disabled={disabled} className={cls} onClick={onClick} title={title}>
      {inner}
    </button>
  );
};
