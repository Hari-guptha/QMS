'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/admin/users"
            className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-2">👥</div>
            <h2 className="text-xl font-semibold text-foreground">Users Management</h2>
            <p className="text-muted-foreground text-sm">Manage agents and users</p>
          </Link>

          <Link
            href="/admin/categories"
            className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-2">📁</div>
            <h2 className="text-xl font-semibold text-foreground">Categories</h2>
            <p className="text-muted-foreground text-sm">Manage service categories</p>
          </Link>

          <Link
            href="/admin/queues"
            className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-2">📋</div>
            <h2 className="text-xl font-semibold text-foreground">All Queues</h2>
            <p className="text-muted-foreground text-sm">View all queues</p>
          </Link>

          <Link
            href="/admin/analytics"
            className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-2">📊</div>
            <h2 className="text-xl font-semibold text-foreground">Analytics</h2>
            <p className="text-muted-foreground text-sm">View reports and stats</p>
          </Link>
        </div>

        <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Quick Stats</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <span className="text-muted-foreground">Avg Wait Time</span>
              <p className="text-2xl font-bold text-foreground">
                {stats.avgWaitTime || 0} min
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Service Time</span>
              <p className="text-2xl font-bold text-foreground">
                {stats.avgServiceTime || 0} min
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Abandonment Rate</span>
              <p className="text-2xl font-bold text-foreground">
                {stats.abandonmentRate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
