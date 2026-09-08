

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { navigation } from '../locales/navigation';
import { home } from '../locales/home';
import { authModal } from '../locales/auth';
import { legal } from '../locales/legal';

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

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Determine initial language with Priority: URL -> LocalStorage -> Browser -> Domain
  const getInitialLanguage = (): Language => {
    // 0. Check URL params (Highest Priority - used for Cross-Domain Handover)
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const langParam = params.get('lang');
        if (langParam === 'de' || langParam === 'en') {
            localStorage.setItem('ronnix-lang', langParam);
            return langParam;
        }
    }

    // 1. Check local storage (Persistence - remembers user choice)
    const savedLang = localStorage.getItem('ronnix-lang') as Language;
    if (savedLang === 'de' || savedLang === 'en') return savedLang;

    // 2. Check Browser Language (Auto-Detect)
    if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language;
        if (browserLang.startsWith('de')) return 'de';
    }

    // 3. Check Domain (Fallback)
    const hostname = window.location.hostname;
    if (hostname.endsWith('.de')) return 'de';
    if (hostname.endsWith('.com')) return 'en';
    
    // 4. Ultimate Fallback
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ronnix-lang', lang);
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