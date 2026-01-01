"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function MicrosoftCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const errorParam = searchParams.get('error');
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const userParam = searchParams.get('user');

        if (errorParam) {
          setError('Microsoft authentication failed. Please try again.');
          setLoading(false);
          return;
        }

        if (accessToken && refreshToken && userParam) {
          // Store tokens and user data
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', userParam);

            // Reset session manager
            const { getSessionManager } = await import('@/lib/session-manager');
            const sessionManager = getSessionManager();
            if (sessionManager) {
              sessionManager.reset();
            }
          }

          // Parse user data
          const user = JSON.parse(userParam);

          // Apply preferences
          auth.applyUserPreferences(user);

          // Redirect based on role and intended destination
          const intendedRole = sessionStorage.getItem('microsoftAuthRole');
          sessionStorage.removeItem('microsoftAuthRole');

          if (user.role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else if (user.role === 'agent' || intendedRole === 'agent') {
            window.location.href = '/agent/dashboard';
          } else {
            window.location.href = '/';
          }
        } else {
          setError('Failed to complete Microsoft authentication. Missing tokens.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Microsoft callback error:', err);
        setError(err.message || 'An error occurred during authentication.');
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-background dark:to-purple-950/20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-muted-foreground">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-purple-950/20 dark:via-background dark:to-purple-950/20 p-4">
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-600 dark:text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground mb-2">Authentication Error</h2>
          <p className="text-gray-600 dark:text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => {
              const intendedRole = sessionStorage.getItem('microsoftAuthRole');
              if (intendedRole === 'admin') {
                router.push('/admin/login');
              } else {
                router.push('/agent/login');
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
