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
  UserCheck,
  Loader2,
  Users,
  Search,
  Filter,
  Mail,
  Ticket,
  CheckCircle2,
  Clock,
  Pause,
  TrendingUp,
  BarChart3,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Calendar,
  X,
  Activity,
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { format } from 'date-fns';
import { ServicePerformanceChart } from '@/components/charts/ServicePerformanceChart';
import { DailyTrendsChart } from '@/components/charts/DailyTrendsChart';
import { HourlyDistributionChart } from '@/components/charts/HourlyDistributionChart';
import { StatusDistributionChart } from '@/components/charts/StatusDistributionChart';
import { Maximize2, Minimize2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function AgentAnalytics() {
  const router = useRouter();
  const { t, language, dir } = useI18n();
  const [agentPerformance, setAgentPerformance] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
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
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

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
    loadAgentPerformance();
    loadCategories();
  }, [router, startDate, endDate, selectedCategoryId]);

  // Update current date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      default:
        return;
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

  const loadAgentPerformance = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDetailedAgentPerformance(startDate, endDate, selectedCategoryId || undefined);
      setAgentPerformance(response.data || []);
    } catch (error: any) {
      console.error('Failed to load agent performance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAgentPerformance();
  };

  const filteredAgents = agentPerformance.filter((agent) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      agent.agentName?.toLowerCase().includes(query) ||
      agent.agentEmail?.toLowerCase().includes(query) ||
      agent.employeeId?.toLowerCase().includes(query);
    return matchesSearch;
  });

  const adminNavItems = getAdminNavItems(t);

  if (loading) {
    return (
      <DashboardLayout navItems={adminNavItems} role="admin">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems} role="admin">
      <div className="p-6 ">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('admin.analytics.backToAnalytics')}
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">{t('admin.analytics.agentPerformance')}</h1>
            </div>
          </div>
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
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 mb-6"
        >
          <div className="flex flex-col gap-4">
            {/* First Row: Date Filter and Custom Date Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap justify-between">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
                {/* Date Filter */}
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

              {/* Current Date and Time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-foreground">
                  {format(currentDateTime, 'MMM dd, yyyy')} {format(currentDateTime, 'HH:mm:ss')}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="space-y-6 mb-8">
          {/* Top Row: Agent Performance (Radial) and Status Distribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Agent Performance Chart - Radial Bar */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                    <UserCheck className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t('admin.analytics.agentPerformance')}</h2>
                </div>
                <button
                  onClick={() => setExpandedChart(expandedChart === 'agent-performance' ? null : 'agent-performance')}
                  className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  title="Expand chart"
                >
                  {expandedChart === 'agent-performance' ? (
                    <Minimize2 className="w-4 h-4 text-foreground" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-foreground" />
                  )}
                </button>
              </div>
              {agentPerformance.length > 0 ? (
                <ServicePerformanceChart
                  data={agentPerformance
                    .sort((a: any, b: any) => (b.totalTickets || 0) - (a.totalTickets || 0))
                    .slice(0, 8)
                    .map((a: any) => ({
                      label: a.agentName.length > 15 ? a.agentName.substring(0, 15) + '...' : a.agentName,
                      value: a.totalTickets || 0,
                    }))}
                  height={expandedChart === 'agent-performance' ? 500 : 300}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>{t('admin.analytics.noDataAvailable')}</p>
                </div>
              )}
            </motion.div>

            {/* Status Distribution Chart */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-chart-4/20 rounded-lg border border-chart-4/30">
                    <Activity className="w-6 h-6 text-chart-4" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t('admin.analytics.statusDistribution')}</h2>
                </div>
                <button
                  onClick={() => setExpandedChart(expandedChart === 'status-distribution' ? null : 'status-distribution')}
                  className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  title="Expand chart"
                >
                  {expandedChart === 'status-distribution' ? (
                    <Minimize2 className="w-4 h-4 text-foreground" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-foreground" />
                  )}
                </button>
              </div>
              {agentPerformance.length > 0 ? (
                <StatusDistributionChart
                  data={[
                    {
                      label: t('common.pending'),
                      value: agentPerformance.reduce((sum: number, a: any) => sum + (a.pendingTickets || 0), 0),
                    },
                    {
                      label: t('common.serving'),
                      value: agentPerformance.reduce((sum: number, a: any) => sum + (a.servingTickets || 0), 0),
                    },
                    {
                      label: t('common.hold'),
                      value: agentPerformance.reduce((sum: number, a: any) => sum + (a.holdTickets || 0), 0),
                    },
                    {
                      label: t('admin.analytics.completed'),
                      value: agentPerformance.reduce((sum: number, a: any) => sum + (a.completedTickets || 0), 0),
                    },
                  ]}
                  size={expandedChart === 'status-distribution' ? 500 : 300}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>{t('admin.analytics.noDataAvailable')}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Second Row: Completion Rate Trends and Service Time Distribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Completion Rate Trend */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-chart-3/20 rounded-lg border border-chart-3/30">
                    <TrendingUp className="w-6 h-6 text-chart-3" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {language === 'ar' ? 'اتجاه معدل الإكمال' : 'Completion Rate Trend'}
                  </h2>
                </div>
                <button
                  onClick={() => setExpandedChart(expandedChart === 'completion-trend' ? null : 'completion-trend')}
                  className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  title="Expand chart"
                >
                  {expandedChart === 'completion-trend' ? (
                    <Minimize2 className="w-4 h-4 text-foreground" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-foreground" />
                  )}
                </button>
              </div>
              {agentPerformance.length > 0 ? (
                <DailyTrendsChart
                  data={agentPerformance
                    .sort((a: any, b: any) => (b.completionRate || 0) - (a.completionRate || 0))
                    .slice(0, 10)
                    .map((a: any) => ({
                      label: a.agentName.length > 12 ? a.agentName.substring(0, 12) + '...' : a.agentName,
                      value: a.completionRate || 0,
                    }))}
                  height={expandedChart === 'completion-trend' ? 500 : 300}
                  color="#1e40af"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>{t('admin.analytics.noDataAvailable')}</p>
                </div>
              )}
            </motion.div>

            {/* Service Time Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-chart-1/20 rounded-lg border border-chart-1/30">
                    <Clock className="w-6 h-6 text-chart-1" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {language === 'ar' ? 'توزيع وقت الخدمة' : 'Service Time Distribution'}
                  </h2>
                </div>
                <button
                  onClick={() => setExpandedChart(expandedChart === 'service-time' ? null : 'service-time')}
                  className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg hover:bg-muted transition-colors"
                  title="Expand chart"
                >
                  {expandedChart === 'service-time' ? (
                    <Minimize2 className="w-4 h-4 text-foreground" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-foreground" />
                  )}
                </button>
              </div>
              {agentPerformance.length > 0 ? (
                <div className="w-full overflow-hidden">
                  <HourlyDistributionChart
                    data={agentPerformance
                      .sort((a: any, b: any) => (a.avgServiceTime || 0) - (b.avgServiceTime || 0))
                      .slice(0, 10)
                      .map((a: any, index: number) => ({
                        label: a.agentName.length > 8 ? a.agentName.substring(0, 8) + '...' : a.agentName,
                        value: Math.round(a.avgServiceTime || 0),
                      }))}
                    height={expandedChart === 'service-time' ? 400 : 250}
                    color="#1e40af"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>{t('admin.analytics.noDataAvailable')}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Expanded Chart Modals */}
        <AnimatePresence>
          {expandedChart && (
            <>
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] m-0" onClick={() => setExpandedChart(null)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`fixed top-4 bottom-4 z-[10000] bg-card border border-border rounded-2xl shadow-xl p-6 overflow-auto m-0 ${dir === 'rtl' ? 'right-4 left-4' : 'left-4 right-4'}`}
              >
                <div className={`flex items-center mb-6 ${dir === 'rtl' ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
                  <h2 className="text-2xl font-bold text-foreground">
                    {expandedChart === 'agent-performance' && t('admin.analytics.agentPerformance')}
                    {expandedChart === 'status-distribution' && t('admin.analytics.statusDistribution')}
                    {expandedChart === 'completion-trend' && (language === 'ar' ? 'اتجاه معدل الإكمال' : 'Completion Rate Trend')}
                    {expandedChart === 'service-time' && (language === 'ar' ? 'توزيع وقت الخدمة' : 'Service Time Distribution')}
                  </h2>
                  <button
                    onClick={() => setExpandedChart(null)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                </div>
                <div className="h-[calc(100vh-12rem)]">
                  {expandedChart === 'agent-performance' && agentPerformance.length > 0 && (
                    <ServicePerformanceChart
                      data={agentPerformance
                        .sort((a: any, b: any) => (b.totalTickets || 0) - (a.totalTickets || 0))
                        .slice(0, 8)
                        .map((a: any) => ({
                          label: a.agentName.length > 15 ? a.agentName.substring(0, 15) + '...' : a.agentName,
                          value: a.totalTickets || 0,
                        }))}
                      height={500}
                    />
                  )}
                  {expandedChart === 'status-distribution' && agentPerformance.length > 0 && (
                    <StatusDistributionChart
                      data={[
                        {
                          label: t('common.pending'),
                          value: agentPerformance.reduce((sum: number, a: any) => sum + (a.pendingTickets || 0), 0),
                        },
                        {
                          label: t('common.serving'),
                          value: agentPerformance.reduce((sum: number, a: any) => sum + (a.servingTickets || 0), 0),
                        },
                        {
                          label: t('common.hold'),
                          value: agentPerformance.reduce((sum: number, a: any) => sum + (a.holdTickets || 0), 0),
                        },
                        {
                          label: t('admin.analytics.completed'),
                          value: agentPerformance.reduce((sum: number, a: any) => sum + (a.completedTickets || 0), 0),
                        },
                      ]}
                      size={500}
                    />
                  )}
                  {expandedChart === 'completion-trend' && agentPerformance.length > 0 && (
                    <DailyTrendsChart
                      data={agentPerformance
                        .sort((a: any, b: any) => (b.completionRate || 0) - (a.completionRate || 0))
                        .slice(0, 10)
                        .map((a: any) => ({
                          label: a.agentName.length > 12 ? a.agentName.substring(0, 12) + '...' : a.agentName,
                          value: a.completionRate || 0,
                        }))}
                      height={500}
                      color="#1e40af"
                    />
                  )}
                  {expandedChart === 'service-time' && agentPerformance.length > 0 && (
                    <div className="w-full overflow-hidden">
                      <HourlyDistributionChart
                        data={agentPerformance
                          .sort((a: any, b: any) => (a.avgServiceTime || 0) - (b.avgServiceTime || 0))
                          .slice(0, 10)
                          .map((a: any) => ({
                            label: a.agentName.length > 12 ? a.agentName.substring(0, 12) + '...' : a.agentName,
                            value: Math.round(a.avgServiceTime || 0),
                          }))}
                        height={400}
                        color="#1e40af"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Agent Performance Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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
      </div>
    </DashboardLayout>
  );
}
