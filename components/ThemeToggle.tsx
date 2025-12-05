'use client';

import { useTheme } from 'next-themes';
import { useThemeStore } from '@/lib/theme-store';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { setTheme: setStoreTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-secondary hover:bg-accent transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="w-5 h-5" />
      </button>
    );
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setStoreTheme(newTheme);
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary border border-border">
        <button
          onClick={() => handleThemeChange('light')}
          className={`p-2 rounded-md transition-all ${
            theme === 'light'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          aria-label="Light mode"
          title="Light mode"
        >
          <Sun className={`w-4 h-4 transition-transform ${
            theme === 'light' ? 'scale-100 rotate-0' : 'scale-0 -rotate-90'
          }`} />
        </button>
        <button
          onClick={() => handleThemeChange('dark')}
          className={`p-2 rounded-md transition-all ${
            theme === 'dark'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          aria-label="Dark mode"
          title="Dark mode"
        >
          <Moon className={`w-4 h-4 transition-transform ${
            theme === 'dark' ? 'scale-100 rotate-0' : 'scale-0 rotate-90'
          }`} />
        </button>
        <button
          onClick={() => handleThemeChange('system')}
          className={`p-2 rounded-md transition-all ${
            theme === 'system'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          aria-label="System mode"
          title="Follow system preference"
        >
          <Monitor className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
