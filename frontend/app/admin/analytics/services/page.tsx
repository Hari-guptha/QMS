'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Clock,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  FolderOpen,
  Loader2,
  Search,
  Filter,
  X,
  CheckCircle2,
  Pause,
  Calendar,
  Activity,
  Maximize2,
  Target,
  Timer,
  AlertCircle,
  Ticket,
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import React from 'react';

export default function ServiceAnalytics() {
  const router = useRouter();
  const { t } = useI18n();
  const [stats, setStats] = useState<any>({});
  const [servicePerformance, setServicePerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
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
    loadAnalytics();
  }, [router, startDate, endDate]);

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

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDashboard(startDate, endDate);
      setStats(response.data || {});
      setServicePerformance(response.data?.servicePerformance || []);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      alert(error.response?.data?.message || 'Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const filteredServices = servicePerformance.filter((service) => {
    const query = searchQuery.toLowerCase();
    return service.categoryName?.toLowerCase().includes(query);
  });

  // Get search suggestions (top 5 matching services)
  const searchSuggestions = searchQuery
    ? servicePerformance
        .filter((service) => {
          const query = searchQuery.toLowerCase();
          return service.categoryName?.toLowerCase().includes(query);
        })
        .slice(0, 5)
    : servicePerformance
        .sort((a, b) => (b.totalTickets || 0) - (a.totalTickets || 0))
        .slice(0, 5);

  const selectedService = selectedServiceId ? filteredServices.find(s => s.categoryId === selectedServiceId) : null;

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
          exit={{ opacity: 0, scale: 0.95 }}
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
            <div className="text-lg text-muted-foreground">Loading service analytics...</div>
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
              href="/admin/analytics"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Analytics
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <FolderOpen className="w-6 h-6 text-chart-2" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Service-Based Analytics</h1>
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
            Refresh
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Date Filter */}
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

            {/* Custom Date Range */}
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
                  title="Reset to default"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            )}

            {/* Search with Recommendations */}
            <div className="flex-1 relative">
              <div className="flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                  className="flex-1 outline-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedServiceId('');
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title="Clear filter"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
              {/* Search Suggestions Dropdown */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-auto"
                >
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                      {searchQuery ? 'Suggestions' : 'Top Services'}
                    </div>
                    {searchSuggestions.map((service: any) => (
                      <button
                        key={service.categoryId}
                        type="button"
                        onClick={() => {
                          setSearchQuery(service.categoryName);
                          setSelectedServiceId(service.categoryId);
                          setShowSearchSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left rounded-lg hover:bg-accent hover:text-accent-foreground text-foreground transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-chart-2" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{service.categoryName}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">
                            {service.totalTickets || 0} tickets
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {service.completionRate?.toFixed(1) || 0}% completion
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-5 h-5 text-chart-2" />
              <span className="text-sm font-medium text-muted-foreground">Total Services</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{filteredServices.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Ticket className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Tickets</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {filteredServices.reduce((sum, s) => sum + (s.totalTickets || 0), 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-chart-3" />
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {filteredServices.reduce((sum, s) => sum + (s.completedTickets || 0), 0)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Timer className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Avg Service Time</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {filteredServices.length > 0
                ? Math.round(
                  filteredServices.reduce((sum, s) => sum + (s.avgServiceTime || 0), 0) /
                  filteredServices.length
                )
                : 0}{' '}
              <span className="text-xl text-muted-foreground">min</span>
            </p>
          </div>
        </motion.div>


        {/* Service Performance Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Tickets by Service */}
          {filteredServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <ChartWrapper id="tickets-by-service" title="Tickets by Service">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-chart-2/10 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-chart-2" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Tickets by Service</h2>
                </div>
                <BarChart
                  data={filteredServices.slice(0, 10).map((s: any) => ({
                    label: s.categoryName.length > 15 ? s.categoryName.substring(0, 15) + '...' : s.categoryName,
                    value: s.totalTickets,
                    color: 'var(--chart-2)',
                  }))}
                  height={expandedChart === 'tickets-by-service' ? 400 : 250}
                />
              </ChartWrapper>
            </motion.div>
          )}

          {/* Completion Rate by Service */}
          {filteredServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <ChartWrapper id="completion-rate" title="Completion Rate by Service">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-chart-3/10 rounded-lg">
                    <Target className="w-6 h-6 text-chart-3" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Completion Rate</h2>
                </div>
                <BarChart
                  data={filteredServices.slice(0, 10).map((s: any) => ({
                    label: s.categoryName.length > 15 ? s.categoryName.substring(0, 15) + '...' : s.categoryName,
                    value: s.completionRate || 0,
                    color: 'var(--chart-3)',
                  }))}
                  height={expandedChart === 'completion-rate' ? 400 : 250}
                />
              </ChartWrapper>
            </motion.div>
          )}

          {/* Service Time by Service */}
          {filteredServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <ChartWrapper id="service-time" title="Average Service Time by Service">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                    <Timer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Avg Service Time</h2>
                </div>
                <BarChart
                  data={filteredServices.slice(0, 10).map((s: any) => ({
                    label: s.categoryName.length > 15 ? s.categoryName.substring(0, 15) + '...' : s.categoryName,
                    value: s.avgServiceTime || 0,
                    color: '#3b82f6',
                  }))}
                  height={expandedChart === 'service-time' ? 400 : 250}
                />
              </ChartWrapper>
            </motion.div>
          )}

          {/* Status Distribution */}
          {filteredServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-card border border-border rounded-2xl shadow-lg p-6"
            >
              <ChartWrapper id="status-distribution" title="Status Distribution">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Status Distribution</h2>
                </div>
                <PieChart
                  data={[
                    {
                      label: 'Pending',
                      value: filteredServices.reduce((sum, s) => sum + (s.pendingTickets || 0), 0),
                      color: '#f59e0b',
                    },
                    {
                      label: 'Serving',
                      value: filteredServices.reduce((sum, s) => sum + (s.servingTickets || 0), 0),
                      color: '#10b981',
                    },
                    {
                      label: 'Hold',
                      value: filteredServices.reduce((sum, s) => sum + (s.holdTickets || 0), 0),
                      color: '#ef4444',
                    },
                    {
                      label: 'Completed',
                      value: filteredServices.reduce((sum, s) => sum + (s.completedTickets || 0), 0),
                      color: 'var(--chart-3)',
                    },
                  ]}
                  title=""
                  size={expandedChart === 'status-distribution' ? 400 : 250}
                />
              </ChartWrapper>
            </motion.div>
          )}
        </div>

        {/* Selected Service Details */}
        {selectedService && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-card border border-border rounded-2xl shadow-lg p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-chart-2" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{selectedService.categoryName}</h2>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Tickets</p>
                <p className="text-2xl font-bold text-foreground">{selectedService.totalTickets || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-foreground">{selectedService.completedTickets || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {selectedService.completionRate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Avg Service Time</p>
                <p className="text-2xl font-bold text-foreground">
                  {selectedService.avgServiceTime || 0} <span className="text-sm">min</span>
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Status Breakdown</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      Pending
                    </span>
                    <span className="font-semibold">{selectedService.pendingTickets || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      Serving
                    </span>
                    <span className="font-semibold">{selectedService.servingTickets || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground flex items-center gap-2">
                      <Pause className="w-4 h-4 text-red-600" />
                      Hold
                    </span>
                    <span className="font-semibold">{selectedService.holdTickets || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-chart-3" />
                      Completed
                    </span>
                    <span className="font-semibold">{selectedService.completedTickets || 0}</span>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Time Metrics</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Avg Total Time</span>
                    <span className="font-semibold">{selectedService.avgTotalTime || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Avg Service Time</span>
                    <span className="font-semibold">{selectedService.avgServiceTime || 0} min</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Service Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="bg-card text-card-foreground border rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-chart-2" />
              Service Performance Details
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Tickets
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status Breakdown
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Time Metrics
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredServices.map((service: any, idx: number) => (
                  <motion.tr
                    key={service.categoryId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedServiceId(service.categoryId === selectedServiceId ? '' : service.categoryId)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-chart-2" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{service.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground font-semibold">
                            {service.totalTickets || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">total</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-chart-3" />
                          <span className="text-foreground">
                            {service.completedTickets || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">completed</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-yellow-600" />
                          <span className="text-foreground">
                            Pending: {service.pendingTickets || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-green-600" />
                          <span className="text-foreground">
                            Serving: {service.servingTickets || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pause className="w-3 h-3 text-red-600" />
                          <span className="text-foreground">
                            Hold: {service.holdTickets || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Timer className="w-3 h-3 text-blue-600" />
                          <span className="text-foreground">
                            Service: {service.avgServiceTime || 0} min
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-purple-600" />
                          <span className="text-foreground">
                            Total: {service.avgTotalTime || 0} min
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Completion Rate</span>
                          <span className="text-sm font-semibold text-foreground">
                            {service.completionRate?.toFixed(1) || 0}%
                          </span>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredServices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      {searchQuery
                        ? 'No services found'
                        : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Expanded Chart Modals */}
        <AnimatePresence>
          {expandedChart === 'tickets-by-service' && (
            <ExpandedChartModal id="tickets-by-service" title="Tickets by Service">
              <BarChart
                data={filteredServices.map((s: any) => ({
                  label: s.categoryName,
                  value: s.totalTickets,
                  color: 'var(--chart-2)',
                }))}
                height={400}
              />
            </ExpandedChartModal>
          )}
          {expandedChart === 'completion-rate' && (
            <ExpandedChartModal id="completion-rate" title="Completion Rate by Service">
              <BarChart
                data={filteredServices.map((s: any) => ({
                  label: s.categoryName,
                  value: s.completionRate || 0,
                  color: 'var(--chart-3)',
                }))}
                height={400}
              />
            </ExpandedChartModal>
          )}
          {expandedChart === 'service-time' && (
            <ExpandedChartModal id="service-time" title="Average Service Time by Service">
              <BarChart
                data={filteredServices.map((s: any) => ({
                  label: s.categoryName,
                  value: s.avgServiceTime || 0,
                  color: '#3b82f6',
                }))}
                height={400}
              />
            </ExpandedChartModal>
          )}
          {expandedChart === 'status-distribution' && (
            <ExpandedChartModal id="status-distribution" title="Status Distribution">
              <PieChart
                data={[
                  {
                    label: 'Pending',
                    value: filteredServices.reduce((sum, s) => sum + (s.pendingTickets || 0), 0),
                    color: '#f59e0b',
                  },
                  {
                    label: 'Serving',
                    value: filteredServices.reduce((sum, s) => sum + (s.servingTickets || 0), 0),
                    color: '#10b981',
                  },
                  {
                    label: 'Hold',
                    value: filteredServices.reduce((sum, s) => sum + (s.holdTickets || 0), 0),
                    color: '#ef4444',
                  },
                  {
                    label: 'Completed',
                    value: filteredServices.reduce((sum, s) => sum + (s.completedTickets || 0), 0),
                    color: 'var(--chart-3)',
                  },
                ]}
                title=""
                size={400}
              />
            </ExpandedChartModal>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

