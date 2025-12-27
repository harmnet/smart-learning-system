"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { zh, Translations } from '../locales/zh';
import { en } from '../locales/en';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');
  const [t, setT] = useState<Translations>(zh);

  useEffect(() => {
    // Try to get language from localStorage
    const storedLang = localStorage.getItem('app_language') as Language;
    if (storedLang && (storedLang === 'zh' || storedLang === 'en')) {
      setLanguageState(storedLang);
      setT(storedLang === 'zh' ? zh : en);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setT(lang === 'zh' ? zh : en);
    localStorage.setItem('app_language', lang);
    // Optional: Set html lang attribute
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

