'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useThemeStore } from '@/lib/theme-store';
import { auth, User } from '@/lib/auth';
import { Bell, Moon, Sun, Menu, User as UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { adminApi } from '@/lib/api';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: 'admin' | 'agent';
}

export function DashboardLayout({ children, navItems, role }: DashboardLayoutProps) {
  const { t, dir } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { setTheme: setStoreTheme } = useThemeStore();
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [appSettings, setAppSettings] = useState<{ appName: string; logoUrl: string | null; showLogo: boolean } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setUser(auth.getUser());
    
    const loadAppSettings = async () => {
      try {
        const res = await adminApi.getApplicationSettings();
        setAppSettings(res.data);
      } catch (err) {
        setAppSettings({
          appName: 'Queue Management System',
          logoUrl: null,
          showLogo: false,
        });
      }
    };
    
    loadAppSettings();
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

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setStoreTheme(newTheme);
    setIsThemeDropdownOpen(false);

    if (auth.isAuthenticated()) {
      try {
        const { authApi } = await import('@/lib/api');
        await authApi.updateProfile({ theme: newTheme });
        const currentUser = auth.getUser();
        if (currentUser) {
          localStorage.setItem('user', JSON.stringify({ ...currentUser, theme: newTheme }));
          setUser({ ...currentUser, theme: newTheme });
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  const getUserInitials = (user: User) => {
    const first = user.firstName?.charAt(0).toUpperCase() || '';
    const last = user.lastName?.charAt(0).toUpperCase() || '';
    return first + last || 'U';
  };

  if (!user) return null;

  const getDashboardPath = () => {
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'agent') return '/agent/dashboard';
    return '/';
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop Only */}
      <aside className="w-12 bg-secondary h-screen border-r border-border/40 px-1 flex flex-col items-center max-xl:hidden">
        <div className="border-b py-4 w-full">
          <div className="flex items-center space-x-2 font-semibold text-lg text-primary justify-center">
            <Link href={getDashboardPath()} className="flex items-center space-x-2">
              {appSettings?.showLogo && appSettings?.logoUrl ? (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                  <img
                    alt="Logo"
                    loading="lazy"
                    width={24}
                    height={24}
                    className="object-contain"
                    src={appSettings.logoUrl}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                  <span className="text-primary text-xs font-bold">
                    {appSettings?.appName?.charAt(0) || 'Q'}
                  </span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        data-slot="sidebar-inset"
        className="bg-background relative flex w-full flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2"
      >
        {/* Header */}
        <header className="top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur flex flex-between h-16 px-4 justify-end">
          {/* Mobile Logo and Title */}
          <div className="xl:hidden flex items-center gap-2 flex-1">
            <div className="flex items-center space-x-2 font-semibold text-lg text-primary">
              <Link href={getDashboardPath()} className="flex items-center space-x-2">
                {appSettings?.showLogo && appSettings?.logoUrl ? (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    <img
                      alt="Logo"
                      loading="lazy"
                      width={24}
                      height={24}
                      className="object-contain"
                      src={appSettings.logoUrl}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
                    <span className="text-primary text-xs font-bold">
                      {appSettings?.appName?.charAt(0) || 'Q'}
                    </span>
                  </div>
                )}
              </Link>
            </div>
            <p className="text-sm font-medium text-foreground truncate">
              {appSettings?.appName || t('nav.queueManagement')}
            </p>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center relative flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <div key={item.href} className="relative flex flex-col items-center px-1">
                  <div
                    className={`flex text-nowrap group w-auto items-center justify-center px-4 py-2 rounded-md md:form-normal font-normal transition-colors duration-200 cursor-pointer text-[14px] ${
                      active
                        ? 'bg-primary text-white shadow-lg'
                        : 'dark:text-white text-foreground hover:bg-muted'
                    }`}
                  >
                    <Link href={item.href} className="flex items-center">
                      <Icon className="size-5 mr-2" aria-hidden="true" />
                      <span className="overflow-hidden" style={{ width: 'auto', opacity: 1 }}>
                        {item.label}
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            {mounted && (
              <div className="relative ml-2" ref={themeDropdownRef}>
                <button
                  onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-9 rounded-full"
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
                          className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                            theme === 'light' ? 'bg-accent text-accent-foreground' : ''
                          }`}
                          role="menuitem"
                          tabIndex={-1}
                        >
                          {t('settings.appearance.light')}
                        </button>
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                            theme === 'dark' ? 'bg-accent text-accent-foreground' : ''
                          }`}
                          role="menuitem"
                          tabIndex={-1}
                        >
                          {t('settings.appearance.dark')}
                        </button>
                        <button
                          onClick={() => handleThemeChange('system')}
                          className={`relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                            theme === 'system' ? 'bg-accent text-accent-foreground' : ''
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
              className="p-1 rounded-md hover:bg-muted transition-colors ml-2"
              aria-label="Notifications"
            >
              <Bell className="text-xl cursor-pointer text-muted-foreground hover:text-primary transition-colors" height="1em" width="1em" />
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3 ml-6">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label="Open user menu"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isDropdownOpen}
                >
                  <span
                    data-slot="avatar"
                    className="relative flex size-8 shrink-0 overflow-hidden rounded-full cursor-pointer ring-2 ring-primary/40 hover:ring-primary transition-all w-9 h-9"
                  >
                    <span
                      data-slot="avatar-fallback"
                      className="flex size-full items-center justify-center rounded-full text-xs font-semibold bg-primary text-primary-foreground"
                    >
                      {getUserInitials(user)}
                    </span>
                  </span>
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
                        <div className="px-4 py-4 flex flex-col gap-2 bg-gradient-to-r from-primary/5 to-primary/0 rounded-t-lg">
                          <span className="text-center text-xs uppercase text-primary font-medium tracking-wide">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)} {t('nav.account')}
                          </span>
                          <span className="text-base font-semibold text-foreground truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </span>
                        </div>
                        <div className="bg-border -mx-1 my-1 h-px" role="separator" />
                        <div className="p-2">
                          <a
                            href="/settings/account"
                            className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors"
                            role="menuitem"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <span className="w-full text-left">{t('nav.myAccount')}</span>
                          </a>
                          <a
                            href="/settings/appearance"
                            className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors"
                            role="menuitem"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <span className="w-full text-left">{t('nav.themeLayout')}</span>
                          </a>
                          {user.role === 'admin' && (
                            <a
                              href="/settings/application"
                              className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors"
                              role="menuitem"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <span className="w-full text-left">{t('nav.applicationSettings')}</span>
                            </a>
                          )}
                          <a
                            href="/settings/password"
                            className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors"
                            role="menuitem"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <span className="w-full text-left">{t('nav.updatePassword')}</span>
                          </a>
                          <button
                            onClick={handleSignOut}
                            className="relative flex w-full cursor-default items-center gap-2 rounded-sm px-4 py-2 text-sm outline-none select-none hover:bg-muted transition-colors text-red-600"
                            role="menuitem"
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

            {/* Mobile Menu Button */}
            <button
              data-slot="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 xl:hidden ml-2"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Toggle menu</span>
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden border-b border-border/40 bg-background"
            >
              <div className="px-4 py-2 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? 'bg-primary text-white'
                          : 'text-foreground hover:bg-muted'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content Area */}
        <div
          dir={dir}
          data-slot="scroll-area"
          className="relative h-[calc(100vh-4rem)]"
          style={{ position: 'relative' }}
        >
          <style jsx>{`
            [data-radix-scroll-area-viewport] {
              scrollbar-width: none;
              -ms-overflow-style: none;
              -webkit-overflow-scrolling: touch;
            }
            [data-radix-scroll-area-viewport]::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div
            data-radix-scroll-area-viewport=""
            data-slot="scroll-area-viewport"
            className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
            style={{ overflow: 'hidden scroll' }}
          >
            <div style={{ minWidth: '100%', display: 'table' }}>
              <main className="px-4 py-6">{children}</main>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

