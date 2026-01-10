'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getAdminNavItems } from '@/lib/admin-nav-items';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  UserCheck,
  Clock,
  Ticket,
  Phone,
  Mail,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Pause,
  User,
  FolderOpen,
  TrendingUp,
  BarChart3,
  Activity,
} from 'lucide-react';
import { format, differenceInMinutes, differenceInHours, parseISO } from 'date-fns';

export default function VisitorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useI18n();
  const visitorId = params.id as string;
  const [visitor, setVisitor] = useState<any>(null);
  const [allVisits, setAllVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadVisitorData();
  }, [router, visitorId]);

  const loadVisitorData = async () => {
    setLoading(true);
    try {
      // Load all tickets to find this visitor's tickets
      const response = await adminApi.getAllQueues();
      const allTickets = response.data || [];
      
      // Find the specific visitor ticket
      const currentTicket = allTickets.find((t: any) => t.id === visitorId);
      if (currentTicket) {
        setVisitor(currentTicket);
        
        // Find all visits by the same customer (by phone or email)
        const customerIdentifier = currentTicket.customerPhone || currentTicket.customerEmail;
        if (customerIdentifier) {
          const visits = allTickets.filter((t: any) => 
            (t.customerPhone && t.customerPhone === customerIdentifier) ||
            (t.customerEmail && t.customerEmail === customerIdentifier)
          );
          setAllVisits(visits.sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        } else {
          setAllVisits([currentTicket]);
        }
      }
    } catch (error) {
      console.error('Failed to load visitor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start: Date | string | null, end: Date | string | null) => {
    if (!start) return null;
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = end ? (typeof end === 'string' ? parseISO(end) : end) : new Date();
    return differenceInMinutes(endDate, startDate);
  };

  const calculateServiceTime = (visitor: any) => {
    if (!visitor.servingStartedAt) return null;
    const start = parseISO(visitor.servingStartedAt);
    const end = visitor.completedAt ? parseISO(visitor.completedAt) : new Date();
    return differenceInMinutes(end, start);
  };

  const calculateWaitTime = (visitor: any) => {
    if (!visitor.calledAt) return null;
    const checkIn = parseISO(visitor.createdAt);
    const called = parseISO(visitor.calledAt);
    return differenceInMinutes(called, checkIn);
  };

  const visitorStats = useMemo(() => {
    if (allVisits.length === 0) return null;

    const totalVisits = allVisits.length;
    const completedVisits = allVisits.filter((v: any) => v.status === 'completed').length;
    const totalServiceTime = allVisits.reduce((sum: number, v: any) => {
      const time = calculateServiceTime(v);
      return sum + (time || 0);
    }, 0);
    const avgServiceTime = totalServiceTime / completedVisits || 0;
    
    const totalWaitTime = allVisits.reduce((sum: number, v: any) => {
      const time = calculateWaitTime(v);
      return sum + (time || 0);
    }, 0);
    const avgWaitTime = totalWaitTime / totalVisits || 0;

    const servicesUsed = allVisits.reduce((acc: any, v: any) => {
      const serviceName = v.category?.name || 'Unknown';
      acc[serviceName] = (acc[serviceName] || 0) + 1;
      return acc;
    }, {});

    return {
      totalVisits,
      completedVisits,
      avgServiceTime: Math.round(avgServiceTime),
      avgWaitTime: Math.round(avgWaitTime),
      servicesUsed,
      completionRate: totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0,
    };
  }, [allVisits]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle2;
      case 'serving':
        return Activity;
      case 'pending':
        return Clock;
      case 'hold':
        return Pause;
      default:
        return Clock;
    }
  };

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
            <div className="text-lg text-muted-foreground">
              {t('common.loading') || 'Loading visitor information...'}
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!visitor) {
    return (
      <DashboardLayout navItems={adminNavItems} role="admin">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('admin.visitors.notFound') || 'Visitor not found'}
            </h2>
            <Link
              href="/admin/visitors"
              className="text-primary hover:underline"
            >
              {t('admin.visitors.backToVisitors') || 'Back to Visitors'}
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentDuration = calculateDuration(visitor.calledAt, visitor.completedAt);
  const serviceTime = calculateServiceTime(visitor);
  const waitTime = calculateWaitTime(visitor);
  const StatusIcon = getStatusIcon(visitor.status);

  return (
    <DashboardLayout navItems={adminNavItems} role="admin">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Link
            href="/admin/visitors"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-2 bg-chart-2/10 rounded-lg">
            <UserCheck className="w-6 h-6 text-chart-2" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            {t('admin.visitors.visitorDetails') || 'Visitor Details'}
          </h1>
        </motion.div>

        {/* Visitor Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {visitor.customerName || t('admin.visitors.anonymous') || 'Anonymous'}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {visitor.customerPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{visitor.customerPhone}</span>
                    </div>
                  )}
                  {visitor.customerEmail && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      <span>{visitor.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
                  visitor.status
                )}`}
              >
                <StatusIcon className="w-4 h-4" />
                {t(`status.${visitor.status}`) || visitor.status}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ticket className="w-4 h-4" />
                <span className="font-medium">{visitor.tokenNumber}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {t('admin.visitors.checkInTime') || 'Check-in Time'}
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {format(parseISO(visitor.createdAt), 'MMM dd, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(visitor.createdAt), 'HH:mm:ss')}
              </p>
            </div>

            {visitor.calledAt && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {t('admin.visitors.waitTime') || 'Wait Time'}
                  </span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {waitTime !== null ? `${waitTime} min` : '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(visitor.calledAt), 'HH:mm:ss')}
                </p>
              </div>
            )}

            {visitor.servingStartedAt && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {t('admin.visitors.serviceTime') || 'Service Time'}
                  </span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {serviceTime !== null ? `${serviceTime} min` : '-'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {visitor.completedAt
                    ? format(parseISO(visitor.completedAt), 'HH:mm:ss')
                    : t('admin.visitors.inProgress') || 'In Progress'}
                </p>
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {t('admin.visitors.service') || 'Service'}
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {visitor.category?.name || '-'}
              </p>
              {visitor.agent && (
                <p className="text-sm text-muted-foreground">
                  {t('admin.visitors.agent') || 'Agent'}: {visitor.agent.firstName} {visitor.agent.lastName}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Visitor Analytics */}
        {visitorStats && allVisits.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {t('admin.visitors.visitorAnalytics') || 'Visitor Analytics'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {t('admin.visitors.totalVisits') || 'Total Visits'}
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {visitorStats.totalVisits}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {t('admin.visitors.completedVisits') || 'Completed'}
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {visitorStats.completedVisits}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {t('admin.visitors.avgServiceTime') || 'Avg Service Time'}
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {visitorStats.avgServiceTime} <span className="text-lg text-muted-foreground">min</span>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {t('admin.visitors.avgWaitTime') || 'Avg Wait Time'}
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {visitorStats.avgWaitTime} <span className="text-lg text-muted-foreground">min</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t('admin.visitors.completionRate') || 'Completion Rate'}
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-4">
                      <div
                        className="bg-primary h-4 rounded-full transition-all"
                        style={{ width: `${visitorStats.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {visitorStats.completionRate}%
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t('admin.visitors.servicesUsed') || 'Services Used'}
                </h3>
                <div className="space-y-2">
                  {Object.entries(visitorStats.servicesUsed).map(([service, count]: [string, any]) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{service}</span>
                      <span className="text-sm font-semibold text-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Visit History */}
        {allVisits.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-chart-1/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-chart-1" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                {t('admin.visitors.visitHistory') || 'Visit History'}
              </h2>
            </div>

            <div className="space-y-4">
              {allVisits.map((visit: any, index: number) => {
                const visitDuration = calculateDuration(visit.calledAt, visit.completedAt);
                const VisitStatusIcon = getStatusIcon(visit.status);
                const isCurrent = visit.id === visitor.id;

                return (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`p-4 border rounded-lg transition-all ${
                      isCurrent
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              visit.status
                            )}`}
                          >
                            <VisitStatusIcon className="w-3 h-3" />
                            {t(`status.${visit.status}`) || visit.status}
                          </span>
                          {isCurrent && (
                            <span className="text-xs font-medium text-primary">
                              {t('admin.visitors.currentVisit') || 'Current Visit'}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">
                              {t('admin.visitors.ticketNumber') || 'Ticket'}
                            </div>
                            <div className="font-medium text-foreground">{visit.tokenNumber}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">
                              {t('admin.visitors.service') || 'Service'}
                            </div>
                            <div className="font-medium text-foreground">
                              {visit.category?.name || '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">
                              {t('admin.visitors.date') || 'Date'}
                            </div>
                            <div className="font-medium text-foreground">
                              {format(parseISO(visit.createdAt), 'MMM dd, yyyy HH:mm')}
                            </div>
                          </div>
                          {visitDuration !== null && (
                            <div>
                              <div className="text-muted-foreground mb-1">
                                {t('admin.visitors.duration') || 'Duration'}
                              </div>
                              <div className="font-medium text-foreground">{visitDuration} min</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Additional Information */}
        {visitor.note && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">
              {t('admin.visitors.notes') || 'Notes'}
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {visitor.note}
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}

