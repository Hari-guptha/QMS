'use client';

import { useTheme } from 'next-themes';
import { useThemeStore } from '@/lib/theme-store';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';

export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const { setTheme: setStoreTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
        aria-label={t('theme.toggleTheme')}
      >
        <Sun className="w-5 h-5" />
      </button>
    );
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setStoreTheme(newTheme);
    setShowMenu(false);
  };

  const getCurrentThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getCurrentThemeLabel = () => {
    if (theme === 'light') return t('theme.light');
    if (theme === 'dark') return t('theme.dark');
    return t('theme.system');
  };

  return (
    <div className="relative inline-block">
      {/* Main Toggle Button - Shows only active theme */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-lg bg-secondary border border-border hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
        aria-label={t('theme.toggleTheme')}
        title={`${t('theme.currentTheme')}: ${getCurrentThemeLabel()}`}
      >
        {getCurrentThemeIcon()}
        <span className="text-sm font-medium hidden sm:inline">{getCurrentThemeLabel()}</span>
      </button>

      {/* Dropdown Menu - Shows all options when clicked */}
      {showMenu && (
        <>
          {/* Backdrop to close menu on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-card border rounded-xl shadow-lg overflow-hidden z-50">
            <div className="p-1">
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${
                  theme === 'light'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                aria-label={t('theme.lightMode')}
              >
                <Sun className="w-4 h-4" />
                <span>{t('theme.light')}</span>
                {theme === 'light' && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                aria-label={t('theme.darkMode')}
              >
                <Moon className="w-4 h-4" />
                <span>{t('theme.dark')}</span>
                {theme === 'dark' && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${
                  theme === 'system'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                aria-label={t('theme.systemMode')}
              >
                <Monitor className="w-4 h-4" />
                <span>{t('theme.system')}</span>
                {theme === 'system' && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
