'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const { t } = useI18n();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await auth.login(username, password);
      if (response.user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        setError(t('login.accessDeniedAdmin'));
        auth.logout();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Gradient Background with Circular Patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-background dark:to-purple-950/20">
        {/* Circular Pattern Overlay */}
        <div className="absolute inset-0 opacity-30 dark:opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200 dark:bg-purple-900/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-100 dark:bg-purple-800/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-50 dark:bg-purple-900/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Theme Toggle and Language Selector */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-red-600 dark:text-red-500">Q</span>
            <span className="text-4xl font-bold text-foreground">MS</span>
          </div>
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-blue-600 dark:text-blue-500 mb-2">
            {t('login.welcomeBack')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            {t('login.signInToQMS')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Login Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
              {t('login.login')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('login.enterLoginId')}
              className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
              {t('login.password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.enterPassword')}
                className="w-full p-3 sm:p-3 pr-12 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-foreground">{t('login.rememberMe')}</span>
            </label>
            <a
              href="#"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {t('login.forgotPassword')}
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('login.signingIn')}</span>
              </>
            ) : (
              t('login.signIn')
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-card text-gray-500 dark:text-muted-foreground">{t('common.or')}</span>
            </div>
          </div>

          {/* Microsoft Sign In Button */}
          <button
            type="button"
            onClick={() => {
              // Store the intended role in sessionStorage for callback
              sessionStorage.setItem('microsoftAuthRole', 'admin');
              authApi.microsoftAuth();
            }}
            disabled={loading}
            className="w-full bg-white dark:bg-card border-2 border-gray-300 dark:border-border text-gray-700 dark:text-foreground py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
              <rect x="0" y="0" width="10" height="10" fill="#F25022" />
              <rect x="13" y="0" width="10" height="10" fill="#7FBA00" />
              <rect x="0" y="13" width="10" height="10" fill="#00A4EF" />
              <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
            </svg>
            {t('login.signInWithMicrosoft')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
