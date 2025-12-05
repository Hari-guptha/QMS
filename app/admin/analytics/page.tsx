'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';

export default function Analytics() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadAnalytics();
  }, [router]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboard();
      setStats(response.data || {});
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      alert(error.response?.data?.message || 'Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminApi.exportExcel();
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (error) {
      alert('Failed to export');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-xl text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin/dashboard" className="text-primary hover:text-primary/80">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={loadAnalytics}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-xs"
            >
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="bg-chart-2 text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity shadow-xs"
            >
              Export Excel
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Average Wait Time</h3>
            <p className="text-3xl font-bold text-foreground">{stats.avgWaitTime || 0} min</p>
          </div>
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Average Service Time</h3>
            <p className="text-3xl font-bold text-foreground">{stats.avgServiceTime || 0} min</p>
          </div>
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Abandonment Rate</h3>
            <p className="text-3xl font-bold text-foreground">
              {stats.abandonmentRate?.toFixed(1) || 0}%
            </p>
          </div>
        </div>

        <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Agent Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tickets Served</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Avg Wait Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Avg Service Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.agentPerformance?.map((agent: any, idx: number) => (
                  <tr key={idx} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">
                      {agent.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">
                      {agent.ticketsServed || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">
                      {agent.avgWaitTime || 0} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">
                      {agent.avgServiceTime || 0} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
