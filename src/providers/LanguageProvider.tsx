'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ko, TranslationKey } from '@/locales/ko';
import { en } from '@/locales/en';

type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const dictionaries = { ko, en };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. 브라우저 저장소에서 언어 가져오기
    const saved = localStorage.getItem('app_language') as Language;
    if (saved && (saved === 'ko' || saved === 'en')) {
      setLanguageState(saved);
    } else {
      // 2. 저장된 언어가 없으면 브라우저 기본 언어 감지
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('en')) {
        setLanguageState('en');
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let str = dictionaries[language][key] || dictionaries.ko[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        str = str.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return str;
  };

  // SSR Hydration 방지를 위해 mounted 된 이후 렌더링하도록 처리 (가벼운 MVP이므로 허용)
  // 부드러운 전환을 위해 children 자체는 렌더링하되, 서버와 클라이언트가 동일한 초기값(ko)을 갖게 함
  // 클라이언트에서 mount 된 이후에 언어가 변경되면 다시 렌더링
  
  const contextValue = {
    language: mounted ? language : 'ko', // 서버 렌더링 시 무조건 ko로 렌더링하여 Hydration 에러 방지
    setLanguage,
    t: (key: TranslationKey, params?: Record<string, string | number>) => {
      // 서버/초기 렌더링에서는 무조건 한국어 반환
      const langToUse = mounted ? language : 'ko';
      let str = dictionaries[langToUse][key] || dictionaries.ko[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          str = str.replace(`{${paramKey}}`, String(paramValue));
        });
      }
      return str;
    }
  };

  return (
    <LanguageContext.Provider value={contextValue}>
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
