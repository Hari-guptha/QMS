'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { auth, User } from '@/lib/auth';
import { User as UserIcon, ChevronDown, LogOut, UserCircle, Palette, Lock, Moon, Bell, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';

export function Navbar() {
  const { t } = useI18n();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setUser(auth.getUser());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    };

    if (isDropdownOpen || isThemeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isThemeDropdownOpen]);

  const handleSignOut = () => {
    setIsDropdownOpen(false);
    auth.logout();
    router.push('/');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setIsThemeDropdownOpen(false);
  };

  const getUserInitials = (user: User) => {
    const first = user.firstName?.charAt(0).toUpperCase() || '';
    const last = user.lastName?.charAt(0).toUpperCase() || '';
    return first + last || 'U';
  };

  if (!user) return null;

  const getRoleDisplay = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getDashboardPath = () => {
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'agent') return '/agent/dashboard';
    return '/';
  };

  return (
    <nav className="bg-card text-card-foreground border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a
              href={getDashboardPath()}
              className="text-xl font-bold text-foreground hover:text-primary transition-colors"
            >
              {t('nav.queueManagement')}
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            {mounted && (
              <div className="relative" ref={themeDropdownRef}>
                <button
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isThemeDropdownOpen}
                  aria-label="Toggle theme"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                  <Moon className="h-[1.2rem] w-[1.2rem] absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </button>

                <AnimatePresence>
                  {isThemeDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsThemeDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute end-0 mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md p-1"
                        style={{
                          backgroundColor: 'var(--popover)',
                          color: 'var(--popover-foreground)'
                        }}
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <button
                          onClick={() => handleThemeChange('light')}
                          className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${theme === 'light' ? 'bg-accent text-accent-foreground' : ''
                            }`}
                          role="menuitem"
                          tabIndex={-1}
                        >
                          {t('settings.appearance.light')}
                        </button>
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${theme === 'dark' ? 'bg-accent text-accent-foreground' : ''
                            }`}
                          role="menuitem"
                          tabIndex={-1}
                        >
                          {t('settings.appearance.dark')}
                        </button>
                        <button
                          onClick={() => handleThemeChange('system')}
                          className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${theme === 'system' ? 'bg-accent text-accent-foreground' : ''
                            }`}
                          role="menuitem"
                          tabIndex={-1}
                        >
                          {t('settings.appearance.system')}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Notifications */}
            <button
              className="p-2 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {/* Optional notification badge */}
              {/* <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span> */}
            </button>

            {/* User Avatar/Profile */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold hover:opacity-90 transition-opacity"
                aria-label="User menu"
              >
                {getUserInitials(user)}
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute end-0 mt-2 z-50 w-56 shadow-lg rounded-lg border overflow-hidden p-0"
                      style={{
                        backgroundColor: 'var(--popover)',
                        color: 'var(--popover-foreground)'
                      }}
                      role="menu"
                      aria-orientation="vertical"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-4 flex flex-col gap-2 bg-gradient-to-r from-primary/5 to-primary/0 rounded-t-lg">
                        <span className="text-center text-xs uppercase text-primary font-medium tracking-wide">
                          {getRoleDisplay(user.role)} {t('nav.account')}
                        </span>
                        <span className="text-base font-semibold text-foreground truncate">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>

                      {/* Separator */}
                      <div className="bg-border -mx-1 my-1 h-px" role="separator" aria-orientation="horizontal" />

                      {/* Menu Items */}
                      <div className="p-2">
                        <a
                          href="/settings/account"
                          className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors"
                          role="menuitem"
                          tabIndex={-1}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <span className="w-full text-left">{t('nav.myAccount')}</span>
                        </a>
                        <a
                          href="/settings/appearance"
                          className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors"
                          role="menuitem"
                          tabIndex={-1}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <span className="w-full text-left">{t('nav.themeLayout')}</span>
                        </a>
                        <a
                          href="/settings/password"
                          className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors"
                          role="menuitem"
                          tabIndex={-1}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <span className="w-full text-left">{t('nav.updatePassword')}</span>
                        </a>
                        <button
                          onClick={handleSignOut}
                          className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors text-red-600"
                          role="menuitem"
                          tabIndex={-1}
                        >
                          <span className="w-full text-left">{t('nav.signOut')}</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

