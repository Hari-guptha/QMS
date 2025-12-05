import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyPrimaryColor, DEFAULT_PRIMARY_COLOR, COLOR_PRESETS } from './color-utils';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  primaryColor: string;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: string) => void;
  initTheme: () => void;
  initPrimaryColor: () => void;
  mounted: boolean;
  setMounted: (mounted: boolean) => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  const actualTheme = theme === 'system' ? getSystemTheme() : theme;
  
  root.classList.remove('light', 'dark');
  root.classList.add(actualTheme);
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      primaryColor: DEFAULT_PRIMARY_COLOR,
      mounted: false,
      
      setMounted: (mounted) => set({ mounted }),
      
      initTheme: () => {
        const { theme } = get();
        applyTheme(theme);
        
        // Listen for system theme changes if using system theme
        if (theme === 'system' && typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            applyTheme('system');
          };
          mediaQuery.addEventListener('change', handleChange);
        }
      },
      
      initPrimaryColor: () => {
        const { primaryColor } = get();
        applyPrimaryColor(primaryColor);
      },
      
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
        
        // Set up system theme listener if needed
        if (theme === 'system' && typeof window !== 'undefined') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = () => {
            applyTheme('system');
          };
          mediaQuery.addEventListener('change', handleChange);
        }
      },
      
      setPrimaryColor: (color) => {
        applyPrimaryColor(color);
        set({ primaryColor: color });
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        theme: state.theme,
        primaryColor: state.primaryColor,
      }),
    }
  )
);
