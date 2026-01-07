'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, User } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n';
import { Settings, Save, ArrowLeft, Mail, MessageSquare, Upload, X } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Select } from '@/components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApplicationSettingsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Application settings
  const [appName, setAppName] = useState('Queue Management System');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showLogo, setShowLogo] = useState(false);
  
  // Notification settings
  const [notificationMethod, setNotificationMethod] = useState<'none' | 'sms' | 'mail' | 'both'>('sms');
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [configType, setConfigType] = useState<'mail' | 'sms' | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/');
      return;
    }

    const currentUser = auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.role !== 'admin') {
        router.push('/');
        return;
      }
    }
    
    loadSettings();
  }, [router]);

  const loadSettings = async () => {
    try {
      // Load application settings
      const appSettingsRes = await adminApi.getApplicationSettings();
      const appSettings = appSettingsRes.data;
      if (appSettings) {
        setAppName(appSettings.appName || 'Queue Management System');
        setLogoUrl(appSettings.logoUrl || null);
        setShowLogo(appSettings.showLogo || false);
      }

      // Load notification config
      const notifRes = await adminApi.getNotificationConfig();
      const notifData = notifRes.data || { method: 'sms' };
      setNotificationMethod(notifData.method || 'sms');
      setConfig({
        method: notifData.method,
        smtpHost: notifData.smtpHost || '',
        smtpPort: notifData.smtpPort || '',
        smtpUser: notifData.smtpUser || '',
        smtpPass: '',
        smtpFromEmail: notifData.smtpFromEmail || '',
        smtpFromName: notifData.smtpFromName || '',
        twilioAccountSid: '',
        twilioAuthToken: '',
        twilioFromNumber: notifData.twilioFromNumber || '',
      });
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Save application settings
      await adminApi.updateApplicationSettings({
        appName,
        logoUrl: logoUrl || null,
        showLogo,
      });

      // Save notification config if method is not 'none'
      if (notificationMethod !== 'none') {
        const payload = {
          method: notificationMethod,
          smtpHost: config.smtpHost || null,
          smtpPort: config.smtpPort ? Number(config.smtpPort) : null,
          smtpUser: config.smtpUser || null,
          smtpPass: config.smtpPass || undefined,
          smtpFromEmail: config.smtpFromEmail || null,
          smtpFromName: config.smtpFromName || null,
          twilioAccountSid: config.twilioAccountSid || undefined,
          twilioAuthToken: config.twilioAuthToken || undefined,
          twilioFromNumber: config.twilioFromNumber || null,
        };
        await adminApi.setNotificationConfig(payload);
      } else {
        await adminApi.setNotificationConfig({ method: 'none' });
      }

      setSuccess(t('settings.application.success'));
      
      // Trigger title update
      window.dispatchEvent(new Event('appSettingsUpdated'));
      localStorage.setItem('appSettingsUpdated', Date.now().toString());
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('settings.application.failed'));
    } finally {
      setSaving(false);
    }
  };

  const openConfig = (type: 'mail' | 'sms') => {
    setConfigType(type);
    setShowConfig(true);
  };

  const saveConfig = async () => {
    const payload = {
      method: notificationMethod,
      smtpHost: config.smtpHost || null,
      smtpPort: config.smtpPort ? Number(config.smtpPort) : null,
      smtpUser: config.smtpUser || null,
      smtpPass: config.smtpPass || undefined,
      smtpFromEmail: config.smtpFromEmail || null,
      smtpFromName: config.smtpFromName || null,
      twilioAccountSid: config.twilioAccountSid || undefined,
      twilioAuthToken: config.twilioAuthToken || undefined,
      twilioFromNumber: config.twilioFromNumber || null,
    };
    await adminApi.setNotificationConfig(payload);
    setShowConfig(false);
    setConfigType(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-lg text-muted-foreground">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const getDashboardPath = () => {
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'agent') return '/agent/dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <a
            href={getDashboardPath()}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('settings.account.backToDashboard')}
          </a>
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {t('settings.application.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {t('settings.application.subtitle')}
          </p>
        </div>

        {/* Application Name & Logo Settings */}
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Application Branding</h2>
            
            <div className="space-y-6">
              {/* Application Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('settings.application.appName')}
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('settings.application.appNameDesc')}
                </p>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  placeholder="Queue Management System"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('settings.application.logoUrl')}
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('settings.application.logoUrlDesc')}
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={logoUrl || ''}
                    onChange={(e) => setLogoUrl(e.target.value || null)}
                    className="flex-1 p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    placeholder="https://example.com/logo.png"
                  />
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {logoUrl && (
                  <div className="mt-3 p-3 bg-muted/50 border rounded-lg">
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="h-12 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Show Logo Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t('settings.application.showLogo')}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.application.showLogoDesc')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {t('settings.application.notificationSettings')}
            </h2>
            
            <div className="space-y-6">
              {/* Notification Method */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('settings.application.notificationMethod')}
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('settings.application.notificationMethodDesc')}
                </p>
                <Select
                  value={notificationMethod}
                  onChange={(v) => setNotificationMethod(v as any)}
                  options={[
                    { value: 'none', label: t('settings.application.noNotification') },
                    { value: 'sms', label: t('settings.application.smsOnly') },
                    { value: 'mail', label: t('settings.application.emailOnly') },
                    { value: 'both', label: t('settings.application.both') },
                  ]}
                />
              </div>

              {/* Configuration Buttons */}
              {(notificationMethod === 'mail' || notificationMethod === 'both') && (
                <motion.button
                  type="button"
                  onClick={() => openConfig('mail')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Mail className="w-4 h-4" />
                  {t('settings.application.configureEmail')}
                </motion.button>
              )}

              {(notificationMethod === 'sms' || notificationMethod === 'both') && (
                <motion.button
                  type="button"
                  onClick={() => openConfig('sms')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('settings.application.configureSMS')}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(getDashboardPath())}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors border"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? t('settings.application.saving') : t('settings.application.save')}
          </button>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-chart-2/10 border border-chart-2 text-chart-2 px-4 py-3 rounded-md"
          >
            {success}
          </motion.div>
        )}
      </div>

      {/* Configuration Modal */}
      <AnimatePresence>
        {showConfig && configType && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => {
                setShowConfig(false);
                setConfigType(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-card text-card-foreground border rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">
                    {configType === 'mail' ? t('settings.application.emailConfig') : t('settings.application.smsConfig')}
                  </h3>
                  <button
                    onClick={() => {
                      setShowConfig(false);
                      setConfigType(null);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {configType === 'mail' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('settings.application.smtpHost')}
                        </label>
                        <input
                          type="text"
                          value={config.smtpHost || ''}
                          onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                          className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                          placeholder="smtp.gmail.com"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.application.smtpPort')}
                          </label>
                          <input
                            type="number"
                            value={config.smtpPort || ''}
                            onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                            placeholder="587"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.application.smtpUser')}
                          </label>
                          <input
                            type="text"
                            value={config.smtpUser || ''}
                            onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                            placeholder="user@example.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.application.smtpPassword')}
                          </label>
                          <input
                            type="password"
                            value={config.smtpPass || ''}
                            onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.application.smtpFromEmail')}
                          </label>
                          <input
                            type="email"
                            value={config.smtpFromEmail || ''}
                            onChange={(e) => setConfig({ ...config, smtpFromEmail: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                            placeholder="noreply@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('settings.application.smtpFromName')}
                        </label>
                        <input
                          type="text"
                          value={config.smtpFromName || ''}
                          onChange={(e) => setConfig({ ...config, smtpFromName: e.target.value })}
                          className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                          placeholder="Queue Management System"
                        />
                      </div>
                    </>
                  )}

                  {configType === 'sms' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          {t('settings.application.twilioAccountSid')}
                        </label>
                        <input
                          type="text"
                          value={config.twilioAccountSid || ''}
                          onChange={(e) => setConfig({ ...config, twilioAccountSid: e.target.value })}
                          className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.application.twilioAuthToken')}
                          </label>
                          <input
                            type="password"
                            value={config.twilioAuthToken || ''}
                            onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            {t('settings.application.twilioFromNumber')}
                          </label>
                          <input
                            type="text"
                            value={config.twilioFromNumber || ''}
                            onChange={(e) => setConfig({ ...config, twilioFromNumber: e.target.value })}
                            className="w-full p-3 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                            placeholder="+1234567890"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowConfig(false);
                        setConfigType(null);
                      }}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors border"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={saveConfig}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      {t('settings.application.save')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

