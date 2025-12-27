"use client";

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-neutral-100 rounded-lg p-1 border border-neutral-200">
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          language === 'zh'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
      >
        中文
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          language === 'en'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
      >
        EN
      </button>
    </div>
  );
}

