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
  Users
} from 'lucide-react';

export default function Analytics() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      
      // Get tickets for monthly trends - get all queues
      try {
        const ticketsResponse = await adminApi.getAllQueues();
        const tickets = Array.isArray(ticketsResponse.data) 
          ? ticketsResponse.data 
          : ticketsResponse.data?.tickets || [];
        if (tickets.length > 0) {
          processTicketData(tickets);
        }
      } catch (err) {
        console.error('Failed to load tickets:', err);
      }
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      alert(error.response?.data?.message || 'Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any>({});

  const processTicketData = (tickets: any[]) => {
    // Process monthly data
    const monthly: { [key: string]: { completed: number; noShow: number } } = {};
    const statusCounts: { [key: string]: number } = {};
    
    // Flatten tickets if they're nested in queues
    const allTickets = tickets.flatMap((item: any) => 
      item.tickets ? item.tickets : [item]
    );
    
    allTickets.forEach((ticket: any) => {
      // Monthly data
      if (ticket.createdAt) {
        const date = new Date(ticket.createdAt);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        if (!monthly[monthKey]) {
          monthly[monthKey] = { completed: 0, noShow: 0 };
        }
        if (ticket.status === 'completed') monthly[monthKey].completed++;
        if (ticket.status === 'no_show' || ticket.status === 'no-show') monthly[monthKey].noShow++;
      }
      
      // Status counts
      statusCounts[ticket.status] = (statusCounts[ticket.status] || 0) + 1;
    });
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyArray = months.map(month => ({
      month,
      completed: monthly[month]?.completed || 0,
      noShow: monthly[month]?.noShow || 0,
    }));
    
    setMonthlyData(monthlyArray);
    setStatusData(statusCounts);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
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

  const statCards = [
    {
      icon: Clock,
      title: 'Average Wait Time',
      value: `${stats.avgWaitTime || 0} min`,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      hasBorder: true,
    },
    {
      icon: TrendingUp,
      title: 'Average Service Time',
      value: `${stats.avgServiceTime || 0} min`,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-500/20',
      borderColor: '',
      hasBorder: false,
    },
    {
      icon: AlertCircle,
      title: 'Abandonment Rate',
      value: `${stats.abandonmentRate?.toFixed(1) || 0}%`,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-500/20',
      borderColor: 'border-red-500/30',
      hasBorder: true,
    },
  ];

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

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className={`bg-white dark:bg-[#171717] border ${card.hasBorder ? card.borderColor : 'border-border'} rounded-lg p-6 shadow-lg hover:shadow-xl transition-all`}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 ${card.iconBg} rounded-lg mb-4`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{card.title}</h3>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Tickets Chart */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white dark:bg-[#171717] border border-border rounded-lg shadow-lg p-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">Queue Analytics</h2>
              <p className="text-sm text-muted-foreground">Monthly ticket records for {new Date().getFullYear()}</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-600"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-pink-400"></div>
                  <span>No Show</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-2 h-64">
                {monthlyData.map((data, index) => {
                  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.completed, d.noShow)), 1);
                  const completedHeight = (data.completed / maxValue) * 100;
                  const noShowHeight = (data.noShow / maxValue) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center justify-end gap-1 h-full">
                        <div 
                          className="w-full bg-red-600 rounded-t"
                          style={{ height: `${completedHeight}%`, minHeight: data.completed > 0 ? '4px' : '0' }}
                        ></div>
                        <div 
                          className="w-full bg-pink-400 rounded-t"
                          style={{ height: `${noShowHeight}%`, minHeight: data.noShow > 0 ? '4px' : '0' }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">{data.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {monthlyData.reduce((sum, d) => sum + d.completed, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {monthlyData.reduce((sum, d) => sum + d.noShow, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total No Show</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Category Statistics Chart */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white dark:bg-[#171717] border border-border rounded-lg shadow-lg p-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">Category Analytics</h2>
              <p className="text-sm text-muted-foreground">Tickets per service category</p>
            </div>
            <div className="space-y-4">
              {stats.categoryStats && stats.categoryStats.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {stats.categoryStats.map((cat: any, index: number) => {
                      const maxTickets = Math.max(...stats.categoryStats.map((c: any) => c.totalTickets), 1);
                      const percentage = (cat.totalTickets / maxTickets) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground font-medium">{cat.categoryName}</span>
                            <span className="text-muted-foreground">{cat.totalTickets} tickets</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.categoryStats.reduce((sum: number, cat: any) => sum + cat.totalTickets, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Tickets</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No category data available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Peak Hours Chart */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white dark:bg-[#171717] border border-border rounded-lg shadow-lg p-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">Peak Hours</h2>
              <p className="text-sm text-muted-foreground">Ticket creation by hour of day</p>
            </div>
            <div className="space-y-4">
              {stats.peakHours && stats.peakHours.length > 0 ? (
                <>
                  <div className="flex items-end justify-between gap-1 h-48">
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
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No peak hours data available</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Agent Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white dark:bg-[#171717] border border-border rounded-lg shadow-lg p-6"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">Agent Performance</h2>
              <p className="text-sm text-muted-foreground">Tickets completed by agent</p>
            </div>
            <div className="space-y-4">
              {stats.agentPerformance && stats.agentPerformance.length > 0 ? (
                <>
                  <div className="flex items-end justify-between gap-2 h-48">
                    {stats.agentPerformance.slice(0, 8).map((agent: any, index: number) => {
                      const maxTickets = Math.max(...stats.agentPerformance.map((a: any) => a.completedTickets), 1);
                      const height = (agent.completedTickets / maxTickets) * 100;
                      const initials = agent.agentName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-green-500 rounded-t"
                            style={{ height: `${height}%`, minHeight: agent.completedTickets > 0 ? '4px' : '0' }}
                            title={`${agent.agentName} - ${agent.completedTickets} tickets`}
                          ></div>
                          <span className="text-xs text-muted-foreground mt-1 text-center truncate w-full" title={agent.agentName}>
                            {initials}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-2xl font-bold text-foreground">
                      {stats.agentPerformance.reduce((sum: number, a: any) => sum + a.completedTickets, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Completed</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No agent performance data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Agent Performance Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-card text-card-foreground border rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Agent Performance</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tickets Served</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Wait Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Service Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.agentPerformance?.map((agent: any, idx: number) => (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-foreground font-semibold">{agent.ticketsServed || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-foreground">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {agent.avgWaitTime || 0} min
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-foreground">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        {agent.avgServiceTime || 0} min
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {(!stats.agentPerformance || stats.agentPerformance.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      No agent performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
