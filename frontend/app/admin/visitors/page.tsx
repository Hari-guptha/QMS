'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getAdminNavItems } from '@/lib/admin-nav-items';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck,
  Search,
  Filter,
  Calendar,
  X,
  LayoutGrid,
  List,
  Loader2,
  Clock,
  Ticket,
  Phone,
  Mail,
  Eye,
  ChevronRight,
  FolderOpen,
  Download,
} from 'lucide-react';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  isWithinInterval,
} from 'date-fns';

type DateFilter = 'day' | 'week' | 'month' | 'custom';
type ViewMode = 'grid' | 'list';

export default function VisitorsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('day');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [startDate, setStartDate] = useState(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadVisitors();
  }, [router]);

  useEffect(() => {
    updateDateRange();
  }, [dateFilter]);

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
      // Custom - use existing dates
      return;
    }

    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAllQueues();
      const allTickets = response.data || [];
      setVisitors(allTickets);
    } catch (error) {
      console.error('Failed to load visitors:', error);
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

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

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((visitor) => {
        return (
          visitor.customerName?.toLowerCase().includes(query) ||
          visitor.tokenNumber?.toLowerCase().includes(query) ||
          visitor.customerPhone?.toLowerCase().includes(query) ||
          visitor.customerEmail?.toLowerCase().includes(query)
        );
      });
    }

    return filtered.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [visitors, startDate, endDate, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
      case 'serving':
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
      case 'hold':
        return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    return t(`status.${status}`) || status;
  };

  const calculateVisitDuration = (visitor: any) => {
    if (!visitor.calledAt) return null;
    const start = new Date(visitor.calledAt);
    const end = visitor.completedAt ? new Date(visitor.completedAt) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes
    return diff;
  };

  const adminNavItems = getAdminNavItems(t);

  return (
    <DashboardLayout navItems={adminNavItems} role="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <UserCheck className="w-6 h-6 text-chart-2" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              {t('admin.visitors') || 'Visitors'}
            </h1>
          </div>
          <Link
            href="/admin/visitors/export"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Download className="w-4 h-4" />
            {t('admin.visitors.export') || 'Export'}
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 mb-6"
        >
          <div className="flex flex-col gap-4">
            {/* First Row: Date Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {t('admin.analytics.period') || 'Period'}:
                </span>
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
                  <span className="text-muted-foreground">
                    {t('admin.analytics.to') || 'to'}
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}
            </div>

            {/* Second Row: Search and View Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Search */}
              <div className="flex items-center gap-0 bg-card/80 dark:bg-card border border-border rounded-xl px-2 py-1 flex-1">
                <span className="pl-2 pr-1 text-xl text-primary/80">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder={t('admin.visitors.searchPlaceholder') || 'Search by name, ticket number...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-9 w-full min-w-0 py-1 outline-none border-0 bg-transparent rounded-lg focus:ring-0 focus-visible:ring-0 shadow-none text-base px-2 text-foreground placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-card/80 dark:bg-card border border-border rounded-xl">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={t('common.listView') || 'List View'}
                >
                  <List className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={t('common.gridView') || 'Grid View'}
                >
                  <LayoutGrid className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <div className="text-lg text-muted-foreground">
                {t('common.loading') || 'Loading...'}
              </div>
            </motion.div>
          </div>
        ) : filteredVisitors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-12 text-center"
          >
            <UserCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('admin.visitors.noVisitors') || 'No visitors found'}
            </h3>
            <p className="text-muted-foreground">
              {t('admin.visitors.noVisitorsDesc') || 'Try adjusting your filters or date range'}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredVisitors.length} {filteredVisitors.length !== 1 ? 'visitors' : 'visitor'} found
              </p>
            </div>

            {viewMode === 'list' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('admin.visitors.visitor') || 'Visitor'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('admin.visitors.ticketNumber') || 'Ticket'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('admin.visitors.service') || 'Service'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('admin.visitors.checkInTime') || 'Check-in Time'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('admin.visitors.status') || 'Status'}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {t('admin.visitors.actions') || 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredVisitors.map((visitor) => {
                        const duration = calculateVisitDuration(visitor);
                        return (
                          <motion.tr
                            key={visitor.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            whileHover={{ backgroundColor: 'var(--muted)' }}
                            className="transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-foreground">
                                  {visitor.customerName || t('admin.visitors.anonymous') || 'Anonymous'}
                                </div>
                                {visitor.customerPhone && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {visitor.customerPhone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">
                                  {visitor.tokenNumber}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-foreground">
                                {visitor.category?.name || '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="text-sm text-foreground">
                                  {format(new Date(visitor.createdAt), 'MMM dd, yyyy')}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(visitor.createdAt), 'HH:mm')}
                                </div>
                                {duration !== null && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {t('admin.visitors.duration', { minutes: duration }) || `${duration} min`}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  visitor.status
                                )}`}
                              >
                                {getStatusLabel(visitor.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Link
                                href={`/admin/visitors/${visitor.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                {t('admin.visitors.view') || 'View'}
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredVisitors.map((visitor) => {
                  const duration = calculateVisitDuration(visitor);
                  return (
                    <motion.div
                      key={visitor.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <Link href={`/admin/visitors/${visitor.id}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {visitor.customerName || t('admin.visitors.anonymous') || 'Anonymous'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Ticket className="w-4 h-4" />
                              <span className="font-medium">{visitor.tokenNumber}</span>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              visitor.status
                            )}`}
                          >
                            {getStatusLabel(visitor.status)}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FolderOpen className="w-4 h-4" />
                            <span>{visitor.category?.name || '-'}</span>
                          </div>
                          {visitor.customerPhone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              <span>{visitor.customerPhone}</span>
                            </div>
                          )}
                          {visitor.customerEmail && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{visitor.customerEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(new Date(visitor.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                          </div>
                          {duration !== null && (
                            <div className="text-sm text-muted-foreground">
                              {t('admin.visitors.duration', { minutes: duration }) || `Duration: ${duration} min`}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end pt-4 border-t border-border">
                          <span className="text-sm text-primary font-medium flex items-center gap-1">
                            {t('admin.visitors.viewDetails') || 'View Details'}
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

