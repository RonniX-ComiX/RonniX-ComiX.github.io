/**
 * icons/Icon.tsx — Das RonniX-Icon-System (einzige Icon-Quelle, Lucide-Ersatz).
 *
 * Feature: 73 handgezeichnete Stroke-Glyphs (24×24, eine Familie, Standard-
 * Strichstärke 2 mit runden Kappen — chunky Comic-Look statt generischer
 * UI-Symbole). Ein Renderer (`<Icon name size className strokeWidth label />`)
 * für Tags, Strings als `IconName` für Wert-Positionen (Nav-Arrays, Toolbars).
 * Benutzung: `import { Icon } from './icons/Icon'` (bzw. `../`) + optional
 * `import type { IconName }`. Kein `lucide-react` mehr (AGENTS.md §10).
 * Warum EINE Datei für 73 Glyphs (statt 73 Dateien): ein Icon-Set ist eine
 * geschlossene Design-Sprache — aufsplitten würde Konsistenz (Strich, Grid,
 * Ecken) pro Datei duplizieren statt sichern. Gehört NICHT hierher:
 * Flaggen-Grafiken (lokal in `Navbar.tsx`), Logo-Assets (`public/images/`).
 */

import React from 'react';

export type IconName =
  | 'x' | 'menu' | 'home' | 'user' | 'users' | 'mail' | 'lock'
  | 'eye' | 'eye-off' | 'log-out' | 'calendar' | 'calendar-range' | 'clock'
  | 'newspaper' | 'palette' | 'book-open' | 'book' | 'gamepad' | 'film'
  | 'tv' | 'clapperboard' | 'trophy' | 'play-circle' | 'bold' | 'italic'
  | 'underline' | 'strikethrough' | 'align-left' | 'align-center'
  | 'align-right' | 'align-justify' | 'list' | 'list-ordered' | 'quote'
  | 'link' | 'image' | 'youtube' | 'undo' | 'redo' | 'remove-formatting'
  | 'heading-1' | 'heading-2' | 'save' | 'scale' | 'file-text'
  | 'alert-triangle' | 'alert-circle'
  | 'shield' | 'shield-alert' | 'check' | 'check-circle' | 'plus-circle'
  | 'rotate-ccw' | 'tag' | 'globe' | 'briefcase' | 'hash' | 'layers'
  | 'arrow-left' | 'edit' | 'trash' | 'search' | 'thumbs-up' | 'thumbs-down'
  | 'message-square' | 'share' | 'twitter' | 'facebook' | 'instagram'
  | 'send' | 'pen-tool' | 'corner-down-right' | 'reply' | 'loader';

const PATHS: Record<IconName, React.ReactNode> = {
  'x': <path d="M18 6 6 18M6 6l12 12" />,
  'menu': <path d="M4 6h16M4 12h16M4 18h16" />,
  'home': <><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>,
  'user': <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  'users': <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  'mail': <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  'lock': <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  'eye': <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  'eye-off': <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.16 3.19M6.61 6.61A17.5 17.5 0 0 0 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.39-.92" /><path d="m2 2 20 20" /></>,
  'log-out': <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  'calendar': <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  'calendar-range': <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><rect x="8" y="14" width="3" height="3" /><rect x="13" y="14" width="3" height="3" /></>,
  'clock': <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  'newspaper': <><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9" /><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" /></>,
  'palette': <><path d="M12 22a10 10 0 1 1 10-10c0 2.2-1.8 4-4 4h-2.2a2.3 2.3 0 0 0-1.7 3.8c.7.8.3 2.2-.9 2.2Z" /><circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" /><circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" /></>,
  'book-open': <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />,
  'book': <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />,
  'gamepad': <><path d="M17.3 5H6.7a4 4 0 0 0-4 3.6C2.6 9.4 2 14.5 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.4-1.4a2 2 0 0 1 1.4-.6h4.4a2 2 0 0 1 1.4.6L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.5-.6-6.6-.7-7.4a4 4 0 0 0-4-3.6Z" /><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01" /></>,
  'film': <><rect x="2" y="2" width="20" height="20" rx="2.2" /><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" /></>,
  'tv': <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="m17 2-5 5-5-5" /></>,
  'clapperboard': <><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" /><path d="m6.2 5.3 3.1 3.9M12.4 3.4l3.1 4" /><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></>,
  'trophy': <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.1.6 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
  'play-circle': <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" /></>,
  'bold': <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6zM6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />,
  'italic': <path d="M19 4h-9M14 20H5M15 4 9 20" />,
  'underline': <path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16" />,
  'strikethrough': <><path d="M16 4H9a3 3 0 0 0-2.8 4M14 12a4 4 0 0 1 0 8H6" /><path d="M4 12h16" /></>,
  'align-left': <path d="M3 6h18M3 12h12M3 18h15" />,
  'align-center': <path d="M3 6h18M6 12h12M4 18h16" />,
  'align-right': <path d="M3 6h18M9 12h12M6 18h15" />,
  'align-justify': <path d="M3 6h18M3 12h18M3 18h18" />,
  'list': <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  'list-ordered': <path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 .5-1.5 1-2 1-.8 1.5-1.5 1-3-.5-1.5-2-2-3-1" />,
  'quote': <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />,
  'link': <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>,
  'image': <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.5-3.5a2 2 0 0 0-3 0L6 20" /></>,
  'youtube': <><path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></>,
  'facebook': <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  'file-text': <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></>,
  'scale': <><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>,
  'instagram': <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  'twitter': <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />,
  'undo': <><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></>,
  'redo': <><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 15-6.7L21 13" /></>,
  'remove-formatting': <path d="M4 7V4h16v3M9 20h6M12 4v16" />,
  'heading-1': <><path d="M4 12h8M4 18V6M12 18V6" /><path d="M17 10v4h4M19 10v6" /></>,
  'heading-2': <><path d="M4 12h8M4 18V6M12 18V6" /><path d="M21 18h-4a2 2 0 1 0 0-4h3a2 2 0 1 0 0-4h-3v6" /></>,
  'save': <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>,
  'alert-triangle': <><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" /><path d="M12 9v4M12 17h.01" /></>,
  'alert-circle': <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>,
  'shield': <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  'shield-alert': <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4M12 16h.01" /></>,
  'check': <path d="M20 6 9 17l-5-5" />,
  'check-circle': <><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></>,
  'plus-circle': <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
  'rotate-ccw': <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  'tag': <><path d="M12 2H2v10l9.3 9.3a2 2 0 0 0 2.8 0l7.2-7.2a2 2 0 0 0 0-2.8Z" /><path d="M7 7h.01" /></>,
  'globe': <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></>,
  'briefcase': <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  'hash': <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />,
  'layers': <><path d="m12 2 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
  'arrow-left': <path d="M19 12H5M12 19l-7-7 7-7" />,
  'search': <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  'edit': <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  'pen-tool': <><path d="m12 19 7-7 3 3-7 7-3-3z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.6 7.6" /><circle cx="11" cy="11" r="2" /></>,
  'trash': <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></>,
  'thumbs-up': <path d="M7 10v12M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z" />,
  'thumbs-down': <path d="M17 14V2M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z" />,
  'message-square': <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  'share': <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  'send': <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>,
  'corner-down-right': <><path d="m15 10 5 5-5 5" /><path d="M4 4v7a4 4 0 0 0 4 4h12" /></>,
  'reply': <><path d="M20 18v-2a4 4 0 0 0-4-4H4" /><path d="m9 17-5-5 5-5" /></>,
  'loader': <path d="M21 12a9 9 0 1 1-6.2-8.6" />,
};

export interface IconProps {
  /** Glyphen-Name aus dem Set (autocomplete-fähig). */
  name: IconName;
  /** Kantenlänge in px (Default 24). */
  size?: number;
  /** Zusatzklassen (Farben, `animate-spin` für `loader`, Hover). */
  className?: string;
  /** Strichstärke, global Standard 2 (chunky). */
  strokeWidth?: number;
  /** Accessible Name (Default = `name`). */
  label?: string;
}

/**
 * Rendert eine Glyphe als Inline-SVG (erbt `currentColor`).
 * @param name Glyphe aus `IconName`.
 * @param size Kantenlänge in px, Default 24.
 * @param className Zusatzklassen.
 * @param strokeWidth Strichstärke, Default 2.
 * @param label Accessible Name für Screenreader.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className,
  strokeWidth = 2,
  label,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role="img"
    aria-label={label ?? name}
  >
    {PATHS[name]}
  </svg>
);
