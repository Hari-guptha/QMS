'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { AnimatePresence, motion } from 'framer-motion';

const languages = [
  { code: 'en' as const, name: 'English', nativeName: 'English', flag: '/lang/usa.svg' },
  { code: 'ar' as const, name: 'Arabic', nativeName: 'العربية', flag: '/lang/uae.svg' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode: typeof language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Language selector"
      >
        <img
          src={currentLanguage.flag}
          alt={currentLanguage.name}
          width={16}
          height={16}
          className="rounded-sm"
          loading="lazy"
          decoding="async"
        />
        <span className="text-sm font-medium">{currentLanguage.nativeName}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md p-1"
              style={{
                backgroundColor: 'var(--popover)',
                color: 'var(--popover-foreground)'
              }}
              role="menu"
              aria-orientation="vertical"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                    language === lang.code ? 'bg-muted font-semibold' : ''
                  }`}
                  role="menuitem"
                  tabIndex={-1}
                >
                  <img
                    src={lang.flag}
                    alt={lang.name}
                    width={16}
                    height={16}
                    className="rounded-sm"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="text-xs">{lang.nativeName}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

