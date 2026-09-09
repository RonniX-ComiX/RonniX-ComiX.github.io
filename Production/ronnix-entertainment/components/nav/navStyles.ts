/**
 * nav/navStyles.ts — Sektor-Farbwelt der Navigation (Single Source).
 *
 * Feature: mappt Routen auf Tailwind-Farbklassen (Text/Hover/Icon/Underline/
 * Glow): Main/News/Kontakt pink, ComiX rot, BooX blau, GameZ grün, MovieZ
 * gelb, SerieZ orange. Reine Funktion, kein State. Benutzung:
 * `getNavStyle(href)` in `Navbar.tsx` + `MobileDrawer.tsx`.
 * Gehört NICHT hierher: Link-Aufbau (`utils/domainConfig.ts`), Icons
 * (`icons/Icon.tsx`).
 */

export interface NavLinkStyles {
  activeText: string;
  hoverText: string;
  activeIcon: string;
  hoverIcon: string;
  underline: string;
  shadow: string;
}

/** Sektor-Farben je Route (ophil: eine Farbe pro Welt, konsistent mit Cards). */
export const getNavStyle = (href: string): NavLinkStyles => {
    switch (href) {
      case '/':
      case '/news':
      case '/contact':
        return {
          activeText: 'text-pink-500',
          hoverText: 'group-hover:text-pink-500',
          activeIcon: 'text-pink-500 rotate-12',
          hoverIcon: 'group-hover:text-pink-500',
          underline: 'bg-pink-500',
          shadow: 'shadow-[0_0_10px_rgba(236,72,153,0.8)]'
        };
      case '/comix':
        return {
          activeText: 'text-red-500',
          hoverText: 'group-hover:text-red-500',
          activeIcon: 'text-red-500 rotate-12',
          hoverIcon: 'group-hover:text-red-500',
          underline: 'bg-red-600',
          shadow: 'shadow-[0_0_10px_rgba(220,38,38,0.8)]'
        };
      case '/boox':
        return {
          activeText: 'text-blue-500',
          hoverText: 'group-hover:text-blue-500',
          activeIcon: 'text-blue-500 rotate-12',
          hoverIcon: 'group-hover:text-blue-500',
          underline: 'bg-blue-600',
          shadow: 'shadow-[0_0_10px_rgba(37,99,235,0.8)]'
        };
      case '/gamez':
        return {
          activeText: 'text-green-500',
          hoverText: 'group-hover:text-green-500',
          activeIcon: 'text-green-500 rotate-12',
          hoverIcon: 'group-hover:text-green-500',
          underline: 'bg-green-600',
          shadow: 'shadow-[0_0_10px_rgba(22,163,74,0.8)]'
        };
      case '/moviez':
        return {
          activeText: 'text-yellow-400',
          hoverText: 'group-hover:text-yellow-400',
          activeIcon: 'text-yellow-400 rotate-12',
          hoverIcon: 'group-hover:text-yellow-400',
          underline: 'bg-yellow-400',
          shadow: 'shadow-[0_0_10px_rgba(250,204,21,0.8)]'
        };
      case '/seriez':
        return {
          activeText: 'text-orange-500',
          hoverText: 'group-hover:text-orange-500',
          activeIcon: 'text-orange-500 rotate-12',
          hoverIcon: 'group-hover:text-orange-500',
          underline: 'bg-orange-500',
          shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.8)]'
        };
      default:
        return {
          activeText: 'text-white',
          hoverText: 'group-hover:text-white',
          activeIcon: 'text-white',
          hoverIcon: 'group-hover:text-white',
          underline: 'bg-white',
          shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.8)]'
        };
    }
  };
