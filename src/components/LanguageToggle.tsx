'use client';

import { useLanguage } from '@/providers/LanguageProvider';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLang = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  return (
    <button
      onClick={toggleLang}
      className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 transition-colors"
    >
      {language.toUpperCase()}
    </button>
  );
}
