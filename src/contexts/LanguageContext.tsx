import React, { createContext, useContext, useState, useEffect } from 'react';
import { ar } from '../locales/ar';
import { fr } from '../locales/fr';
import { en } from '../locales/en';

type Language = 'ar' | 'fr' | 'en';
type Translations = Record<string, string>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  tx: (ar: any, fr: any, en?: any) => any;
  dir: 'rtl' | 'ltr';
}

const translations: Record<Language, Translations> = {
  ar,
  fr,
  en,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLg = localStorage.getItem('language');
    return (savedLg as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const tx = (ar: any, fr: any, en?: any): any => {
    if (language === 'ar') return ar;
    if (language === 'en') return en || fr || ar;
    return fr || ar;
  };

  useEffect(() => {
    document.documentElement.dir = tx('rtl', 'ltr', "ltr");
    document.documentElement.lang = language;
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tx, dir: tx('rtl', 'ltr', "ltr") }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
