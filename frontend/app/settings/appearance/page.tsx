'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useThemeStore } from '@/lib/theme-store';
import { COLOR_PRESETS, DEFAULT_PRIMARY_COLOR } from '@/lib/color-utils';
import { Sun, Moon, Monitor, Eye, Paintbrush, Palette, Check, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { auth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

export default function AppearanceSettings() {
  const { t } = useI18n();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { primaryColor, setPrimaryColor, mounted } = useThemeStore();
  const [currentColor, setCurrentColor] = useState(primaryColor || DEFAULT_PRIMARY_COLOR);

  useEffect(() => {
    if (mounted) {
      setCurrentColor(primaryColor || DEFAULT_PRIMARY_COLOR);
    }
  }, [primaryColor, mounted]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    useThemeStore.getState().setTheme(newTheme);
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    setPrimaryColor(color);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  const user = auth.getUser();
  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'agent') return '/agent/dashboard';
    return '/';
  };

  const themeOptions = [
    {
      value: 'light' as const,
      label: t('settings.appearance.light'),
      description: t('settings.appearance.lightDesc'),
      icon: Sun,
    },
    {
      value: 'dark' as const,
      label: t('settings.appearance.dark'),
      description: t('settings.appearance.darkDesc'),
      icon: Moon,
    },
    {
      value: 'system' as const,
      label: t('settings.appearance.system'),
      description: t('settings.appearance.systemDesc'),
      icon: Monitor,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Page Header */}
        <div>
          <a
            href={getDashboardPath()}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('settings.account.backToDashboard')}
          </a>
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {t('settings.appearance.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {t('settings.appearance.subtitle')}
          </p>
        </div>

        {/* Theme Mode Selection */}
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t('settings.appearance.themeMode')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('settings.appearance.themeModeDesc')}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <motion.div
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`
                      relative flex flex-col gap-3 p-4 rounded-lg border-2 cursor-pointer
                      transition-all duration-200
                      ${isSelected
                        ? 'ring-2 ring-primary border-primary shadow-lg'
                        : 'border-border hover:border-muted-foreground/30'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`
                          p-2 rounded-lg
                          ${isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-5 h-5 text-primary" />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Primary Color Selection */}
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <Paintbrush className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t('settings.appearance.primaryColor')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('settings.appearance.primaryColorDesc')}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Current Color Display */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div
                className="w-12 h-12 rounded-xl shadow-lg ring-2 ring-white/20"
                style={{ backgroundColor: currentColor }}
              />
              <div>
                <div className="font-medium">{t('settings.appearance.currentColor')}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {currentColor}
                </div>
              </div>
            </div>

            {/* Color Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {COLOR_PRESETS.map((preset, index) => {
                const isSelected = currentColor === preset.value;
                return (
                  <motion.div
                    key={preset.value}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleColorChange(preset.value)}
                    className={`
                      relative overflow-hidden rounded-lg border-2 cursor-pointer
                      transition-all duration-200
                      ${isSelected
                        ? 'ring-2 ring-offset-2 ring-primary shadow-lg'
                        : 'border-border hover:shadow-md'
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {/* Color Preview */}
                    <div
                      className="h-20 w-full"
                      style={{ backgroundColor: preset.value }}
                    />

                    {/* Selected Overlay */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm"
                      >
                        <Check className="w-8 h-8 text-white drop-shadow-lg" />
                      </motion.div>
                    )}

                    {/* Color Info */}
                    <div className="p-3">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">
                        {preset.value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {preset.description}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t('settings.appearance.preview')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('settings.appearance.previewDesc')}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Button */}
              <button
                className="h-9 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-xs hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-opacity-50 transition-colors"
              >
                {t('settings.appearance.primaryButton')}
              </button>

              {/* Secondary Button */}
              <button
                className="h-9 px-4 py-2 bg-secondary text-secondary-foreground rounded-md border hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-opacity-50 transition-colors"
              >
                {t('settings.appearance.secondaryButton')}
              </button>

              {/* Badge */}
              <div className="flex items-center justify-center">
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${currentColor}20`,
                    color: currentColor,
                  }}
                >
                  {t('settings.appearance.badgeComponent')}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: '60%' }}
                />
                <p className="text-sm text-muted-foreground">{t('settings.appearance.progress')}: 60%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

