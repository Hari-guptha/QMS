'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

export function DynamicTitle() {
  const [appName, setAppName] = useState<string>('Queue Management System');

  const updateTitle = async () => {
    try {
      const res = await adminApi.getApplicationSettings();
      if (res.data?.appName) {
        const newAppName = res.data.appName;
        setAppName(newAppName);
        document.title = newAppName;
      } else {
        document.title = 'Queue Management System';
      }
    } catch (error) {
      // If API fails, use default
      document.title = 'Queue Management System';
    }
  };

  useEffect(() => {
    // Update title on mount
    updateTitle();

    // Listen for storage events (when settings are updated in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'appSettingsUpdated') {
        updateTitle();
      }
    };

    // Listen for custom event (when settings are updated in same tab)
    const handleAppSettingsUpdate = () => {
      updateTitle();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('appSettingsUpdated', handleAppSettingsUpdate);

    // Also check periodically (in case of network issues)
    const interval = setInterval(updateTitle, 60000); // Check every minute

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('appSettingsUpdated', handleAppSettingsUpdate);
      clearInterval(interval);
    };
  }, []);

  // This component doesn't render anything, it just updates the title
  return null;
}

