import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, TranslationKey, getTranslation, getTranslationWithParams, SUPPORTED_LANGUAGES } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  tp: (key: TranslationKey, params: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'mumu_display_language';

// Detect browser language and map to our supported languages
function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('zh-cn') || browserLang === 'zh-hans') {
    return 'Simplified Chinese';
  }
  if (browserLang.startsWith('zh') || browserLang === 'zh-hant') {
    return 'Traditional Chinese';
  }
  if (browserLang.startsWith('es')) return 'Spanish';
  if (browserLang.startsWith('fr')) return 'French';
  if (browserLang.startsWith('de')) return 'German';
  if (browserLang.startsWith('ja')) return 'Japanese';
  if (browserLang.startsWith('ko')) return 'Korean';
  if (browserLang.startsWith('pt')) return 'Portuguese';
  if (browserLang.startsWith('it')) return 'Italian';
  
  return 'English';
}

interface LanguageProviderProps {
  children: React.ReactNode;
  // Optional: sync with external preference (from usePreferences)
  externalLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

export function LanguageProvider({ 
  children, 
  externalLanguage,
  onLanguageChange 
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('English');
  const [isLoading, setIsLoading] = useState(true);

  // Load language on mount
  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      setLanguageState(stored as Language);
    } else if (externalLanguage && SUPPORTED_LANGUAGES.some(l => l.code === externalLanguage)) {
      setLanguageState(externalLanguage as Language);
    } else {
      // Auto-detect browser language
      const detected = detectBrowserLanguage();
      setLanguageState(detected);
    }
    setIsLoading(false);
  }, []);

  // Sync with external preference changes
  useEffect(() => {
    if (externalLanguage && SUPPORTED_LANGUAGES.some(l => l.code === externalLanguage)) {
      setLanguageState(externalLanguage as Language);
    }
  }, [externalLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    
    // Notify external handler (for syncing with preferences)
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const t = (key: TranslationKey): string => {
    return getTranslation(language, key);
  };

  const tp = (key: TranslationKey, params: Record<string, string | number>): string => {
    return getTranslationWithParams(language, key, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tp, isLoading }}>
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
