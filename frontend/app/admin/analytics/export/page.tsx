'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getAdminNavItems } from '@/lib/admin-nav-items';
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
  Users,
  FolderOpen,
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
  const [categories, setCategories] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    updateDateRange();
    loadCategories();
    loadAgents();
  }, [dateFilter]);

  const loadCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await adminApi.getAgents();
      setAgents(response.data || []);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newSet = new Set(selectedCategories);
    if (newSet.has(categoryId)) {
      newSet.delete(categoryId);
    } else {
      newSet.add(categoryId);
    }
    setSelectedCategories(newSet);
  };

  const toggleAgent = (agentId: string) => {
    const newSet = new Set(selectedAgents);
    if (newSet.has(agentId)) {
      newSet.delete(agentId);
    } else {
      newSet.add(agentId);
    }
    setSelectedAgents(newSet);
  };

  const selectAllCategories = () => {
    setSelectedCategories(new Set(categories.map(c => c.id)));
  };

  const deselectAllCategories = () => {
    setSelectedCategories(new Set());
  };

  const selectAllAgents = () => {
    setSelectedAgents(new Set(agents.map(a => a.id)));
  };

  const deselectAllAgents = () => {
    setSelectedAgents(new Set());
  };

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

      // Helper: safely format value for CSV/display
      const safeValue = (v: any): string => {
        if (v === null || v === undefined || v === '') return '';
        if (typeof v === 'number') {
          if (isNaN(v)) return '';
          return String(v);
        }
        return String(v).replace(/"/g, '""');
      };

      // Helper: format number with 2 decimals if needed
      const formatNumber = (v: any): string => {
        if (v === null || v === undefined || v === '') return '';
        if (typeof v === 'number') {
          if (isNaN(v)) return '';
          return v % 1 === 0 ? String(v) : v.toFixed(2);
        }
        return String(v);
      };

      let d = data.dashboard || {};

      // Filter data based on selected categories
      if (selectedCategories.size > 0) {
        const categoryIds = Array.from(selectedCategories);
        if (d.servicePerformance) {
          d.servicePerformance = d.servicePerformance.filter((s: any) => 
            categoryIds.includes(s.categoryId)
          );
        }
        if (d.categoryStats) {
          d.categoryStats = d.categoryStats.filter((c: any) => 
            categoryIds.includes(c.categoryId)
          );
        }
      }

      // Filter data based on selected agents
      if (selectedAgents.size > 0) {
        const agentIds = Array.from(selectedAgents);
        if (d.agentPerformance) {
          d.agentPerformance = d.agentPerformance.filter((a: any) => 
            agentIds.includes(a.agentId)
          );
        }
      }

      if (exportFormat === 'excel') {
        const parts: string[] = [];

        // Summary metrics
        if (selectedWidgets.has('summary')) {
          parts.push(`${t('admin.analytics.table.totals') || 'Metric'},${t('common.value') || 'Value'}`);
          if (d.avgWaitTime !== undefined && d.avgWaitTime !== null) {
            parts.push(`${t('admin.avgWaitTime') || 'Avg Wait Time'},${formatNumber(d.avgWaitTime)}`);
          }
          if (d.avgServiceTime !== undefined && d.avgServiceTime !== null) {
            parts.push(`${t('admin.avgServiceTime') || 'Avg Service Time'},${formatNumber(d.avgServiceTime)}`);
          }
          if (d.abandonmentRate !== undefined && d.abandonmentRate !== null) {
            parts.push(`${t('admin.abandonmentRate') || 'Abandonment Rate'},${formatNumber(d.abandonmentRate)}`);
          }
          parts.push('');
        }

        // Ticket counts
        if (selectedWidgets.has('ticket-counts') && d.ticketCounts) {
          parts.push(t('admin.analytics.statusDistribution') || 'Ticket Status Distribution');
          parts.push('Status,Count');
          Object.entries(d.ticketCounts).forEach(([k, v]) => {
            const count = v !== null && v !== undefined ? String(v) : '0';
            parts.push(`"${safeValue(k)}",${count}`);
          });
          parts.push('');
        }

        // Service performance
        if (selectedWidgets.has('service-performance') && d.servicePerformance && d.servicePerformance.length > 0) {
          parts.push(t('admin.analytics.servicePerformance') || 'Service Performance');
          parts.push([t('admin.analytics.category'), t('admin.analytics.total'), t('admin.analytics.pending'), t('admin.analytics.serving'), t('admin.analytics.hold'), t('admin.analytics.completed'), t('admin.analytics.avgTotalTime'), t('admin.analytics.avgServiceTime'), t('admin.analytics.completionRate')].join(','));
          d.servicePerformance.forEach((s: any) => {
            parts.push([
              `"${safeValue(s.categoryName || 'N/A')}"`,
              safeValue(s.totalTickets || 0),
              safeValue(s.pendingTickets || 0),
              safeValue(s.servingTickets || 0),
              safeValue(s.holdTickets || 0),
              safeValue(s.completedTickets || 0),
              formatNumber(s.avgTotalTime),
              formatNumber(s.avgServiceTime),
              s.completionRate !== null && s.completionRate !== undefined ? formatNumber(s.completionRate) + '%' : '0%',
            ].join(','));
          });
          parts.push('');
        }

        // Category stats
        if (selectedWidgets.has('category-stats') && d.categoryStats && d.categoryStats.length > 0) {
          parts.push(t('admin.analytics.widget.categoryStats'));
          parts.push([t('admin.analytics.category'), t('admin.analytics.totalTickets'), t('admin.analytics.avgTotalTime')].join(','));
          d.categoryStats.forEach((c: any) => {
            parts.push([
              `"${safeValue(c.categoryName || 'N/A')}"`,
              safeValue(c.totalTickets || 0),
              formatNumber(c.avgTotalTime),
            ].join(','));
          });
          parts.push('');
        }

        // Agent detailed performance
        if (selectedWidgets.has('agent-performance') && d.agentPerformance && d.agentPerformance.length > 0) {
          parts.push(t('admin.analytics.agentPerformance') || 'Agent Performance');
          parts.push([t('admin.analytics.table.agent'), t('admin.analytics.total'), t('admin.analytics.pending'), t('admin.analytics.serving'), t('admin.analytics.hold'), t('admin.analytics.completed'), t('admin.analytics.avgWait'), t('admin.analytics.avgCalledToServing'), t('admin.analytics.avgServiceTime'), t('admin.analytics.avgTotal'), t('admin.analytics.completionRate')].join(','));
          d.agentPerformance.forEach((a: any) => {
            parts.push([
              `"${safeValue(a.agentName || 'N/A')}"`,
              safeValue(a.totalTickets || 0),
              safeValue(a.pendingTickets || 0),
              safeValue(a.servingTickets || 0),
              safeValue(a.holdTickets || 0),
              safeValue(a.completedTickets || 0),
              formatNumber(a.avgWaitTime),
              formatNumber(a.avgCalledToServingTime),
              formatNumber(a.avgServiceTime),
              formatNumber(a.avgTotalTime),
              a.completionRate !== null && a.completionRate !== undefined ? formatNumber(a.completionRate) + '%' : '0%',
            ].join(','));
          });
          parts.push('');
        }

        // Daily trends
        if (selectedWidgets.has('daily-trends') && d.dailyTrends && d.dailyTrends.length > 0) {
          parts.push(t('admin.analytics.dailyTrends') || 'Daily Ticket Trends');
          parts.push(['Date', 'Total', 'Completed', 'Pending'].join(','));
          d.dailyTrends.forEach((r: any) => {
            parts.push([
              safeValue(r.date || ''),
              safeValue(r.total || 0),
              safeValue(r.completed || 0),
              safeValue(r.pending || 0),
            ].join(','));
          });
          parts.push('');
        }

        // Hourly distribution
        if (selectedWidgets.has('hourly-distribution') && d.hourlyDistribution && d.hourlyDistribution.length > 0) {
          parts.push(t('admin.analytics.hourlyDistribution') || 'Hourly Distribution');
          parts.push(['Hour', 'Count'].join(','));
          d.hourlyDistribution.forEach((h: any) => {
            parts.push([
              safeValue(h.hour || ''),
              safeValue(h.count || 0),
            ].join(','));
          });
          parts.push('');
        }

        // Day of week
        if (selectedWidgets.has('day-of-week') && d.dayOfWeekDistribution && d.dayOfWeekDistribution.length > 0) {
          parts.push(t('admin.analytics.dayOfWeekDistribution') || 'Day of Week Distribution');
          parts.push(['Day', 'Count'].join(','));
          d.dayOfWeekDistribution.forEach((d2: any) => {
            parts.push([
              `"${safeValue(d2.day || '')}"`,
              safeValue(d2.count || 0),
            ].join(','));
          });
          parts.push('');
        }

        // Status distribution
        if (selectedWidgets.has('status-distribution') && d.statusDistribution && d.statusDistribution.length > 0) {
          parts.push(t('admin.analytics.statusDistribution') || 'Status Distribution');
          parts.push(['Status', 'Count'].join(','));
          d.statusDistribution.forEach((s: any) => {
            parts.push([
              `"${safeValue(s.label || s.status || '')}"`,
              safeValue(s.value || s.count || 0),
            ].join(','));
          });
          parts.push('');
        }

        // Peak hours
        if (selectedWidgets.has('peak-hours') && d.peakHours && d.peakHours.length > 0) {
          parts.push(t('admin.analytics.peakHours') || 'Peak Hours');
          parts.push(['Hour', 'Count'].join(','));
          d.peakHours.forEach((p: any) => {
            parts.push([
              safeValue(p.hour || ''),
              safeValue(p.count || 0),
            ].join(','));
          });
          parts.push('');
        }

        const csv = parts.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        let fileNameSuffix = startDate && endDate ? `${startDate}_to_${endDate}` : new Date().toISOString().split('T')[0];
        if (selectedCategories.size > 0) {
          fileNameSuffix += `_${selectedCategories.size}services`;
        }
        if (selectedAgents.size > 0) {
          fileNameSuffix += `_${selectedAgents.size}agents`;
        }
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
              <p><strong>${t('admin.analytics.period')}</strong> ${startDate} ${t('admin.analytics.to')} ${endDate}</p>
              ${selectedCategories.size > 0 ? `<p><strong>${t('admin.analytics.servicesLabel')}:</strong> ${categories.filter((c: any) => selectedCategories.has(c.id)).map((c: any) => c.name).join(', ')}</p>` : ''}
              ${selectedAgents.size > 0 ? `<p><strong>${t('admin.analytics.agentsLabel')}:</strong> ${agents.filter((a: any) => selectedAgents.has(a.id)).map((a: any) => a.name || a.email || t('admin.analytics.unknown')).join(', ')}</p>` : ''}
        `;

        if (selectedWidgets.has('summary')) {
          htmlContent += `
            <h2>${t('admin.analytics.table.totals') || 'Summary'}</h2>
            <table>
              <tbody>
                <tr><th>${t('admin.analytics.table.totals') || 'Metric'}</th><th>${t('common.value') || 'Value'}</th></tr>
                ${d.avgWaitTime !== undefined && d.avgWaitTime !== null ? `<tr><td>${t('admin.avgWaitTime') || 'Avg Wait Time'}</td><td>${formatNumber(d.avgWaitTime)}</td></tr>` : ''}
                ${d.avgServiceTime !== undefined && d.avgServiceTime !== null ? `<tr><td>${t('admin.avgServiceTime') || 'Avg Service Time'}</td><td>${formatNumber(d.avgServiceTime)}</td></tr>` : ''}
                ${d.abandonmentRate !== undefined && d.abandonmentRate !== null ? `<tr><td>${t('admin.abandonmentRate') || 'Abandonment Rate'}</td><td>${formatNumber(d.abandonmentRate)}</td></tr>` : ''}
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
                ${Object.entries(d.ticketCounts).map(([k, v]) => `<tr><td>${k || 'N/A'}</td><td>${v !== null && v !== undefined ? v : 0}</td></tr>`).join('')}
              </tbody>
            </table>
          `;
        }

        if (selectedWidgets.has('service-performance') && d.servicePerformance && d.servicePerformance.length > 0) {
          htmlContent += `
            <h2>${t('admin.analytics.servicePerformance') || 'Service Performance'}</h2>
            <table>
              <thead><tr><th>${t('admin.analytics.category')}</th><th>${t('admin.analytics.total')}</th><th>${t('admin.analytics.pending')}</th><th>${t('admin.analytics.serving')}</th><th>${t('admin.analytics.hold')}</th><th>${t('admin.analytics.completed')}</th><th>${t('admin.analytics.avgTotal')}</th><th>${t('admin.analytics.avgService')}</th><th>${t('admin.analytics.completion')}</th></tr></thead>
              <tbody>
                ${d.servicePerformance.map((s: any) => `
                  <tr>
                    <td>${s.categoryName || 'N/A'}</td>
                    <td>${s.totalTickets !== null && s.totalTickets !== undefined ? s.totalTickets : 0}</td>
                    <td>${s.pendingTickets !== null && s.pendingTickets !== undefined ? s.pendingTickets : 0}</td>
                    <td>${s.servingTickets !== null && s.servingTickets !== undefined ? s.servingTickets : 0}</td>
                    <td>${s.holdTickets !== null && s.holdTickets !== undefined ? s.holdTickets : 0}</td>
                    <td>${s.completedTickets !== null && s.completedTickets !== undefined ? s.completedTickets : 0}</td>
                    <td>${formatNumber(s.avgTotalTime)}</td>
                    <td>${formatNumber(s.avgServiceTime)}</td>
                    <td>${s.completionRate !== null && s.completionRate !== undefined ? formatNumber(s.completionRate) + '%' : '0%'}</td>
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
              <thead><tr><th>${t('admin.analytics.table.agent')}</th><th>${t('admin.analytics.total')}</th><th>${t('admin.analytics.pending')}</th><th>${t('admin.analytics.serving')}</th><th>${t('admin.analytics.hold')}</th><th>${t('admin.analytics.completed')}</th><th>${t('admin.analytics.avgWait')}</th><th>${t('admin.analytics.avgCalledToServing')}</th><th>${t('admin.analytics.avgServiceTime')}</th><th>${t('admin.analytics.avgTotal')}</th><th>${t('admin.analytics.completion')}</th></tr></thead>
              <tbody>
                ${d.agentPerformance.map((a: any) => `
                  <tr>
                    <td>${a.agentName || 'N/A'}</td>
                    <td>${a.totalTickets !== null && a.totalTickets !== undefined ? a.totalTickets : 0}</td>
                    <td>${a.pendingTickets !== null && a.pendingTickets !== undefined ? a.pendingTickets : 0}</td>
                    <td>${a.servingTickets !== null && a.servingTickets !== undefined ? a.servingTickets : 0}</td>
                    <td>${a.holdTickets !== null && a.holdTickets !== undefined ? a.holdTickets : 0}</td>
                    <td>${a.completedTickets !== null && a.completedTickets !== undefined ? a.completedTickets : 0}</td>
                    <td>${formatNumber(a.avgWaitTime)}</td>
                    <td>${formatNumber(a.avgCalledToServingTime)}</td>
                    <td>${formatNumber(a.avgServiceTime)}</td>
                    <td>${formatNumber(a.avgTotalTime)}</td>
                    <td>${a.completionRate !== null && a.completionRate !== undefined ? formatNumber(a.completionRate) + '%' : '0%'}</td>
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
                ${d.dailyTrends.map((r: any) => `<tr><td>${r.date || 'N/A'}</td><td>${r.total !== null && r.total !== undefined ? r.total : 0}</td><td>${r.completed !== null && r.completed !== undefined ? r.completed : 0}</td><td>${r.pending !== null && r.pending !== undefined ? r.pending : 0}</td></tr>`).join('')}
              </tbody>
            </table>
          `;
        }

        if (selectedWidgets.has('category-stats') && d.categoryStats && d.categoryStats.length > 0) {
          htmlContent += `
            <h2>${t('admin.analytics.widget.categoryStats')}</h2>
            <table>
              <thead><tr><th>${t('admin.analytics.category')}</th><th>${t('admin.analytics.totalTickets')}</th><th>${t('admin.analytics.avgTotalTime')}</th></tr></thead>
              <tbody>
                ${d.categoryStats.map((c: any) => `
                  <tr>
                    <td>${c.categoryName || 'N/A'}</td>
                    <td>${c.totalTickets !== null && c.totalTickets !== undefined ? c.totalTickets : 0}</td>
                    <td>${formatNumber(c.avgTotalTime)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }

        if (selectedWidgets.has('hourly-distribution') && d.hourlyDistribution && d.hourlyDistribution.length > 0) {
          htmlContent += `
            <h2>${t('admin.analytics.hourlyDistribution') || 'Hourly Distribution'}</h2>
            <table>
              <thead><tr><th>Hour</th><th>Count</th></tr></thead>
              <tbody>
                ${d.hourlyDistribution.map((h: any) => `<tr><td>${h.hour || 'N/A'}</td><td>${h.count !== null && h.count !== undefined ? h.count : 0}</td></tr>`).join('')}
              </tbody>
            </table>
          `;
        }

        if (selectedWidgets.has('day-of-week') && d.dayOfWeekDistribution && d.dayOfWeekDistribution.length > 0) {
          htmlContent += `
            <h2>${t('admin.analytics.dayOfWeekDistribution') || 'Day of Week Distribution'}</h2>
            <table>
              <thead><tr><th>Day</th><th>Count</th></tr></thead>
              <tbody>
                ${d.dayOfWeekDistribution.map((d2: any) => `<tr><td>${d2.day || 'N/A'}</td><td>${d2.count !== null && d2.count !== undefined ? d2.count : 0}</td></tr>`).join('')}
              </tbody>
            </table>
          `;
        }

        if (selectedWidgets.has('status-distribution') && d.statusDistribution && d.statusDistribution.length > 0) {
          htmlContent += `
            <h2>${t('admin.analytics.statusDistribution') || 'Status Distribution'}</h2>
            <table>
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>
                ${d.statusDistribution.map((s: any) => `<tr><td>${s.label || s.status || 'N/A'}</td><td>${s.value !== null && s.value !== undefined ? s.value : (s.count !== null && s.count !== undefined ? s.count : 0)}</td></tr>`).join('')}
              </tbody>
            </table>
          `;
        }

        if (selectedWidgets.has('peak-hours') && d.peakHours && d.peakHours.length > 0) {
          htmlContent += `
            <h2>${t('admin.analytics.peakHours') || 'Peak Hours'}</h2>
            <table>
              <thead><tr><th>Hour</th><th>Count</th></tr></thead>
              <tbody>
                ${d.peakHours.map((p: any) => `<tr><td>${p.hour || 'N/A'}</td><td>${p.count !== null && p.count !== undefined ? p.count : 0}</td></tr>`).join('')}
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

  const adminNavItems = getAdminNavItems(t);

  return (
    <DashboardLayout navItems={adminNavItems} role="admin">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
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
            {t('admin.analytics.backToAnalytics')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <Download className="w-6 h-6 text-chart-2" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">{t('admin.analytics.exportAnalytics')}</h1>
          </div>
        </motion.div>

        {/* Service/Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            {t('admin.analytics.filterByServices')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('admin.analytics.selectServicesDesc')}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {t('admin.analytics.selected')}: {selectedCategories.size} {t('admin.analytics.of')} {categories.length} {t('admin.analytics.services')}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllCategories}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.selectAll')}
              </button>
              <button
                onClick={deselectAllCategories}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.clear')}
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
            {loadingData ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('admin.analytics.noCategoriesAvailable')}</p>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors text-left ${
                    selectedCategories.has(category.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  {selectedCategories.has(category.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{category.name}</span>
                    {category.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Agent Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('admin.analytics.filterByAgents')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('admin.analytics.selectAgentsDesc')}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {t('admin.analytics.selected')}: {selectedAgents.size} {t('admin.analytics.of')} {agents.length} {t('admin.analytics.agents')}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllAgents}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.selectAll')}
              </button>
              <button
                onClick={deselectAllAgents}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.clear')}
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
            {loadingData ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : agents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('admin.analytics.noAgentsAvailable')}</p>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => toggleAgent(agent.id)}
                  className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors text-left ${
                    selectedAgents.has(agent.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  {selectedAgents.has(agent.id) ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {agent.name || agent.email || t('admin.analytics.unknownAgent')}
                    </span>
                    {agent.email && agent.name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{agent.email}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Date Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('admin.analytics.dateRange')}
          </h2>
          <div className="space-y-4">
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

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>
        </motion.div>

        {/* Widget Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              {t('admin.analytics.selectWidgetsToExport')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllWidgets}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.selectAll')}
              </button>
              <button
                onClick={deselectAllWidgets}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.deselectAll')}
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
                <span className="text-sm font-medium text-foreground">
                  {(() => {
                    const widgetKeyMap: { [key: string]: string } = {
                      'summary': 'admin.analytics.widget.summary',
                      'ticket-counts': 'admin.analytics.widget.ticketCounts',
                      'service-performance': 'admin.analytics.widget.servicePerformance',
                      'agent-performance': 'admin.analytics.widget.agentPerformance',
                      'daily-trends': 'admin.analytics.widget.dailyTrends',
                      'hourly-distribution': 'admin.analytics.widget.hourlyDistribution',
                      'day-of-week': 'admin.analytics.widget.dayOfWeekDistribution',
                      'status-distribution': 'admin.analytics.widget.statusDistribution',
                      'peak-hours': 'admin.analytics.widget.peakHours',
                      'category-stats': 'admin.analytics.widget.categoryStats',
                    };
                    return t(widgetKeyMap[widget.id] || widget.label);
                  })()}
                </span>
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {t('admin.analytics.selected')}: {selectedWidgets.size} {t('admin.analytics.of')} {WIDGETS.length} {t('admin.analytics.widgets')}
          </p>
        </motion.div>

        {/* Export Format */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">{t('admin.analytics.exportFormat')}</h2>
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
              <span>{t('admin.analytics.excelCsv')}</span>
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
              <span>{t('admin.analytics.pdf')}</span>
            </button>
          </div>
        </motion.div>

        {/* Export Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
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
                {t('admin.analytics.exporting')}
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                {t('admin.analytics.exportAnalyticsButton')}
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

