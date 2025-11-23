'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';

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
      const response = await adminApi.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link href="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </Link>
            <button
              onClick={handleExport}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Export Excel
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-600 mb-2">Average Wait Time</h3>
            <p className="text-3xl font-bold">{stats.avgWaitTime || 0} min</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-600 mb-2">Average Service Time</h3>
            <p className="text-3xl font-bold">{stats.avgServiceTime || 0} min</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-gray-600 mb-2">Abandonment Rate</h3>
            <p className="text-3xl font-bold">
              {stats.abandonmentRate?.toFixed(1) || 0}%
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Agent Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Agent</th>
                  <th className="px-4 py-2 text-left">Total Tickets</th>
                  <th className="px-4 py-2 text-left">Completed</th>
                  <th className="px-4 py-2 text-left">Avg Service Time</th>
                  <th className="px-4 py-2 text-left">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {stats.agentPerformance?.map((agent: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2">{agent.agentName}</td>
                    <td className="px-4 py-2">{agent.totalTickets}</td>
                    <td className="px-4 py-2">{agent.completedTickets}</td>
                    <td className="px-4 py-2">{agent.avgServiceTime} min</td>
                    <td className="px-4 py-2">
                      {agent.completionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Category Statistics</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {stats.categoryStats?.map((cat: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg">{cat.categoryName}</h3>
                <p className="text-gray-600">Total Tickets: {cat.totalTickets}</p>
                <p className="text-gray-600">
                  Avg Total Time: {cat.avgTotalTime} min
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

