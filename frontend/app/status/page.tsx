'use client';

import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Clock, Users, Ticket, CheckCircle2, Phone, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { format, parseISO } from 'date-fns';

export default function StatusPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(true);

  // Get current date and day name
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Filter tickets to show only today's tickets
  const filterTodayTickets = (statusData: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const filtered: any = {};
    
    Object.entries(statusData).forEach(([categoryName, agents]: [string, any]) => {
      const filteredAgents: any = {};
      
      Object.entries(agents).forEach(([agentName, tickets]: [string, any]) => {
        const agentTickets = Array.isArray(tickets) ? tickets : [];
        const todayTickets = agentTickets.filter((ticket: any) => {
          const ticketDate = new Date(ticket.createdAt);
          return ticketDate >= today && ticketDate <= todayEnd;
        });
        
        if (todayTickets.length > 0) {
          filteredAgents[agentName] = todayTickets;
        }
      });
      
      if (Object.keys(filteredAgents).length > 0) {
        filtered[categoryName] = filteredAgents;
      }
    });
    
    return filtered;
  };

  useEffect(() => {
    loadStatus();

    const socket = getSocket();
    socket.emit('join-public-room');
    
    socket.on('connect', () => {
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('status:updated', () => {
      loadStatus();
      setLastUpdated(new Date());
    });

    return () => {
      socket.off('status:updated');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const loadStatus = async () => {
    try {
      const response = await publicApi.getStatus();
      // Filter to show only today's tickets
      const filteredStatus = filterTodayTickets(response.data);
      setStatus(filteredStatus);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'called':
        return <Phone className="w-4 h-4" />;
      case 'serving':
        return <UserCheck className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'called':
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/30',
          text: 'text-primary',
          badge: 'bg-primary/20 text-primary border-primary/30',
        };
      case 'serving':
        return {
          bg: 'bg-chart-2/10',
          border: 'border-chart-2/30',
          text: 'text-chart-2',
          badge: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
        };
      case 'completed':
        return {
          bg: 'bg-chart-3/10',
          border: 'border-chart-3/30',
          text: 'text-chart-3',
          badge: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
        };
      default:
        return {
          bg: 'bg-muted',
          border: 'border-border',
          text: 'text-muted-foreground',
          badge: 'bg-muted text-muted-foreground border-border',
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'called':
        return t('status.called');
      case 'serving':
        return t('status.serving');
      case 'completed':
        return t('status.completed');
      case 'pending':
        return t('status.pending');
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    let totalTickets = 0;
    let pendingTickets = 0;
    let activeTickets = 0;
    let totalAgents = 0;

    Object.values(status).forEach((agents: any) => {
      Object.values(agents).forEach((tickets: any) => {
        if (Array.isArray(tickets)) {
          totalTickets += tickets.length;
          tickets.forEach((ticket: any) => {
            if (ticket.status === 'pending') pendingTickets++;
            if (ticket.status === 'called' || ticket.status === 'serving') activeTickets++;
          });
        }
      });
      totalAgents += Object.keys(agents).length;
    });

    return { totalTickets, pendingTickets, activeTickets, totalAgents };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <div className="text-lg text-foreground">{t('status.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle and Language Selector Header */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
                {t('status.title')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('status.subtitle')}
              </p>
            </motion.div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card text-card-foreground border rounded-xl shadow-sm p-4 md:p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalTickets}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{t('status.totalTickets')}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card text-card-foreground border rounded-xl shadow-sm p-4 md:p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-chart-4/10 rounded-lg">
                  <Clock className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.pendingTickets}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{t('status.pending')}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card text-card-foreground border rounded-xl shadow-sm p-4 md:p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-chart-2/10 rounded-lg">
                  <UserCheck className="w-5 h-5 text-chart-2" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.activeTickets}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{t('status.active')}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card text-card-foreground border rounded-xl shadow-sm p-4 md:p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-chart-3/10 rounded-lg">
                  <Users className="w-5 h-5 text-chart-3" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">{stats.totalAgents}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{t('status.agents')}</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-muted-foreground">
                {isConnected ? t('status.liveUpdates') : t('status.disconnected')}
              </span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {t('status.lastUpdated')} {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={loadStatus}
              className="ml-2 p-1.5 hover:bg-accent rounded-md transition-colors"
              title={t('status.refresh')}
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-muted-foreground text-xs">
              {format(currentDate, 'yyyy-MM-dd')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {Object.keys(status).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{t('status.noActiveQueues')}</h3>
            <p className="text-muted-foreground">
              {t('status.noActiveQueuesDesc')}
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(status).map(([categoryName, agents]: [string, any], categoryIdx) => (
              <motion.div
                key={categoryName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIdx * 0.1 }}
                className="bg-card text-card-foreground border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-primary/10 to-transparent border-b px-6 py-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    {categoryName}
                  </h2>
                </div>

                {/* Agents and Tickets */}
                <div className="p-6 ">
                  {Object.entries(agents).map(([agentName, tickets]: [string, any], agentIdx) => {
                    const agentTickets = Array.isArray(tickets) ? tickets : [];
                    const pendingCount = agentTickets.filter((t: any) => t.status === 'pending').length;
                    const activeCount = agentTickets.filter((t: any) => 
                      t.status === 'called' || t.status === 'serving'
                    ).length;

                    return (
                      <div key={agentName} className={agentIdx > 0 ? 'border-t pt-6' : ''}>
                        {/* Agent Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{agentName}</h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                {pendingCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {pendingCount} {t('status.pending').toLowerCase()}
                                  </span>
                                )}
                                {activeCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <UserCheck className="w-3 h-3" />
                                    {activeCount} {t('status.active').toLowerCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tickets List */}
                        {agentTickets.length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            {t('status.noTicketsInQueue')}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {agentTickets.map((ticket: any, ticketIdx: number) => {
                              const colors = getStatusColor(ticket.status);
                              return (
                                <motion.div
                                  key={ticketIdx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: (categoryIdx * 0.1) + (agentIdx * 0.05) + (ticketIdx * 0.02) }}
                                  className={`p-3 rounded-lg border ${colors.bg} ${colors.border} transition-all hover:shadow-sm`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className={`p-1.5 rounded-md ${colors.badge} border flex-shrink-0`}>
                                        {getStatusIcon(ticket.status)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-mono font-bold text-lg text-foreground">
                                            {ticket.tokenNumber}
                                          </span>
                                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colors.badge}`}>
                                            {getStatusLabel(ticket.status)}
                                          </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {t('status.position')} #{ticket.positionInQueue}
                                        </div>
                                        {ticket.createdAt && (
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <Clock className="w-3 h-3" />
                                            {format(parseISO(ticket.createdAt), 'yyyy-MM-dd HH:mm')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            ← {t('customer.backToHome')}
          </a>
        </div>
      </div>
    </div>
  );
}
