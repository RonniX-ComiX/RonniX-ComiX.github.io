/**
 * nav/Flags.tsx — Comic-Style-Sprachflaggen (DE/EN als Inline-SVG).
 *
 * Feature: zwei winzige, stilisierte Flaggen im Comic-Look (dicker Stil,
 * keine Fotorealistik), wiederverwendet im Desktop- und Mobil-Switcher.
 * Benutzung: `<FlagDE className />` / `<FlagEN className />`.
 * Gehört NICHT hierher: Switch-Logik (Navbar/MobileDrawer), Icons
 * (`icons/Icon.tsx`).
 */

import React from 'react';

// Comic-Style SVG Flags
export const FlagDE = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 5 3" className={className} role="img" aria-label="Deutsch" preserveAspectRatio="none">
    <rect width="5" height="3" fill="#000"/>
    <rect y="1" width="5" height="2" fill="#D00"/>
    <rect y="2" width="5" height="1" fill="#FFCE00"/>
  </svg>
);

export const FlagEN = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 60 30" className={className} role="img" aria-label="English" preserveAspectRatio="none">
    <rect width="60" height="30" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);
