/**
 * LanguageContext.tsx — Sprachzustand (de/en) mit Handover-Logik.
 *
 * Feature: löst die Sprache mit Priorität Pfad (`/en/...`) → URL-Param
 * (`?lang=`, Cross-Domain-Handover) → `localStorage ronnix-lang` → Browser →
 * Domain-Endung auf, persistiert die Wahl und synct sie über Tabs
 * (`storage`-Event). `App.tsx` (`LanguageParamSynchronizer`) konsumiert
 * `?lang=` einmalig in stabile `/en/`-Pfade. Benutzung: `useLanguage()`
 * (`language`, `setLanguage`, `t`). Gehört NICHT hierher: Routen-Definition
 * (`App.tsx`), hreflang/Canonicals (`components/SEO.tsx`).
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { navigation } from '../locales/navigation';
import { home } from '../locales/home';
import { authModal } from '../locales/auth';
import { legal } from '../locales/legal';
import { stripLangPrefix } from '../utils/domainConfig';

type Language = 'de' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: {
    navigation: typeof navigation.de;
    home: typeof home.de;
    authModal: typeof authModal.de;
    legal: typeof legal.de;
  };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Optionale Variante ohne Throw — für Komponenten, die auch ohne Provider
 * rendern müssen (SEO-Shell, Prerender). Fällt auf DE + DE-Wörterbuch zurück.
 * Unbedingt aufrufen (kein try/catch um Hooks): Hook-Reihenfolge bleibt stabil.
 */
export const useLanguageOptional = () => {
  const context = useContext(LanguageContext);
  if (context) return context;
  return {
    language: 'de' as Language,
    setLanguage: (_lang: Language) => {},
    t: {
      navigation: navigation.de,
      home: home.de,
      authModal: authModal.de,
      legal: legal.de,
    },
  };
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Determine initial language with Priority: Path (/en/...) -> URL param (?lang=, Cross-Domain Handover) -> LocalStorage -> Browser -> Domain
  const getInitialLanguage = (): Language => {
    if (typeof window === 'undefined') return 'de';

    // 0. Stabile Pfadsprache (`/en/...` gewinnt immer — indexierbare EN-URL)
    const pathLang = stripLangPrefix(window.location.pathname).lang;
    if (pathLang === 'de' || pathLang === 'en') {
        try { localStorage.setItem('ronnix-lang', pathLang); } catch {}
        return pathLang;
    }

    // 1. Check URL params (Cross-Domain Handover — wird in stabile Pfade konsumiert)
    try {
        const params = new URLSearchParams(window.location.search);
        const langParam = params.get('lang');
        if (langParam === 'de' || langParam === 'en') {
            localStorage.setItem('ronnix-lang', langParam);
            return langParam;
        }
    } catch {}

    // 2. Check local storage (Persistence - remembers user choice)
    try {
        const savedLang = localStorage.getItem('ronnix-lang') as Language;
        if (savedLang === 'de' || savedLang === 'en') return savedLang;
    } catch {}

    // 3. Check Browser Language (Auto-Detect)
    if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language;
        if (browserLang.startsWith('de')) return 'de';
    }

    // 4. Check Domain (Fallback)
    try {
        const hostname = window.location.hostname;
        if (hostname.endsWith('.de')) return 'de';
        if (hostname.endsWith('.com')) return 'en';
    } catch {}

    // 5. Ultimate Fallback
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem('ronnix-lang', lang); } catch {}
  };

  // NEW: Sync across tabs
  // If the user changes language in one tab, other tabs of the same domain will update immediately.
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ronnix-lang' && (e.newValue === 'de' || e.newValue === 'en')) {
        setLanguageState(e.newValue as Language);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Combine locales
  const dictionaries = {
    de: {
      navigation: navigation.de,
      home: home.de,
      authModal: authModal.de,
      legal: legal.de,
    },
    en: {
      navigation: navigation.en,
      home: home.en,
      authModal: authModal.en,
      legal: legal.en,
    }
  };

  const value = {
    language,
    setLanguage,
    t: dictionaries[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};