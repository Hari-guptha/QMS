'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
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
  Activity
} from 'lucide-react';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { HeatmapChart } from '@/components/charts/HeatmapChart';

export default function Analytics() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [agentPerformance, setAgentPerformance] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadAnalytics();
    loadCategories();
  }, [router]);

  useEffect(() => {
    loadAgentPerformance();
  }, [selectedCategoryId]);

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
      const response = await adminApi.getDashboard();
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
      const response = await adminApi.getDetailedAgentPerformance(undefined, undefined, selectedCategoryId || undefined);
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

  // Filter agents based on search query
  const filteredAgents = agentPerformance.filter((agent) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      agent.agentName?.toLowerCase().includes(query) ||
      agent.agentEmail?.toLowerCase().includes(query);
    return matchesSearch;
  });

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
            <div className="text-lg text-muted-foreground">Loading analytics...</div>
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
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-4/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-chart-4" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Analytics Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center gap-2 bg-chart-2 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <Download className="w-5 h-5" />
              Export Excel
            </motion.button>
          </div>
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
              <span className="text-sm font-medium text-muted-foreground">Total Tickets</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.ticketCounts?.total || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.ticketCounts?.pending || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Serving</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.ticketCounts?.serving || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-chart-3" />
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
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
                <h2 className="text-2xl font-bold text-foreground">Agent Performance</h2>
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
                  placeholder="Search agents by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
                >
                  <option value="">All Services</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Agents</p>
                <p className="text-2xl font-bold text-foreground">{filteredAgents.length}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Tickets</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAgents.reduce((sum, a) => sum + (a.totalTickets || 0), 0)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAgents.reduce((sum, a) => sum + (a.completedTickets || 0), 0)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Avg Service Time</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredAgents.length > 0
                    ? Math.round(
                        filteredAgents.reduce((sum, a) => sum + (a.avgServiceTime || 0), 0) /
                          filteredAgents.length
                      )
                    : 0}{' '}
                  min
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
                    Agent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Totals
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
                          <span className="text-xs text-muted-foreground">Total</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-chart-3" />
                          <span className="text-foreground">
                            {agent.completedTickets || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">Completed</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-yellow-600" />
                          <span className="text-foreground">
                            Pending: {agent.pendingTickets || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3 h-3 text-green-600" />
                          <span className="text-foreground">
                            Serving: {agent.servingTickets || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pause className="w-3 h-3 text-red-600" />
                          <span className="text-foreground">
                            Hold: {agent.holdTickets || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span className="text-foreground">
                            Wait: {agent.avgWaitTime || 0} min
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span className="text-foreground">
                            Service: {agent.avgServiceTime || 0} min
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-3 h-3 text-purple-600" />
                          <span className="text-foreground">
                            Total: {agent.avgTotalTime || 0} min
                          </span>
                        </div>
                        {agent.avgCalledToServingTime !== undefined && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3 h-3 text-orange-600" />
                            <span className="text-foreground">
                              Called→Serving: {agent.avgCalledToServingTime || 0} min
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Completion Rate:</span>
                          <span className="text-sm font-semibold text-foreground">
                            {agent.completionRate?.toFixed(1) || 0}%
                          </span>
                        </div>
                        {agent.serviceBreakdown && agent.serviceBreakdown.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Services:</p>
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
                        ? 'No agents found matching your filters'
                        : 'No agent performance data available'}
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
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Ticket Status Distribution</h2>
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
                size={250}
              />
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
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <Calendar className="w-6 h-6 text-chart-2" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Daily Ticket Trends</h2>
              </div>
              <AreaChart
                data={stats.dailyTrends.map((d: any) => ({
                  label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: d.total,
                }))}
                title=""
                height={250}
                color="var(--chart-2)"
              />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-chart-2"></div>
                  <span className="text-muted-foreground">Total Tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-chart-3"></div>
                  <span className="text-muted-foreground">Completed</span>
                </div>
              </div>
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-chart-1/10 rounded-lg">
                    <Clock className="w-6 h-6 text-chart-1" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Hourly Ticket Distribution</h2>
                </div>
                <BarChart
                  data={stats.hourlyDistribution.map((h: any) => ({
                    label: `${h.hour}:00`,
                    value: h.count,
                    color: 'var(--chart-1)',
                  }))}
                  height={200}
                />
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-chart-4/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-chart-4" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Day of Week Distribution</h2>
                </div>
                <BarChart
                  data={stats.dayOfWeekDistribution.map((d: any) => ({
                    label: d.day,
                    value: d.count,
                    color: 'var(--chart-4)',
                  }))}
                  height={200}
                />
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-chart-2/10 rounded-lg">
                    <FolderOpen className="w-6 h-6 text-chart-2" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Service Category Performance</h2>
                </div>
                <BarChart
                  data={stats.servicePerformance.map((s: any) => ({
                    label: s.categoryName.length > 10 ? s.categoryName.substring(0, 10) + '...' : s.categoryName,
                    value: s.totalTickets,
                    color: 'var(--chart-2)',
                  }))}
                  height={200}
                />
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-chart-3/10 rounded-lg">
                    <UserCheck className="w-6 h-6 text-chart-3" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Agent Performance (Top 10)</h2>
                </div>
                <BarChart
                  data={stats.agentPerformance.slice(0, 10).map((a: any) => ({
                    label: a.agentName.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                    value: a.completedTickets,
                    color: 'var(--chart-3)',
                  }))}
                  height={200}
                />
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
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Peak Hours Heatmap</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-1 h-64">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourData = stats.peakHours.find((h: any) => h.hour === hour);
                    const count = hourData?.count || 0;
                    const maxCount = Math.max(...stats.peakHours.map((h: any) => h.count), 1);
                    const height = (count / maxCount) * 100;
                    return (
                      <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-primary rounded-t"
                          style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
                          title={`${hour}:00 - ${count} tickets`}
                        ></div>
                        {hour % 4 === 0 && (
                          <span className="text-xs text-muted-foreground mt-1">{hour}h</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-2xl font-bold text-foreground">
                    {stats.peakHours.reduce((sum: number, h: any) => sum + h.count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Tickets</p>
                </div>
              </div>
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
              <span className="text-sm font-medium text-muted-foreground">Avg Wait Time</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.avgWaitTime || 0}
              <span className="text-xl text-muted-foreground ml-2">min</span>
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Avg Service Time</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.avgServiceTime || 0}
              <span className="text-xl text-muted-foreground ml-2">min</span>
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-muted-foreground">Abandonment Rate</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.abandonmentRate?.toFixed(1) || 0}
              <span className="text-xl text-muted-foreground ml-2">%</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
