'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setSaving(false);
      return;
    }

    // Password validation
    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(', '));
      setSaving(false);
      return;
    }

    try {
      await authApi.updatePassword(formData.currentPassword, formData.newPassword);
      setSuccess('Password updated successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('One special character');
    }
    return errors;
  };

  const checkPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
    };
  };

  const passwordRequirements = checkPasswordRequirements(formData.newPassword);

  const user = auth.getUser();
  const getDashboardPath = () => {
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'agent') return '/agent/dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        {/* Header - Centered */}
        <div className="text-center space-y-2 mb-8">
          <div 
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--primary-10)' }}
          >
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Update Password</h1>
          <p className="text-muted-foreground text-lg">
            Enter your current password and choose a new secure password
          </p>
        </div>

        {/* Password Update Form Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm mb-6">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-chart-2/10 border border-chart-2 text-chart-2 px-4 py-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPassword: e.target.value })
                    }
                    placeholder="Enter your current password"
                    className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    placeholder="Enter your new password"
                    className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Confirm your new password"
                    className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Update Password Button - Centered */}
                <button
                  type="submit"
                  disabled={saving}
                className="w-full h-11 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors shadow-sm font-medium text-base"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
            </form>
          </div>
        </div>

        {/* Password Requirements Card */}
        <div className="bg-muted/30 border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium mb-4 text-center">Password Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${passwordRequirements.minLength ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <span className={passwordRequirements.minLength ? 'text-foreground' : 'text-muted-foreground'}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${passwordRequirements.hasUppercase ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <span className={passwordRequirements.hasUppercase ? 'text-foreground' : 'text-muted-foreground'}>
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${passwordRequirements.hasLowercase ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <span className={passwordRequirements.hasLowercase ? 'text-foreground' : 'text-muted-foreground'}>
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${passwordRequirements.hasNumber ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <span className={passwordRequirements.hasNumber ? 'text-foreground' : 'text-muted-foreground'}>
                One number
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm md:col-span-2 justify-center">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${passwordRequirements.hasSpecial ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
              <span className={passwordRequirements.hasSpecial ? 'text-foreground' : 'text-muted-foreground'}>
                One special character
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

