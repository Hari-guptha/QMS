'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, User } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n';
import { UserCircle, Save, ArrowLeft } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Select } from '@/components/ui/Select';

export default function MyAccountPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [notificationMethod, setNotificationMethod] = useState<'none' | 'sms' | 'mail' | 'both'>('sms');
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<any>({ smtp: {} });

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/');
      return;
    }

    const currentUser = auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
      });
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      adminApi.getNotificationConfig().then(res => {
        const data = res.data || { method: 'sms' };
        setNotificationMethod(data.method || 'sms');
        setConfig({
          method: data.method,
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || '',
          smtpUser: data.smtpUser || '',
          smtpFromEmail: data.smtpFromEmail || '',
          smtpFromName: data.smtpFromName || '',
          twilioAccountSid: '',
          twilioFromNumber: data.twilioFromNumber || '',
        });
      }).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await authApi.updateProfile(formData);
      // Update local storage
      const updatedUser = { ...user!, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess(t('settings.account.success'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('settings.account.failed'));
    } finally {
      setSaving(false);
    }
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

  if (!user) {
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
            <UserCircle className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {t('settings.account.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {t('settings.account.subtitle')}
          </p>
        </div>

        <div className="bg-card text-card-foreground border rounded-xl shadow-sm">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-chart-2/10 border border-chart-2 text-chart-2 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    {t('admin.users.firstName')}
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    {t('admin.users.lastName')}
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                  {t('customer.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  required
                />
              </div>

              <div className="bg-muted/50 border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('settings.account.accountType')}:</span>
                  <span className="font-medium text-foreground">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('settings.account.userId')}:</span>
                  <span className="font-mono text-foreground text-xs">{user.id}</span>
                </div>
                {user.employeeId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('admin.users.employeeId')}:</span>
                    <span className="font-medium text-foreground">{user.employeeId}</span>
                  </div>
                )}
                {user.counterNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('admin.users.counterNumber')}:</span>
                    <span className="font-medium text-foreground">{user.counterNumber}</span>
                  </div>
                )}
              </div>

              {/* Notification Settings Separate Card */}
              {user.role === 'admin' && (
                <div className="bg-card text-card-foreground border rounded-xl shadow-sm mt-8 p-6">
                  <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-full md:w-1/2">
                      <Select
                        value={notificationMethod}
                        onChange={(v) => setNotificationMethod(v as any)}
                        options={[
                          { value: 'none', label: 'No Notification' },
                          { value: 'sms', label: 'SMS Only' },
                          { value: 'mail', label: 'Email Only' },
                          { value: 'both', label: 'Both' },
                        ]}
                      />
                    </div>
                    {(notificationMethod === 'mail' || notificationMethod === 'both') && (
                      <button type="button" onClick={() => { setShowConfig(true); setConfig({ ...config, _openFor: 'mail' }); }} className="px-3 py-1 bg-primary text-primary-foreground rounded-md">Configure Email</button>
                    )}
                    {(notificationMethod === 'sms' || notificationMethod === 'both') && (
                      <button type="button" onClick={() => { setShowConfig(true); setConfig({ ...config, _openFor: 'sms' }); }} className="px-3 py-1 bg-primary text-primary-foreground rounded-md">Configure SMS</button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.push(getDashboardPath())}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors border"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors shadow-xs flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? t('settings.account.saving') : t('settings.account.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* Config modal */}
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfig(false)} />
            <div className="bg-card text-card-foreground border rounded-lg p-6 z-10 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4">{config._openFor === 'mail' ? 'Email Configuration' : 'SMS Configuration'}</h3>
              <div className="space-y-3">
                {config._openFor === 'mail' && <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">SMTP Host</label>
                    <input value={config.smtpHost || ''} onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })} className="w-full p-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">SMTP Port</label>
                      <input value={config.smtpPort || ''} onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">SMTP User</label>
                      <input value={config.smtpUser || ''} onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })} className="w-full p-2 border rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">SMTP Password</label>
                      <input type="password" value={config.smtpPass || ''} onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">From Email</label>
                      <input value={config.smtpFromEmail || ''} onChange={(e) => setConfig({ ...config, smtpFromEmail: e.target.value })} className="w-full p-2 border rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">From Name</label>
                    <input value={config.smtpFromName || ''} onChange={(e) => setConfig({ ...config, smtpFromName: e.target.value })} className="w-full p-2 border rounded" />
                  </div>
                </>}
                {config._openFor === 'sms' && <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Twilio Account SID</label>
                    <input value={config.twilioAccountSid || ''} onChange={(e) => setConfig({ ...config, twilioAccountSid: e.target.value })} className="w-full p-2 border rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Twilio Auth Token</label>
                      <input type="password" value={config.twilioAuthToken || ''} onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })} className="w-full p-2 border rounded" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Twilio From Number</label>
                      <input value={config.twilioFromNumber || ''} onChange={(e) => setConfig({ ...config, twilioFromNumber: e.target.value })} className="w-full p-2 border rounded" />
                    </div>
                  </div>
                </>}
                <div className="flex justify-end gap-2 pt-4">
                  <button onClick={() => setShowConfig(false)} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md">Cancel</button>
                  <button onClick={async () => {
                    const payload = {
                      method: notificationMethod,
                      smtpHost: config.smtpHost,
                      smtpPort: config.smtpPort,
                      smtpUser: config.smtpUser,
                      smtpPass: config.smtpPass,
                      smtpFromEmail: config.smtpFromEmail,
                      smtpFromName: config.smtpFromName,
                      twilioAccountSid: config.twilioAccountSid,
                      twilioAuthToken: config.twilioAuthToken,
                      twilioFromNumber: config.twilioFromNumber,
                    };
                    await adminApi.setNotificationConfig(payload);
                    setShowConfig(false);
                  }} className="px-3 py-1 bg-primary text-primary-foreground rounded-md">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

