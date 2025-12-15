'use client';

import { useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

function ThemeInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize theme and primary color on mount
    if (typeof window !== 'undefined') {
      const { useThemeStore } = require('@/lib/theme-store');
      const store = useThemeStore.getState();
      store.initTheme();
      store.initPrimaryColor();
      store.setMounted(true);
    }
  }, []);

  return <>{children}</>;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeInitializer>{children}</ThemeInitializer>
    </NextThemesProvider>
  );
}
