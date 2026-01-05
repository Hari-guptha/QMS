'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Loader2,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText,
  X,
} from 'lucide-react';
import React from 'react';

const WIDGETS = [
  { id: 'summary', label: 'Summary Metrics', default: true },
  { id: 'ticket-counts', label: 'Ticket Counts', default: true },
  { id: 'service-performance', label: 'Service Performance', default: true },
  { id: 'agent-performance', label: 'Agent Performance', default: true },
  { id: 'daily-trends', label: 'Daily Trends', default: true },
  { id: 'hourly-distribution', label: 'Hourly Distribution', default: false },
  { id: 'day-of-week', label: 'Day of Week Distribution', default: false },
  { id: 'status-distribution', label: 'Status Distribution', default: false },
  { id: 'peak-hours', label: 'Peak Hours', default: false },
  { id: 'category-stats', label: 'Category Stats', default: false },
];

export default function ExportAnalytics() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [startDate, setStartDate] = useState<string>(() => {
    try {
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
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(
    new Set(WIDGETS.filter(w => w.default).map(w => w.id))
  );

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    updateDateRange();
  }, [dateFilter]);

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
        return;
      default:
        start = new Date(today);
        start.setHours(0, 0, 0, 0);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const toggleWidget = (widgetId: string) => {
    const newSet = new Set(selectedWidgets);
    if (newSet.has(widgetId)) {
      newSet.delete(widgetId);
    } else {
      newSet.add(widgetId);
    }
    setSelectedWidgets(newSet);
  };

  const selectAllWidgets = () => {
    setSelectedWidgets(new Set(WIDGETS.map(w => w.id)));
  };

  const deselectAllWidgets = () => {
    setSelectedWidgets(new Set());
  };

  const handleExport = async () => {
    if (selectedWidgets.size === 0) {
      alert('Please select at least one widget to export.');
      return;
    }

    try {
      setLoading(true);
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
        if (selectedWidgets.has('summary')) {
          parts.push(`${t('admin.analytics.table.totals') || 'Metric'},${t('common.value') || 'Value'}`);
          if (d.avgWaitTime !== undefined) parts.push(`${t('admin.avgWaitTime') || 'Avg Wait Time'},${d.avgWaitTime}`);
          if (d.avgServiceTime !== undefined) parts.push(`${t('admin.avgServiceTime') || 'Avg Service Time'},${d.avgServiceTime}`);
          if (d.abandonmentRate !== undefined) parts.push(`${t('admin.abandonmentRate') || 'Abandonment Rate'},${d.abandonmentRate}`);
          parts.push('');
        }

        // Ticket counts
        if (selectedWidgets.has('ticket-counts') && d.ticketCounts) {
          parts.push(t('admin.analytics.statusDistribution') || 'Ticket Status Distribution');
          parts.push('Status,Count');
          Object.entries(d.ticketCounts).forEach(([k, v]) => parts.push(`${k},${v}`));
          parts.push('');
        }

        // Service performance
        if (selectedWidgets.has('service-performance') && d.servicePerformance && d.servicePerformance.length > 0) {
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

        // Category stats
        if (selectedWidgets.has('category-stats') && d.categoryStats && d.categoryStats.length > 0) {
          parts.push('Category Stats');
          parts.push(['Category', 'Total Tickets', 'Avg Total Time'].join(','));
          d.categoryStats.forEach((c: any) => {
            parts.push([c.categoryName, c.totalTickets, c.avgTotalTime].join(','));
          });
          parts.push('');
        }

        // Agent detailed performance
        if (selectedWidgets.has('agent-performance') && d.agentPerformance && d.agentPerformance.length > 0) {
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
        if (selectedWidgets.has('daily-trends') && d.dailyTrends && d.dailyTrends.length > 0) {
          parts.push(t('admin.analytics.dailyTrends') || 'Daily Ticket Trends');
          parts.push(['Date', 'Total', 'Completed', 'Pending'].join(','));
          d.dailyTrends.forEach((r: any) => parts.push([r.date, r.total, r.completed, r.pending].join(',')));
          parts.push('');
        }

        // Hourly distribution
        if (selectedWidgets.has('hourly-distribution') && d.hourlyDistribution && d.hourlyDistribution.length > 0) {
          parts.push(t('admin.analytics.hourlyDistribution') || 'Hourly Distribution');
          parts.push(['Hour', 'Count'].join(','));
          d.hourlyDistribution.forEach((h: any) => parts.push([h.hour, h.count].join(',')));
          parts.push('');
        }

        // Day of week
        if (selectedWidgets.has('day-of-week') && d.dayOfWeekDistribution && d.dayOfWeekDistribution.length > 0) {
          parts.push(t('admin.analytics.dayOfWeekDistribution') || 'Day of Week Distribution');
          parts.push(['Day', 'Count'].join(','));
          d.dayOfWeekDistribution.forEach((d2: any) => parts.push([d2.day, d2.count].join(',')));
          parts.push('');
        }

        // Status distribution
        if (selectedWidgets.has('status-distribution') && d.statusDistribution && d.statusDistribution.length > 0) {
          parts.push(t('admin.analytics.statusDistribution') || 'Status Distribution');
          parts.push(['Label', 'Value'].join(','));
          d.statusDistribution.forEach((s: any) => parts.push([s.label, s.value].join(',')));
          parts.push('');
        }

        // Peak hours
        if (selectedWidgets.has('peak-hours') && d.peakHours && d.peakHours.length > 0) {
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
        window.URL.revokeObjectURL(url);
      } else {
        // PDF: open printable window
        const popup = window.open('', '_blank');
        if (!popup) throw new Error('Unable to open print window');
        const dir = document.documentElement.dir || 'ltr';
        const lang = document.documentElement.lang || 'en';
        const d = data.dashboard || {};
        
        let htmlContent = `
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
              <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        `;

        if (selectedWidgets.has('summary')) {
          htmlContent += `
            <h2>${t('admin.analytics.table.totals') || 'Summary'}</h2>
            <table>
              <tbody>
                <tr><th>${t('admin.analytics.table.totals') || 'Metric'}</th><th>${t('common.value') || 'Value'}</th></tr>
                ${d.avgWaitTime !== undefined ? `<tr><td>${t('admin.avgWaitTime') || 'Avg Wait Time'}</td><td>${d.avgWaitTime}</td></tr>` : ''}
                ${d.avgServiceTime !== undefined ? `<tr><td>${t('admin.avgServiceTime') || 'Avg Service Time'}</td><td>${d.avgServiceTime}</td></tr>` : ''}
                ${d.abandonmentRate !== undefined ? `<tr><td>${t('admin.abandonmentRate') || 'Abandonment Rate'}</td><td>${d.abandonmentRate}</td></tr>` : ''}
              </tbody>
            </table>
          `;
        }

        if (selectedWidgets.has('ticket-counts') && d.ticketCounts) {
          htmlContent += `
            <h2>${t('admin.analytics.statusDistribution') || 'Ticket Status Distribution'}</h2>
            <table>
              <thead><tr><th>${t('common.status') || 'Status'}</th><th>${t('common.value') || 'Value'}</th></tr></thead>
              <tbody>
                ${Object.entries(d.ticketCounts).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}
              </tbody>
            </table>
          `;
        }

        if (selectedWidgets.has('service-performance') && d.servicePerformance && d.servicePerformance.length > 0) {
          htmlContent += `
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
          `;
        }

        if (selectedWidgets.has('agent-performance') && d.agentPerformance && d.agentPerformance.length > 0) {
          htmlContent += `
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
          `;
        }

        if (selectedWidgets.has('daily-trends') && d.dailyTrends && d.dailyTrends.length > 0) {
          htmlContent += `
            <h2>${t('admin.analytics.dailyTrends') || 'Daily Trends'}</h2>
            <table>
              <thead><tr><th>Date</th><th>Total</th><th>Completed</th><th>Pending</th></tr></thead>
              <tbody>
                ${d.dailyTrends.map((r: any) => `<tr><td>${r.date}</td><td>${r.total}</td><td>${r.completed}</td><td>${r.pending}</td></tr>`).join('')}
              </tbody>
            </table>
          `;
        }

        htmlContent += `
            </body>
          </html>
        `;

        popup.document.write(htmlContent);
        popup.document.close();
        setTimeout(() => {
          popup.focus();
          popup.print();
        }, 500);
      }
    } catch (error) {
      console.error(error);
      alert('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <Download className="w-6 h-6 text-chart-2" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Export Analytics</h1>
          </div>
        </motion.div>

        {/* Date Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Range
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Period:</span>
              <div className="flex items-center gap-2 border border-border rounded-lg p-1">
                <button
                  onClick={() => setDateFilter('day')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    dateFilter === 'day'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    dateFilter === 'week'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    dateFilter === 'month'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateFilter('custom')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    dateFilter === 'custom'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Widget Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Select Widgets to Export
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllWidgets}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAllWidgets}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {WIDGETS.map((widget) => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-colors text-left ${
                  selectedWidgets.has(widget.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                {selectedWidgets.has(widget.id) ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium text-foreground">{widget.label}</span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Selected: {selectedWidgets.size} of {WIDGETS.length} widgets
          </p>
        </motion.div>

        {/* Export Format */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">Export Format</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setExportFormat('excel')}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                exportFormat === 'excel'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Excel (CSV)</span>
            </button>
            <button
              onClick={() => setExportFormat('pdf')}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                exportFormat === 'pdf'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>PDF</span>
            </button>
          </div>
        </motion.div>

        {/* Export Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={loading || selectedWidgets.size === 0}
            className="flex items-center gap-2 bg-chart-2 text-white px-8 py-4 rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export Analytics
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

