'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    const user = auth.getUser();
    if (user?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }

    loadDashboard();
  }, [router]);

  const loadDashboard = async () => {
    try {
      const response = await adminApi.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={() => {
                  auth.logout();
                  router.push('/');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/admin/users"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">👥</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Users Management</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage agents and users</p>
          </Link>

          <Link
            href="/admin/categories"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">📁</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Categories</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage service categories</p>
          </Link>

          <Link
            href="/admin/queues"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Queues</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View all queues</p>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-2">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View reports and stats</p>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Stats</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg Wait Time</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avgWaitTime || 0} min
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Avg Service Time</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avgServiceTime || 0} min
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Abandonment Rate</span>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.abandonmentRate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

