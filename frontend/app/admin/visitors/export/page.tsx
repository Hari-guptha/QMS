'use client';

import { useEffect, useState, useMemo } from 'react';
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
  FileSpreadsheet,
  FileText,
  X,
  Users,
  Ticket,
  CheckSquare,
  Square,
  FolderOpen,
  Search,
  UserCheck,
} from 'lucide-react';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  differenceInMinutes,
} from 'date-fns';

type DateFilter = 'day' | 'week' | 'month' | 'custom';
type ExportType = 'full' | 'visitor-only';
type ExportFormat = 'csv' | 'excel';

const STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'serving', label: 'Serving' },
  { id: 'completed', label: 'Completed' },
  { id: 'hold', label: 'Hold' },
];

export default function ExportVisitorsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');
  const [startDate, setStartDate] = useState<string>(() => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeekDate = new Date(today);
      startOfWeekDate.setDate(today.getDate() - dayOfWeek);
      startOfWeekDate.setHours(0, 0, 0, 0);
      return startOfWeekDate.toISOString().split('T')[0];
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
  const [exportType, setExportType] = useState<ExportType>('full');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [categories, setCategories] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [selectedVisitors, setSelectedVisitors] = useState<Set<string>>(new Set());
  const [serviceSearch, setServiceSearch] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [visitorSearch, setVisitorSearch] = useState('');

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    updateDateRange();
    loadCategories();
    loadAgents();
    loadVisitors();
  }, [router, dateFilter]);

  const updateDateRange = () => {
    const today = new Date();
    let start: Date;
    let end: Date;

    if (dateFilter === 'day') {
      start = startOfDay(today);
      end = endOfDay(today);
    } else if (dateFilter === 'week') {
      start = startOfWeek(today, { weekStartsOn: 0 });
      end = endOfWeek(today, { weekStartsOn: 0 });
    } else if (dateFilter === 'month') {
      start = startOfMonth(today);
      end = endOfMonth(today);
    } else {
      return;
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

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

  const loadVisitors = async () => {
    try {
      const response = await adminApi.getAllQueues();
      setVisitors(response.data || []);
    } catch (error) {
      console.error('Failed to load visitors:', error);
      setVisitors([]);
    }
  };

  // Get unique visitors by phone/email identifier
  const uniqueVisitors = useMemo(() => {
    const visitorMap = new Map<string, any>();
    
    visitors.forEach((visitor) => {
      const identifier = visitor.customerPhone || visitor.customerEmail || visitor.id;
      if (!visitorMap.has(identifier)) {
        visitorMap.set(identifier, {
          identifier,
          name: visitor.customerName || 'Anonymous',
          phone: visitor.customerPhone || '',
          email: visitor.customerEmail || '',
          id: visitor.id,
        });
      }
    });
    
    return Array.from(visitorMap.values());
  }, [visitors]);

  const filteredUniqueVisitors = useMemo(() => {
    if (!visitorSearch) return uniqueVisitors;
    const search = visitorSearch.toLowerCase();
    return uniqueVisitors.filter((visitor) => {
      return (
        visitor.name?.toLowerCase().includes(search) ||
        visitor.phone?.toLowerCase().includes(search) ||
        visitor.email?.toLowerCase().includes(search)
      );
    });
  }, [uniqueVisitors, visitorSearch]);

  const filteredVisitors = useMemo(() => {
    let filtered = visitors;

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((visitor) => {
        const visitDate = new Date(visitor.createdAt);
        return isWithinInterval(visitDate, { start, end });
      });
    }

    // Filter by status
    if (selectedStatuses.size > 0) {
      filtered = filtered.filter((visitor) => selectedStatuses.has(visitor.status));
    }

    // Filter by category
    if (selectedCategories.size > 0) {
      filtered = filtered.filter((visitor) =>
        visitor.categoryId && selectedCategories.has(visitor.categoryId)
      );
    }

    // Filter by agent
    if (selectedAgents.size > 0) {
      filtered = filtered.filter((visitor) =>
        visitor.agentId && selectedAgents.has(visitor.agentId)
      );
    }

    // Filter by visitor (by phone/email identifier)
    if (selectedVisitors.size > 0) {
      filtered = filtered.filter((visitor) => {
        const identifier = visitor.customerPhone || visitor.customerEmail || visitor.id;
        return selectedVisitors.has(identifier);
      });
    }

    return filtered;
  }, [visitors, startDate, endDate, selectedStatuses, selectedCategories, selectedAgents, selectedVisitors]);

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

  const toggleStatus = (status: string) => {
    const newSet = new Set(selectedStatuses);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setSelectedStatuses(newSet);
  };

  const selectAllCategories = () => {
    setSelectedCategories(new Set(categories.map((c) => c.id)));
  };

  const deselectAllCategories = () => {
    setSelectedCategories(new Set());
  };

  const selectAllAgents = () => {
    setSelectedAgents(new Set(agents.map((a) => a.id)));
  };

  const deselectAllAgents = () => {
    setSelectedAgents(new Set());
  };

  const selectAllStatuses = () => {
    setSelectedStatuses(new Set(STATUSES.map((s) => s.id)));
  };

  const deselectAllStatuses = () => {
    setSelectedStatuses(new Set());
  };

  const toggleVisitor = (visitorIdentifier: string) => {
    const newSet = new Set(selectedVisitors);
    if (newSet.has(visitorIdentifier)) {
      newSet.delete(visitorIdentifier);
    } else {
      newSet.add(visitorIdentifier);
    }
    setSelectedVisitors(newSet);
  };

  const selectAllVisitors = () => {
    setSelectedVisitors(new Set(uniqueVisitors.map((v) => v.identifier)));
  };

  const deselectAllVisitors = () => {
    setSelectedVisitors(new Set());
  };

  const filteredCategories = useMemo(() => {
    if (!serviceSearch) return categories;
    const search = serviceSearch.toLowerCase();
    return categories.filter((cat) =>
      cat.name?.toLowerCase().includes(search)
    );
  }, [categories, serviceSearch]);

  const filteredAgents = useMemo(() => {
    if (!agentSearch) return agents;
    const search = agentSearch.toLowerCase();
    return agents.filter((agent) => {
      const name = agent.firstName && agent.lastName
        ? `${agent.firstName} ${agent.lastName}`
        : agent.email || '';
      return name.toLowerCase().includes(search) ||
        agent.email?.toLowerCase().includes(search);
    });
  }, [agents, agentSearch]);

  const getVisitorHistory = (visitor: any) => {
    const identifier = visitor.customerPhone || visitor.customerEmail;
    if (!identifier) return [visitor];
    
    return visitors.filter((v) => 
      (v.customerPhone && v.customerPhone === identifier) ||
      (v.customerEmail && v.customerEmail === identifier)
    );
  };

  const calculateTotalServiceTime = (visits: any[]) => {
    return visits.reduce((total, visit) => {
      if (visit.servingStartedAt && visit.completedAt) {
        const start = parseISO(visit.servingStartedAt);
        const end = parseISO(visit.completedAt);
        return total + differenceInMinutes(end, start);
      }
      return total;
    }, 0);
  };

  const handleExport = async () => {
    if (filteredVisitors.length === 0) {
      alert(t('admin.visitors.export.noData') || 'No data to export. Please adjust your filters.');
      return;
    }

    try {
      setLoading(true);

      if (exportFormat === 'csv') {
        await exportToCSV();
      } else {
        await exportToExcel();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(t('admin.visitors.export.error') || 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    const safeValue = (v: any): string => {
      if (v === null || v === undefined || v === '') return '';
      if (typeof v === 'number') {
        if (isNaN(v)) return '';
        return String(v);
      }
      return String(v).replace(/"/g, '""');
    };

    const rows: string[] = [];

    if (exportType === 'full') {
      // Full export with ticket details and visitor history
      const headers = [
        'Visitor Name',
        'Phone',
        'Email',
        'Ticket Number',
        'Service',
        'Agent',
        'Status',
        'Check-in Time',
        'Called At',
        'Serving Started At',
        'Completed At',
        'Wait Time (minutes)',
        'Service Time (minutes)',
        'Total Visits',
        'Total Service Time (minutes)',
        'Notes',
      ];
      rows.push(headers.map((h) => `"${h}"`).join(','));

      filteredVisitors.forEach((visitor) => {
        const history = getVisitorHistory(visitor);
        const totalServiceTime = calculateTotalServiceTime(history);
        const waitTime = visitor.calledAt && visitor.servingStartedAt
          ? differenceInMinutes(parseISO(visitor.servingStartedAt), parseISO(visitor.calledAt))
          : '';
        const serviceTime = visitor.servingStartedAt && visitor.completedAt
          ? differenceInMinutes(parseISO(visitor.completedAt), parseISO(visitor.servingStartedAt))
          : '';

        const row = [
          safeValue(visitor.customerName || 'Anonymous'),
          safeValue(visitor.customerPhone),
          safeValue(visitor.customerEmail),
          safeValue(visitor.tokenNumber),
          safeValue(visitor.category?.name),
          safeValue(visitor.agent?.firstName && visitor.agent?.lastName
            ? `${visitor.agent.firstName} ${visitor.agent.lastName}`
            : visitor.agent?.email || ''),
          safeValue(visitor.status),
          safeValue(visitor.createdAt ? format(new Date(visitor.createdAt), 'yyyy-MM-dd HH:mm:ss') : ''),
          safeValue(visitor.calledAt ? format(new Date(visitor.calledAt), 'yyyy-MM-dd HH:mm:ss') : ''),
          safeValue(visitor.servingStartedAt ? format(new Date(visitor.servingStartedAt), 'yyyy-MM-dd HH:mm:ss') : ''),
          safeValue(visitor.completedAt ? format(new Date(visitor.completedAt), 'yyyy-MM-dd HH:mm:ss') : ''),
          safeValue(waitTime),
          safeValue(serviceTime),
          safeValue(history.length),
          safeValue(totalServiceTime),
          safeValue(visitor.note),
        ];
        rows.push(row.map((cell) => `"${cell}"`).join(','));
      });
    } else {
      // Visitor-only export (unique visitors with summary)
      const visitorMap = new Map<string, any>();

      filteredVisitors.forEach((visitor) => {
        const identifier = visitor.customerPhone || visitor.customerEmail || visitor.id;
        if (!visitorMap.has(identifier)) {
          const history = getVisitorHistory(visitor);
          const completedVisits = history.filter((v) => v.status === 'completed').length;
          const totalServiceTime = calculateTotalServiceTime(history);

          visitorMap.set(identifier, {
            name: visitor.customerName || 'Anonymous',
            phone: visitor.customerPhone || '',
            email: visitor.customerEmail || '',
            totalVisits: history.length,
            completedVisits,
            totalServiceTime,
            firstVisit: history[history.length - 1]?.createdAt || visitor.createdAt,
            lastVisit: history[0]?.createdAt || visitor.createdAt,
          });
        }
      });

      const headers = [
        'Visitor Name',
        'Phone',
        'Email',
        'Total Visits',
        'Completed Visits',
        'Total Service Time (minutes)',
        'First Visit',
        'Last Visit',
      ];
      rows.push(headers.map((h) => `"${h}"`).join(','));

      Array.from(visitorMap.values()).forEach((visitor) => {
        const row = [
          safeValue(visitor.name),
          safeValue(visitor.phone),
          safeValue(visitor.email),
          safeValue(visitor.totalVisits),
          safeValue(visitor.completedVisits),
          safeValue(visitor.totalServiceTime),
          safeValue(visitor.firstVisit ? format(new Date(visitor.firstVisit), 'yyyy-MM-dd HH:mm:ss') : ''),
          safeValue(visitor.lastVisit ? format(new Date(visitor.lastVisit), 'yyyy-MM-dd HH:mm:ss') : ''),
        ];
        rows.push(row.map((cell) => `"${cell}"`).join(','));
      });
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const fileNameSuffix = startDate && endDate ? `${startDate}_to_${endDate}` : new Date().toISOString().split('T')[0];
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-export-${exportType}-${fileNameSuffix}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    // For Excel export, we'll use a similar approach but create an Excel file
    // Since we don't have ExcelJS in frontend, we'll use CSV with .xlsx extension
    // or we can use a library. For now, let's use CSV format but with Excel-compatible structure
    await exportToCSV();
    // Note: For true Excel export, you'd need to use a library like exceljs or xlsx
    // For simplicity, we're using CSV which Excel can open
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
            href="/admin/visitors"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.visitors.backToVisitors') || 'Back to Visitors'}
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <Download className="w-6 h-6 text-chart-2" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              {t('admin.visitors.export.title') || 'Export Visitors'}
            </h1>
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
            {t('admin.analytics.dateRange') || 'Date Range'}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t('admin.analytics.period') || 'Period'}</span>
              <div className="flex items-center gap-2 border border-border rounded-lg p-1">
                <button
                  onClick={() => setDateFilter('day')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    dateFilter === 'day'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t('admin.analytics.today') || 'Today'}
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    dateFilter === 'week'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t('admin.analytics.thisWeek') || 'This Week'}
                </button>
                <button
                  onClick={() => setDateFilter('month')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    dateFilter === 'month'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t('admin.analytics.thisMonth') || 'This Month'}
                </button>
                <button
                  onClick={() => setDateFilter('custom')}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    dateFilter === 'custom'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t('admin.analytics.custom') || 'Custom'}
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
                <span className="text-muted-foreground">{t('admin.analytics.to') || 'to'}</span>
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

        {/* Status Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            {t('admin.visitors.status') || 'Ticket Status'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('admin.visitors.export.selectStatusesDesc') || 'Select specific ticket statuses to include in the export. Leave empty to include all statuses.'}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {t('admin.analytics.selected') || 'Selected'}: {selectedStatuses.size} {t('admin.analytics.of') || 'of'} {STATUSES.length} {t('admin.analytics.statuses') || 'statuses'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllStatuses}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.selectAll') || 'Select All'}
              </button>
              <button
                onClick={deselectAllStatuses}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.clear') || 'Clear'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STATUSES.map((status) => (
              <button
                key={status.id}
                onClick={() => toggleStatus(status.id)}
                className={`flex items-center gap-3 p-3 border rounded-lg transition-colors text-left ${
                  selectedStatuses.has(status.id)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                {selectedStatuses.has(status.id) ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{status.label}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Service/Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            {t('admin.analytics.filterByServices') || 'Filter by Services'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('admin.visitors.export.selectServicesDesc') || 'Select services to include in the export. Leave empty to include all services.'}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {t('admin.analytics.selected') || 'Selected'}: {selectedCategories.size} {t('admin.analytics.of') || 'of'} {categories.length} {t('admin.analytics.services') || 'services'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllCategories}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.selectAll') || 'Select All'}
              </button>
              <button
                onClick={deselectAllCategories}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.clear') || 'Clear'}
              </button>
            </div>
          </div>
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('admin.visitors.export.searchService') || 'Search services...'}
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {serviceSearch && (
              <button
                onClick={() => setServiceSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
            {loadingData ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('admin.visitors.export.noServicesFound') || 'No services found'}</p>
            ) : (
              filteredCategories.map((category) => (
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
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('admin.analytics.filterByAgents') || 'Filter by Agents'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('admin.visitors.export.selectAgentsDesc') || 'Select agents to include in the export. Leave empty to include all agents.'}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {t('admin.analytics.selected') || 'Selected'}: {selectedAgents.size} {t('admin.analytics.of') || 'of'} {agents.length} {t('admin.analytics.agents') || 'agents'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllAgents}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.selectAll') || 'Select All'}
              </button>
              <button
                onClick={deselectAllAgents}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.clear') || 'Clear'}
              </button>
            </div>
          </div>
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('admin.visitors.export.searchAgent') || 'Search agents...'}
              value={agentSearch}
              onChange={(e) => setAgentSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {agentSearch && (
              <button
                onClick={() => setAgentSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
            {loadingData ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('admin.visitors.export.noAgentsFound') || 'No agents found'}</p>
            ) : (
              filteredAgents.map((agent) => (
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
                      {agent.firstName && agent.lastName
                        ? `${agent.firstName} ${agent.lastName}`
                        : agent.email || t('admin.analytics.unknownAgent') || 'Unknown Agent'}
                    </span>
                    {agent.email && agent.firstName && agent.lastName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{agent.email}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Visitor Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            {t('admin.visitors.export.filterByVisitors') || 'Filter by Visitors (Optional)'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('admin.visitors.export.selectVisitorsDesc') || 'Select visitors to include in the export. Leave empty to include all visitors.'}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">
              {t('admin.analytics.selected') || 'Selected'}: {selectedVisitors.size} {t('admin.analytics.of') || 'of'} {uniqueVisitors.length} {t('admin.visitors.export.visitors') || 'visitors'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllVisitors}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.selectAll') || 'Select All'}
              </button>
              <button
                onClick={deselectAllVisitors}
                className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                {t('admin.analytics.clear') || 'Clear'}
              </button>
            </div>
          </div>
          {/* Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('admin.visitors.export.searchVisitor') || 'Search visitors by name, phone, or email...'}
              value={visitorSearch}
              onChange={(e) => setVisitorSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {visitorSearch && (
              <button
                onClick={() => setVisitorSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
            {loadingData ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : filteredUniqueVisitors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('admin.visitors.export.noVisitorsFound') || 'No visitors found'}</p>
            ) : (
              filteredUniqueVisitors.map((visitor) => (
                <button
                  key={visitor.identifier}
                  onClick={() => toggleVisitor(visitor.identifier)}
                  className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors text-left ${
                    selectedVisitors.has(visitor.identifier)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  {selectedVisitors.has(visitor.identifier) ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {visitor.name || t('admin.visitors.anonymous') || 'Anonymous'}
                    </span>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {visitor.phone && (
                        <p className="text-xs text-muted-foreground">{visitor.phone}</p>
                      )}
                      {visitor.email && (
                        <p className="text-xs text-muted-foreground">{visitor.email}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>

        {/* Export Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">{t('admin.visitors.export.type') || 'Export Type'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setExportType('full')}
              className={`flex flex-col items-start p-4 border rounded-lg transition-colors text-left ${
                exportType === 'full'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="text-sm font-medium text-foreground mb-1">
                {t('admin.visitors.export.fullInfo') || 'Full Information'}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('admin.visitors.export.fullInfoDesc') || 'Includes ticket details and visitor history'}
              </div>
            </button>
            <button
              onClick={() => setExportType('visitor-only')}
              className={`flex flex-col items-start p-4 border rounded-lg transition-colors text-left ${
                exportType === 'visitor-only'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="text-sm font-medium text-foreground mb-1">
                {t('admin.visitors.export.visitorOnly') || 'Visitor Info Only'}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('admin.visitors.export.visitorOnlyDesc') || 'Unique visitors with summary statistics'}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Export Format */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4">{t('admin.visitors.export.format') || 'Export Format'}</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setExportFormat('csv')}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                exportFormat === 'csv'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => setExportFormat('excel')}
              className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
                exportFormat === 'excel'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>Excel</span>
            </button>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="bg-muted/50 border border-border rounded-xl p-4 mb-6"
        >
          <div className="text-sm text-foreground">
            <strong>{filteredVisitors.length}</strong>{' '}
            {t('admin.visitors.export.recordsFound') || 'records will be exported'}
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
            disabled={loading || filteredVisitors.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl hover:bg-primary/90 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('common.exporting') || 'Exporting...'}
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                {t('admin.visitors.export.export') || 'Export Data'}
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

