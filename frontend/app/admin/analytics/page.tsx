'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import {
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Download,
  UserCheck,
  Loader2,
  FolderOpen,
  Ticket,
  Users,
  Search,
  Filter,
  X,
  CheckCircle2,
  Pause,
  Mail,
  Calendar,
  Activity,
  Maximize2,
  Minimize2,
  ExternalLink
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { HeatmapChart } from '@/components/charts/HeatmapChart';

export default function Analytics() {
  const router = useRouter();
  const { t } = useI18n();
  const [stats, setStats] = useState<any>({});
  const [agentPerformance, setAgentPerformance] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState<string>(() => {
    try {
      // Default to start of this week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek.toISOString().split('T')[0];
    } catch {
      return '';
    }
  });
  const [endDate, setEndDate] = useState<string>(() => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch {
      return '';
    }
  });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState('');

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    updateDateRange();
  }, [dateFilter]);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      return;
    }
    loadAnalytics();
    loadCategories();
  }, [router, startDate, endDate]);

  useEffect(() => {
    loadAgentPerformance();
  }, [selectedCategoryId, startDate, endDate]);

  const updateDateRange = () => {
    const today = new Date();
    let start: Date;
    let end: Date = new Date(today);
    end.setHours(23, 59, 59, 999);

    switch (dateFilter) {
      case 'day':
        start = new Date(today);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = today.getDay();
        start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        // Don't change dates for custom
        return;
      default:
        start = new Date(today);
        start.setHours(0, 0, 0, 0);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const loadCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboard(startDate, endDate);
      setStats(response.data || {});
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      alert(error.response?.data?.message || 'Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAgentPerformance = async () => {
    try {
      const response = await adminApi.getDetailedAgentPerformance(startDate, endDate, selectedCategoryId || undefined);
      setAgentPerformance(response.data || []);
    } catch (error: any) {
      console.error('Failed to load agent performance:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAnalytics(), loadAgentPerformance()]);
  };

  const handleExport = async () => {
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const response = await adminApi.exportAnalytics(params);
      const data = response.data;

      // Helper: convert array of objects to CSV
      const toCSV = (rows: any[], headers?: string[]) => {
        if (!rows || rows.length === 0) return '';
        const keys = headers || Object.keys(rows[0]);
        const lines = [keys.join(',')];
        rows.forEach((row) => {
          const vals = keys.map((k) => {
            const v = row[k];
            if (v === null || v === undefined) return '';
            return `"${String(v).replace(/"/g, '""')}"`;
          });
          lines.push(vals.join(','));
        });
        return lines.join('\n');
      };

      if (exportFormat === 'excel') {
        const parts: string[] = [];
        const d = data.dashboard || {};

        // Summary metrics
        parts.push(`${t('admin.analytics.table.totals') || 'Metric'},${t('common.value') || 'Value'}`);
        if (d.avgWaitTime !== undefined) parts.push(`${t('admin.avgWaitTime') || 'Avg Wait Time'},${d.avgWaitTime}`);
        if (d.avgServiceTime !== undefined) parts.push(`${t('admin.avgServiceTime') || 'Avg Service Time'},${d.avgServiceTime}`);
        if (d.abandonmentRate !== undefined) parts.push(`${t('admin.abandonmentRate') || 'Abandonment Rate'},${d.abandonmentRate}`);
        parts.push('');

        // Ticket counts
        parts.push(t('admin.analytics.statusDistribution') || 'Ticket Status Distribution');
        if (d.ticketCounts) {
          parts.push('Status,Count');
          Object.entries(d.ticketCounts).forEach(([k, v]) => parts.push(`${k},${v}`));
        }
        parts.push('');

        // Service performance
        if (d.servicePerformance && d.servicePerformance.length > 0) {
          parts.push(t('admin.analytics.servicePerformance') || 'Service Performance');
          parts.push(['Category', 'Total', 'Pending', 'Serving', 'Hold', 'Completed', 'Avg Total Time', 'Avg Service Time', 'Completion Rate'].join(','));
          d.servicePerformance.forEach((s: any) => {
            parts.push([
              s.categoryName,
              s.totalTickets,
              s.pendingTickets,
              s.servingTickets,
              s.holdTickets,
              s.completedTickets,
              s.avgTotalTime,
              s.avgServiceTime,
              s.completionRate?.toFixed(2) + '%',
            ].join(','));
          });
          parts.push('');
        }

        // Category stats (if separate)
        if (d.categoryStats && d.categoryStats.length > 0) {
          parts.push('Category Stats');
          parts.push(['Category', 'Total Tickets', 'Avg Total Time'].join(','));
          d.categoryStats.forEach((c: any) => {
            parts.push([c.categoryName, c.totalTickets, c.avgTotalTime].join(','));
          });
          parts.push('');
        }

        // Agent detailed performance
        if (d.agentPerformance && d.agentPerformance.length > 0) {
          parts.push(t('admin.analytics.agentPerformance') || 'Agent Performance');
          parts.push(['Agent', 'Total', 'Pending', 'Serving', 'Hold', 'Completed', 'Avg Wait', 'Avg Called→Serving', 'Avg Service', 'Avg Total', 'Completion Rate'].join(','));
          d.agentPerformance.forEach((a: any) => {
            parts.push([
              a.agentName,
              a.totalTickets,
              a.pendingTickets,
              a.servingTickets,
              a.holdTickets,
              a.completedTickets,
              a.avgWaitTime,
              a.avgCalledToServingTime,
              a.avgServiceTime,
              a.avgTotalTime,
              a.completionRate?.toFixed(2) + '%',
            ].join(','));
          });
          parts.push('');
        }

        // Daily trends
        if (d.dailyTrends && d.dailyTrends.length > 0) {
          parts.push(t('admin.analytics.dailyTrends') || 'Daily Ticket Trends');
          parts.push(['Date', 'Total', 'Completed', 'Pending'].join(','));
          d.dailyTrends.forEach((r: any) => parts.push([r.date, r.total, r.completed, r.pending].join(',')));
          parts.push('');
        }

        // Hourly distribution
        if (d.hourlyDistribution && d.hourlyDistribution.length > 0) {
          parts.push(t('admin.analytics.hourlyDistribution') || 'Hourly Distribution');
          parts.push(['Hour', 'Count'].join(','));
          d.hourlyDistribution.forEach((h: any) => parts.push([h.hour, h.count].join(',')));
          parts.push('');
        }

        // Day of week
        if (d.dayOfWeekDistribution && d.dayOfWeekDistribution.length > 0) {
          parts.push(t('admin.analytics.dayOfWeekDistribution') || 'Day of Week Distribution');
          parts.push(['Day', 'Count'].join(','));
          d.dayOfWeekDistribution.forEach((d2: any) => parts.push([d2.day, d2.count].join(',')));
          parts.push('');
        }

        // Status distribution
        if (d.statusDistribution && d.statusDistribution.length > 0) {
          parts.push(t('admin.analytics.statusDistribution') || 'Status Distribution');
          parts.push(['Label', 'Value'].join(','));
          d.statusDistribution.forEach((s: any) => parts.push([s.label, s.value].join(',')));
          parts.push('');
        }

        // Peak hours
        if (d.peakHours && d.peakHours.length > 0) {
          parts.push(t('admin.analytics.peakHours') || 'Peak Hours');
          parts.push(['Hour', 'Count'].join(','));
          d.peakHours.forEach((p: any) => parts.push([p.hour, p.count].join(',')));
          parts.push('');
        }

        const csv = parts.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const fileNameSuffix = startDate && endDate ? `${startDate}_to_${endDate}` : new Date().toISOString().split('T')[0];
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${fileNameSuffix}.csv`;
        a.click();
      } else {
        // PDF: open printable window with tables (localized and direction-aware)
        const popup = window.open('', '_blank');
        if (!popup) throw new Error('Unable to open print window');
        const dir = document.documentElement.dir || 'ltr';
        const lang = document.documentElement.lang || 'en';
        const d = data.dashboard || {};
        const docHtml = `
          <html dir="${dir}" lang="${lang}">
            <head>
              <meta charset="utf-8" />
              <title>${t('admin.analytics.title') || 'Analytics Report'}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f4f4f4; }
                h1, h2 { margin: 8px 0; }
              </style>
            </head>
            <body>
              <h1>${t('admin.analytics.title') || 'Analytics Report'}</h1>

              <h2>${t('admin.analytics.table.totals') || 'Summary'}</h2>
              <table>
                <tbody>
                  <tr><th>${t('admin.analytics.table.totals') || 'Metric'}</th><th>${t('common.value') || 'Value'}</th></tr>
                  ${d.avgWaitTime !== undefined ? `<tr><td>${t('admin.avgWaitTime') || 'Avg Wait Time'}</td><td>${d.avgWaitTime}</td></tr>` : ''}
                  ${d.avgServiceTime !== undefined ? `<tr><td>${t('admin.avgServiceTime') || 'Avg Service Time'}</td><td>${d.avgServiceTime}</td></tr>` : ''}
                  ${d.abandonmentRate !== undefined ? `<tr><td>${t('admin.abandonmentRate') || 'Abandonment Rate'}</td><td>${d.abandonmentRate}</td></tr>` : ''}
                </tbody>
              </table>

              <h2>${t('admin.analytics.statusDistribution') || 'Ticket Status Distribution'}</h2>
              <table>
                <thead><tr><th>${t('common.status') || 'Status'}</th><th>${t('common.value') || 'Value'}</th></tr></thead>
                <tbody>
                  ${(d.ticketCounts ? Object.entries(d.ticketCounts) : []).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
                </tbody>
              </table>

              ${d.servicePerformance && d.servicePerformance.length > 0 ? `
                <h2>${t('admin.analytics.servicePerformance') || 'Service Performance'}</h2>
                <table>
                  <thead><tr><th>Category</th><th>Total</th><th>Pending</th><th>Serving</th><th>Hold</th><th>Completed</th><th>Avg Total</th><th>Avg Service</th><th>Completion</th></tr></thead>
                  <tbody>
                    ${d.servicePerformance.map((s: any) => `
                      <tr>
                        <td>${s.categoryName}</td>
                        <td>${s.totalTickets}</td>
                        <td>${s.pendingTickets}</td>
                        <td>${s.servingTickets}</td>
                        <td>${s.holdTickets}</td>
                        <td>${s.completedTickets}</td>
                        <td>${s.avgTotalTime}</td>
                        <td>${s.avgServiceTime}</td>
                        <td>${s.completionRate?.toFixed(2)}%</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${d.categoryStats && d.categoryStats.length > 0 ? `
                <h2>Category Stats</h2>
                <table>
                  <thead><tr><th>Category</th><th>Total Tickets</th><th>Avg Total Time</th></tr></thead>
                  <tbody>
                    ${d.categoryStats.map((c: any) => `<tr><td>${c.categoryName}</td><td>${c.totalTickets}</td><td>${c.avgTotalTime}</td></tr>`).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${d.agentPerformance && d.agentPerformance.length > 0 ? `
                <h2>${t('admin.analytics.agentPerformance') || 'Agent Performance'}</h2>
                <table>
                  <thead><tr><th>Agent</th><th>Total</th><th>Pending</th><th>Serving</th><th>Hold</th><th>Completed</th><th>Avg Wait</th><th>Avg Called→Serving</th><th>Avg Service</th><th>Avg Total</th><th>Completion</th></tr></thead>
                  <tbody>
                    ${d.agentPerformance.map((a: any) => `
                      <tr>
                        <td>${a.agentName}</td>
                        <td>${a.totalTickets}</td>
                        <td>${a.pendingTickets}</td>
                        <td>${a.servingTickets}</td>
                        <td>${a.holdTickets}</td>
                        <td>${a.completedTickets}</td>
                        <td>${a.avgWaitTime}</td>
                        <td>${a.avgCalledToServingTime}</td>
                        <td>${a.avgServiceTime}</td>
                        <td>${a.avgTotalTime}</td>
                        <td>${a.completionRate?.toFixed(2)}%</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${d.dailyTrends && d.dailyTrends.length > 0 ? `
                <h2>${t('admin.analytics.dailyTrends') || 'Daily Trends'}</h2>
                <table>
                  <thead><tr><th>Date</th><th>Total</th><th>Completed</th><th>Pending</th></tr></thead>
                  <tbody>
                    ${d.dailyTrends.map((r: any) => `<tr><td>${r.date}</td><td>${r.total}</td><td>${r.completed}</td><td>${r.pending}</td></tr>`).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${d.hourlyDistribution && d.hourlyDistribution.length > 0 ? `
                <h2>${t('admin.analytics.hourlyDistribution') || 'Hourly Distribution'}</h2>
                <table>
                  <thead><tr><th>Hour</th><th>Count</th></tr></thead>
                  <tbody>
                    ${d.hourlyDistribution.map((h: any) => `<tr><td>${h.hour}</td><td>${h.count}</td></tr>`).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${d.dayOfWeekDistribution && d.dayOfWeekDistribution.length > 0 ? `
                <h2>${t('admin.analytics.dayOfWeekDistribution') || 'Day of Week'}</h2>
                <table>
                  <thead><tr><th>Day</th><th>Count</th></tr></thead>
                  <tbody>
                    ${d.dayOfWeekDistribution.map((dd: any) => `<tr><td>${dd.day}</td><td>${dd.count}</td></tr>`).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${d.statusDistribution && d.statusDistribution.length > 0 ? `
                <h2>${t('admin.analytics.statusDistribution') || 'Status Distribution'}</h2>
                <table>
                  <thead><tr><th>Label</th><th>Value</th></tr></thead>
                  <tbody>
                    ${d.statusDistribution.map((s: any) => `<tr><td>${s.label}</td><td>${s.value}</td></tr>`).join('')}
                  </tbody>
                </table>
              ` : ''}

              ${d.peakHours && d.peakHours.length > 0 ? `
                <h2>${t('admin.analytics.peakHours') || 'Peak Hours'}</h2>
                <table>
                  <thead><tr><th>Hour</th><th>Count</th></tr></thead>
                  <tbody>
                    ${d.peakHours.map((p: any) => `<tr><td>${p.hour}</td><td>${p.count}</td></tr>`).join('')}
                  </tbody>
                </table>
              ` : ''}

            </body>
          </html>
        `;
        popup.document.write(docHtml);
        popup.document.close();
        setTimeout(() => {
          popup.focus();
          popup.print();
        }, 500);
      }
    } catch (error) {
      console.error(error);
      alert(t('error.exportFailed'));
    }
  };

  // Filter agents based on search query
  const filteredAgents = agentPerformance.filter((agent) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      agent.agentName?.toLowerCase().includes(query) ||
      agent.agentEmail?.toLowerCase().includes(query) ||
      agent.employeeId?.toLowerCase().includes(query);
    return matchesSearch;
  });

  // Chart expand component
  const ChartWrapper = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    return (
      <div className="relative">
        <button
          onClick={() => setExpandedChart(id)}
          className="absolute top-2 right-2 z-10 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted transition-colors"
          title="Expand chart"
        >
          <Maximize2 className="w-4 h-4 text-foreground" />
        </button>
        {children}
      </div>
    );
  };

  // Expanded chart modal
  const ExpandedChartModal = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
    if (expandedChart !== id) return null;
    
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" onClick={() => setExpandedChart(null)} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-4 z-[10000] bg-card border border-border rounded-2xl shadow-xl p-6 overflow-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            <button
              onClick={() => setExpandedChart(null)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
          <div className="h-[calc(100vh-12rem)]">
            {children}
          </div>
        </motion.div>
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-lg text-muted-foreground">{t('admin.analytics.loading')}</div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('admin.users.backToDashboard')}
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-4/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-chart-4" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">{t('admin.analytics.title')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/analytics/export"
              className="flex items-center gap-2 bg-chart-3 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <Download className="w-5 h-5" />
              {t('admin.analytics.export')}
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {t('admin.analytics.refresh')}
            </motion.button>
          </div>
        </motion.div>

        {/* Date Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 mb-6"
        >
          <div className="flex flex-col gap-4">
            {/* First Row: Date Filter and Custom Date Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
              {/* Date Filter Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t('admin.analytics.period')}</span>
                <div className="flex items-center gap-2 border border-border rounded-lg p-1">
                  <button
                    onClick={() => setDateFilter('day')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      dateFilter === 'day'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t('admin.analytics.today')}
                  </button>
                  <button
                    onClick={() => setDateFilter('week')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      dateFilter === 'week'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t('admin.analytics.thisWeek')}
                  </button>
                  <button
                    onClick={() => setDateFilter('month')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      dateFilter === 'month'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t('admin.analytics.thisMonth')}
                  </button>
                  <button
                    onClick={() => setDateFilter('custom')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      dateFilter === 'custom'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t('admin.analytics.custom')}
                  </button>
                </div>
              </div>

              {/* Custom Date Range */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="text-muted-foreground">{t('admin.analytics.to')}</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const today = new Date();
                      const dayOfWeek = today.getDay();
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - dayOfWeek);
                      startOfWeek.setHours(0, 0, 0, 0);
                      setStartDate(startOfWeek.toISOString().split('T')[0]);
                      setEndDate(today.toISOString().split('T')[0]);
                      setDateFilter('week');
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={t('admin.analytics.resetToDefault')}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            {/* Second Row: Search and Quick Links */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search */}
              <div className="flex-1 flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('admin.analytics.searchAnalytics')}
                  value={analyticsSearchQuery}
                  onChange={(e) => setAnalyticsSearchQuery(e.target.value)}
                  className="flex-1 outline-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                />
                {analyticsSearchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setAnalyticsSearchQuery('')}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={t('admin.analytics.clearFilter')}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* Quick Links */}
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/analytics/agents"
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  {t('admin.analytics.agentAnalytics')}
                </Link>
                <Link
                  href="/admin/analytics/services"
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                >
                  {t('admin.analytics.serviceAnalytics')}
                </Link>
              </div>
            </div>
          </div>
          {/* Export Modal */}
          {isExportOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" onClick={() => setIsExportOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
              >
                <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-xl w-full max-w-lg">
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-chart-4/10 rounded-lg">
                        <Download className="w-6 h-6 text-chart-4" />
                      </div>
                      <h2 className="text-lg font-bold text-foreground">{t('admin.analytics.export')}</h2>
                    </div>
                    <button onClick={() => setIsExportOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1">{t('admin.analytics.startDate')}</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-3 border border-border rounded-lg bg-white dark:bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1">{t('admin.analytics.endDate')}</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-3 border border-border rounded-lg bg-white dark:bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-1">{t('admin.analytics.exportFormat')}</label>
                      <Select
                        value={exportFormat}
                        onChange={(v) => setExportFormat(v as 'excel' | 'pdf')}
                        options={[
                          { value: 'excel', label: t('admin.analytics.excel') || 'Excel' },
                          { value: 'pdf', label: t('admin.analytics.pdf') || 'PDF' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setIsExportOpen(false)}
                      className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleExport();
                        setIsExportOpen(false);
                      }}
                      className="px-6 py-2 bg-chart-2 text-white rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                    >
                      {t('admin.analytics.export')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Overall Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Ticket className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t('admin.analytics.totalTickets')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.ticketCounts?.total || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-muted-foreground">{t('admin.total')} {t('common.pending')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.ticketCounts?.pending || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">{t('admin.total')} {t('common.serving')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.ticketCounts?.serving || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-chart-3" />
              <span className="text-sm font-medium text-muted-foreground">{t('admin.analytics.completed')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.ticketCounts?.completed || 0}
            </p>
          </div>
        </motion.div>

        {/* Agent Performance Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-card text-card-foreground border rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('admin.analytics.agentPerformance')}</h2>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('admin.analytics.searchAgents')}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="relative">
                <Select
                  value={selectedCategoryId}
                  onChange={(value) => setSelectedCategoryId(value)}
                  placeholder={t('admin.analytics.allServices')}
                  buttonClassName="p-3 sm:p-3 pl-11 sm:pl-11 relative"
                  options={[
                    { value: '', label: t('admin.analytics.allServices') },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
                />
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-20" />
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{t('admin.analytics.totalAgents')}</p>
                <p className="text-2xl font-bold text-foreground">{filteredAgents.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{t('admin.analytics.totalTickets')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAgents.reduce((sum, a) => sum + (a.totalTickets || 0), 0)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{t('admin.analytics.completed')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAgents.reduce((sum, a) => sum + (a.completedTickets || 0), 0)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">{t('admin.analytics.avgServiceTime')}</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAgents.length > 0
                    ? Math.round(
                      filteredAgents.reduce((sum, a) => sum + (a.avgServiceTime || 0), 0) /
                      filteredAgents.length
                    )
                    : 0}{' '}
                  {t('customer.minutes')}
                </p>
              </div>
            </div>
          </div>

          {/* Agent Performance Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('admin.analytics.table.agent')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('admin.analytics.table.totals')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('admin.analytics.table.statusBreakdown')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('admin.analytics.table.timeMetrics')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('admin.analytics.table.performance')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAgents.map((agent: any, idx: number) => (
                  <motion.tr
                    key={agent.agentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{agent.agentName}</p>
                          {agent.agentEmail && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {agent.agentEmail}
                            </p>
                          )}
                          {agent.employeeId && (
                            <p className="text-xs text-primary font-mono mt-0.5">
                              ID: {agent.employeeId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground font-semibold">
                            {agent.totalTickets || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">{t('admin.analytics.total')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-chart-3" />
                          <span className="text-foreground">
                            {agent.completedTickets || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">{t('admin.analytics.completed')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-yellow-600" />
                          <span className="text-foreground">
                            {t('common.pending')}: {agent.pendingTickets || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3 h-3 text-green-600" />
                          <span className="text-foreground">
                            {t('common.serving')}: {agent.servingTickets || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pause className="w-3 h-3 text-red-600" />
                          <span className="text-foreground">
                            {t('common.hold')}: {agent.holdTickets || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span className="text-foreground">
                            {t('admin.analytics.wait')}: {agent.avgWaitTime || 0} {t('customer.minutes')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-foreground">
                            {t('admin.analytics.service')}: {agent.avgServiceTime || 0} {t('customer.minutes')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-3 h-3 text-purple-600" />
                          <span className="text-foreground">
                            {t('admin.analytics.total')}: {agent.avgTotalTime || 0} {t('customer.minutes')}
                          </span>
                        </div>
                        {agent.avgCalledToServingTime !== undefined && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-orange-600" />
                            <span className="text-foreground">
                              {t('admin.analytics.calledToServing')}: {agent.avgCalledToServingTime || 0} {t('customer.minutes')}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{t('admin.completionRate')}</span>
                          <span className="text-sm font-semibold text-foreground">
                            {agent.completionRate?.toFixed(1) || 0}%
                          </span>
                        </div>
                        {agent.serviceBreakdown && agent.serviceBreakdown.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">{t('admin.analytics.services')}:</p>
                            <div className="flex flex-wrap gap-1">
                              {agent.serviceBreakdown.slice(0, 3).map((service: any, sIdx: number) => (
                                <span
                                  key={sIdx}
                                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                                >
                                  {service.categoryName} ({service.totalTickets})
                                </span>
                              ))}
                              {agent.serviceBreakdown.length > 3 && (
                                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                                  +{agent.serviceBreakdown.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredAgents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      {searchQuery || selectedCategoryId
                        ? t('admin.analytics.noAgentsFound')
                        : t('admin.analytics.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Analytics Charts Section */}
        <div className="space-y-8 mb-8">
          {/* Ticket Status Distribution */}
          {stats.statusDistribution && stats.statusDistribution.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <ChartWrapper id="status-distribution" title={t('admin.analytics.statusDistribution')}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t('admin.analytics.statusDistribution')}</h2>
                </div>
                <PieChart
                  data={stats.statusDistribution.map((s: any) => ({
                    label: s.label,
                    value: s.value,
                    color: s.status === 'completed' ? 'var(--chart-3)' :
                      s.status === 'pending' ? '#f59e0b' :
                        s.status === 'serving' ? '#10b981' :
                          s.status === 'hold' ? '#ef4444' :
                            s.status === 'no_show' ? '#8b5cf6' :
                              'var(--muted-foreground)',
                  }))}
                  title=""
                  size={expandedChart === 'status-distribution' ? 400 : 250}
                />
              </ChartWrapper>
            </motion.div>
          )}

          {/* Daily Ticket Trends */}
          {stats.dailyTrends && stats.dailyTrends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <ChartWrapper id="daily-trends" title={t('admin.analytics.dailyTrends')}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-chart-2/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-chart-2" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t('admin.analytics.dailyTrends')}</h2>
                </div>
                <AreaChart
                  data={stats.dailyTrends.map((d: any) => ({
                    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    value: d.total,
                  }))}
                  title=""
                  height={expandedChart === 'daily-trends' ? 400 : 250}
                  color="var(--chart-2)"
                />
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-chart-2"></div>
                    <span className="text-muted-foreground">{t('admin.analytics.totalTickets')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-chart-3"></div>
                    <span className="text-muted-foreground">{t('admin.analytics.completed')}</span>
                  </div>
                </div>
              </ChartWrapper>
            </motion.div>
          )}

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Hourly Distribution */}
            {stats.hourlyDistribution && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="bg-card border border-border rounded-2xl shadow-lg p-6"
              >
                <ChartWrapper id="hourly-distribution" title={t('admin.analytics.hourlyDistribution')}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-chart-1/10 rounded-lg">
                      <Clock className="w-6 h-6 text-chart-1" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{t('admin.analytics.hourlyDistribution')}</h2>
                  </div>
                  <BarChart
                    data={stats.hourlyDistribution.map((h: any) => ({
                      label: `${h.hour}:00`,
                      value: h.count,
                      color: 'var(--chart-1)',
                    }))}
                    height={expandedChart === 'hourly-distribution' ? 400 : 200}
                  />
                </ChartWrapper>
              </motion.div>
            )}

            {/* Day of Week Distribution */}
            {stats.dayOfWeekDistribution && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-card border border-border rounded-2xl shadow-lg p-6"
              >
                <ChartWrapper id="day-of-week" title={t('admin.analytics.dayOfWeekDistribution')}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-chart-4/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-chart-4" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{t('admin.analytics.dayOfWeekDistribution')}</h2>
                  </div>
                  <BarChart
                    data={stats.dayOfWeekDistribution.map((d: any) => ({
                      label: d.day,
                      value: d.count,
                      color: 'var(--chart-4)',
                    }))}
                    height={expandedChart === 'day-of-week' ? 400 : 200}
                  />
                </ChartWrapper>
              </motion.div>
            )}

            {/* Service Category Performance */}
            {stats.servicePerformance && stats.servicePerformance.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="bg-card border border-border rounded-2xl shadow-lg p-6"
              >
                <ChartWrapper id="service-performance" title={t('admin.analytics.servicePerformance')}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-chart-2/10 rounded-lg">
                      <FolderOpen className="w-6 h-6 text-chart-2" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{t('admin.analytics.servicePerformance')}</h2>
                  </div>
                  <BarChart
                    data={stats.servicePerformance.map((s: any) => ({
                      label: s.categoryName.length > 10 ? s.categoryName.substring(0, 10) + '...' : s.categoryName,
                      value: s.totalTickets,
                      color: 'var(--chart-2)',
                    }))}
                    height={expandedChart === 'service-performance' ? 400 : 200}
                  />
                </ChartWrapper>
              </motion.div>
            )}

            {/* Agent Performance Comparison */}
            {stats.agentPerformance && stats.agentPerformance.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="bg-card border border-border rounded-2xl shadow-lg p-6"
              >
                <ChartWrapper id="agent-performance-comparison" title={t('admin.analytics.agentPerformanceComparison')}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-chart-3/10 rounded-lg">
                      <UserCheck className="w-6 h-6 text-chart-3" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{t('admin.analytics.agentPerformanceComparison')}</h2>
                  </div>
                  <BarChart
                    data={stats.agentPerformance.slice(0, 10).map((a: any) => ({
                      label: a.agentName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                      value: a.completedTickets,
                      color: 'var(--chart-3)',
                    }))}
                    height={expandedChart === 'agent-performance-comparison' ? 400 : 200}
                  />
                </ChartWrapper>
              </motion.div>
            )}
          </div>

          {/* Peak Hours Heatmap */}
          {stats.peakHours && stats.peakHours.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <ChartWrapper id="peak-hours" title={t('admin.analytics.peakHours')}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t('admin.analytics.peakHours')}</h2>
                </div>
                <div className="space-y-4 overflow-x-hidden">
                  <div className={`flex items-end justify-between gap-1 ${expandedChart === 'peak-hours' ? 'h-96' : 'h-64'}`}>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const hourData = stats.peakHours.find((h: any) => h.hour === hour);
                      const count = hourData?.count || 0;
                      const maxCount = Math.max(...stats.peakHours.map((h: any) => h.count), 1);
                      const height = (count / maxCount) * 100;
                      return (
                        <div key={hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                          <div
                            className="w-full bg-primary rounded-t"
                            style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                            title={`${hour}:00 - ${count} tickets`}
                          ></div>
                          {hour % 4 === 0 && (
                            <span className="text-[10px] text-muted-foreground mt-1">{hour}h</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.peakHours.reduce((sum: number, h: any) => sum + h.count, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('admin.analytics.totalTickets')}</p>
                  </div>
                </div>
              </ChartWrapper>
            </motion.div>
          )}
        </div>

        {/* Performance Metrics Summary */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">{t('admin.avgWaitTime')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.avgWaitTime || 0}
              <span className="text-xl text-muted-foreground ml-2">{t('customer.minutes')}</span>
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">{t('admin.avgServiceTime')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.avgServiceTime || 0}
              <span className="text-xl text-muted-foreground ml-2">{t('customer.minutes')}</span>
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-muted-foreground">{t('admin.abandonmentRate')}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.abandonmentRate?.toFixed(1) || 0}
              <span className="text-xl text-muted-foreground ml-2">%</span>
            </p>
          </div>
        </motion.div>

        {/* Expanded Chart Modals */}
        <AnimatePresence>
          {expandedChart && (
            <>
              {expandedChart === 'status-distribution' && (
                <ExpandedChartModal id="status-distribution" title={t('admin.analytics.statusDistribution')}>
                  <PieChart
                    data={stats.statusDistribution?.map((s: any) => ({
                      label: s.label,
                      value: s.value,
                      color: s.status === 'completed' ? 'var(--chart-3)' :
                        s.status === 'pending' ? '#f59e0b' :
                          s.status === 'serving' ? '#10b981' :
                            s.status === 'hold' ? '#ef4444' :
                              s.status === 'no_show' ? '#8b5cf6' :
                                'var(--muted-foreground)',
                    })) || []}
                    title=""
                    size={400}
                  />
                </ExpandedChartModal>
              )}
              {expandedChart === 'daily-trends' && (
                <ExpandedChartModal id="daily-trends" title={t('admin.analytics.dailyTrends')}>
                  <AreaChart
                    data={stats.dailyTrends?.map((d: any) => ({
                      label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      value: d.total,
                    })) || []}
                    title=""
                    height={400}
                    color="var(--chart-2)"
                  />
                </ExpandedChartModal>
              )}
              {expandedChart === 'hourly-distribution' && (
                <ExpandedChartModal id="hourly-distribution" title={t('admin.analytics.hourlyDistribution')}>
                  <BarChart
                    data={stats.hourlyDistribution?.map((h: any) => ({
                      label: `${h.hour}:00`,
                      value: h.count,
                      color: 'var(--chart-1)',
                    })) || []}
                    height={400}
                  />
                </ExpandedChartModal>
              )}
              {expandedChart === 'day-of-week' && (
                <ExpandedChartModal id="day-of-week" title={t('admin.analytics.dayOfWeekDistribution')}>
                  <BarChart
                    data={stats.dayOfWeekDistribution?.map((d: any) => ({
                      label: d.day,
                      value: d.count,
                      color: 'var(--chart-4)',
                    })) || []}
                    height={400}
                  />
                </ExpandedChartModal>
              )}
              {expandedChart === 'service-performance' && (
                <ExpandedChartModal id="service-performance" title={t('admin.analytics.servicePerformance')}>
                  <BarChart
                    data={stats.servicePerformance?.map((s: any) => ({
                      label: s.categoryName,
                      value: s.totalTickets,
                      color: 'var(--chart-2)',
                    })) || []}
                    height={400}
                  />
                </ExpandedChartModal>
              )}
              {expandedChart === 'agent-performance-comparison' && (
                <ExpandedChartModal id="agent-performance-comparison" title={t('admin.analytics.agentPerformanceComparison')}>
                  <BarChart
                    data={stats.agentPerformance?.map((a: any) => ({
                      label: a.agentName,
                      value: a.completedTickets,
                      color: 'var(--chart-3)',
                    })) || []}
                    height={400}
                  />
                </ExpandedChartModal>
              )}
              {expandedChart === 'peak-hours' && stats.peakHours && (
                <ExpandedChartModal id="peak-hours" title={t('admin.analytics.peakHours')}>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between gap-1 h-96">
                      {Array.from({ length: 24 }, (_, hour) => {
                        const hourData = stats.peakHours.find((h: any) => h.hour === hour);
                        const count = hourData?.count || 0;
                        const maxCount = Math.max(...stats.peakHours.map((h: any) => h.count), 1);
                        const height = (count / maxCount) * 100;
                        return (
                          <div key={hour} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                            <div
                              className="w-full bg-primary rounded-t"
                              style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                              title={`${hour}:00 - ${count} tickets`}
                            ></div>
                            <span className="text-xs text-muted-foreground mt-1">{hour}h</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pt-4 border-t border-border">
                      <p className="text-2xl font-bold text-foreground">
                        {stats.peakHours.reduce((sum: number, h: any) => sum + h.count, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('admin.analytics.totalTickets')}</p>
                    </div>
                  </div>
                </ExpandedChartModal>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
