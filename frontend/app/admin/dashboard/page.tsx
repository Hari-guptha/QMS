'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Users,
  FolderOpen,
  List,
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Loader2,
  Ticket,
  UserCheck,
  X,
  CheckCircle2,
  Pause,
  LayoutDashboard
} from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.3 }
  }
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5 }
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useI18n();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    const user = auth.getUser();
    if (user?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }

    // Redirect to analytics instead of showing dashboard
    router.push('/admin/analytics');
  }, [router]);

  const loadDashboard = async () => {
    try {
      const response = await adminApi.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminNavItems = [
    {
      href: '/admin/dashboard',
      label: t('dashboard.admin'),
      icon: LayoutDashboard,
    },
    {
      href: '/admin/users',
      label: t('admin.usersManagement'),
      icon: Users,
    },
    {
      href: '/admin/categories',
      label: t('admin.categories'),
      icon: FolderOpen,
    },
    {
      href: '/admin/queues',
      label: t('admin.allQueues'),
      icon: List,
    },
    {
      href: '/admin/analytics',
      label: t('admin.analytics'),
      icon: BarChart3,
    },
  ];

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
            <div className="text-lg text-muted-foreground">{t('admin.loadingDashboard')}</div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  const quickLinks = [
    {
      href: '/admin/users',
      icon: Users,
      title: t('admin.usersManagement'),
      description: t('admin.manageAgentsUsers'),
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    },
    {
      href: '/admin/categories',
      icon: FolderOpen,
      title: t('admin.categories'),
      description: t('admin.manageCategories'),
      color: 'from-chart-2/20 to-chart-2/5',
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-500/20',
    },
    {
      href: '/admin/queues',
      icon: List,
      title: t('admin.allQueues'),
      description: t('admin.viewManageQueues'),
      color: 'from-chart-1/20 to-chart-1/5',
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
    },
    {
      href: '/admin/analytics',
      icon: BarChart3,
      title: t('admin.analytics'),
      description: t('admin.viewReports'),
      color: 'from-chart-4/20 to-chart-4/5',
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-500/20',
    },
  ];

  return (
    <DashboardLayout navItems={adminNavItems} role="admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-2">
            {t('dashboard.admin')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('dashboard.manageSystem')}
          </p>
        </motion.div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.href}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={cardVariants}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={link.href}>
                  <div className={`relative h-full bg-white dark:bg-[#171717] border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden`}>
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`inline-flex items-center justify-center w-14 h-14 ${link.iconBg} rounded-lg mb-4`}
                    >
                      <Icon className={`w-7 h-7 ${link.iconColor}`} />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {link.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {link.description}
                    </p>
                    <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                      <span className="text-sm">{t('admin.view')}</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats - Ticket Counts */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-card text-card-foreground border rounded-2xl shadow-sm p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{t('admin.ticketOverview')}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
              className="p-4 bg-white dark:bg-[#171717] border border-primary/20 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Ticket className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">{t('admin.totalTickets')}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {stats.ticketCounts?.total || 0}
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="p-4 bg-white dark:bg-[#171717] border border-yellow-500/20 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-xs font-medium text-muted-foreground">{t('status.pending')}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {stats.ticketCounts?.pending || 0}
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.7 }}
              className="p-4 bg-white dark:bg-[#171717] border border-green-500/20 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-muted-foreground">{t('status.serving')}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {stats.ticketCounts?.serving || 0}
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.8 }}
              className="p-4 bg-white dark:bg-[#171717] border border-red-500/20 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Pause className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-xs font-medium text-muted-foreground">{t('status.hold')}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {stats.ticketCounts?.hold || 0}
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.9 }}
              className="p-4 bg-white dark:bg-[#171717] border border-chart-3/20 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-chart-3" />
                <span className="text-xs font-medium text-muted-foreground">{t('status.completed')}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {stats.ticketCounts?.completed || 0}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-card text-card-foreground border rounded-2xl shadow-sm p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{t('admin.performanceMetrics')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="p-6 bg-white dark:bg-[#171717] border border-primary/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t('admin.avgWaitTime')}</span>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {stats.avgWaitTime || 0}
                <span className="text-xl text-muted-foreground ml-2">{t('customer.minutes')}</span>
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.7 }}
              className="p-6 bg-white dark:bg-[#171717] border border-chart-2/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t('admin.avgServiceTime')}</span>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {stats.avgServiceTime || 0}
                <span className="text-xl text-muted-foreground ml-2">{t('customer.minutes')}</span>
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.8 }}
              className="p-6 bg-white dark:bg-[#171717] border border-destructive/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{t('admin.abandonmentRate')}</span>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {stats.abandonmentRate?.toFixed(1) || 0}
                <span className="text-xl text-muted-foreground ml-2">%</span>
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Service-Based Performance */}
        {stats.servicePerformance && stats.servicePerformance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-card text-card-foreground border rounded-2xl shadow-sm p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-chart-2/20 rounded-lg">
                <FolderOpen className="w-6 h-6 text-chart-2" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t('admin.servicePerformance')}</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.servicePerformance.map((service: any, index: number) => (
                <motion.div
                  key={service.categoryId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="p-4 bg-white dark:bg-[#171717] border border-border rounded-xl"
                >
                  <h3 className="font-semibold text-foreground mb-3">{service.categoryName}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.total')}</span>
                      <span className="font-medium text-foreground">{service.totalTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('status.pending')}:</span>
                      <span className="font-medium text-yellow-600">{service.pendingTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('status.serving')}:</span>
                      <span className="font-medium text-green-600">{service.servingTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('status.hold')}:</span>
                      <span className="font-medium text-red-600">{service.holdTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('status.completed')}:</span>
                      <span className="font-medium text-chart-3">{service.completedTickets}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">{t('admin.avgServiceTime')}:</span>
                      <span className="font-medium text-foreground">{service.avgServiceTime} {t('customer.minutes')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.completionRate')}</span>
                      <span className="font-medium text-foreground">{service.completionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
