'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/theme-store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { initTheme, theme } = useThemeStore();

  useEffect(() => {
    // Initialize theme on mount
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    // Apply theme class to document root when theme changes
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}

