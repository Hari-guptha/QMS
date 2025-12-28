'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agentApi, authApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Ticket,
  Phone,
  UserCheck,
  CheckCircle2,
  X,
  RotateCcw,
  GripVertical,
  BarChart3,
  Clock,
  Users,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  Mail,
  FolderOpen
} from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';

export default function AgentDashboard() {
  const { t } = useI18n();
  const router = useRouter();
  const { confirm } = useConfirm();
  const [queue, setQueue] = useState<any[]>([]);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [assignedService, setAssignedService] = useState<any>(null);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/agent/login');
      return;
    }

    const user = auth.getUser();
    if (!user) {
      router.push('/agent/login');
      return;
    }

    // Redirect admins to admin dashboard
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    // Only allow agents
    if (user.role !== 'agent') {
      router.push('/agent/login');
      return;
    }

    loadQueue();
    loadAgentProfile();

    const socket = getSocket();
    setSocketConnected(socket.connected);
    
    const handleConnect = () => {
      socket.emit('join-agent-room', user.id);
      setSocketConnected(true);
      console.log('Socket connected, joined agent room:', user.id);
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
      console.log('Socket disconnected');
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    socket.on('disconnect', handleDisconnect);

    const handleQueueUpdate = (data?: any) => {
      console.log('Queue updated event received:', data);
      loadQueue();
    };

    const handleTicketCreated = (ticket: any) => {
      console.log('New ticket created:', ticket);
      if (ticket.agentId === user.id) {
        loadQueue();
      }
    };

    const handleTicketStatusChange = (ticket: any) => {
      console.log('Ticket status changed:', ticket);
      if (ticket.agentId === user.id) {
        loadQueue();
      }
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('ticket:created', handleTicketCreated);
    socket.on('ticket:called', handleTicketStatusChange);
    socket.on('ticket:serving', handleTicketStatusChange);
    socket.on('ticket:completed', handleTicketStatusChange);
    socket.on('ticket:no-show', handleTicketStatusChange);
    socket.on('ticket:transferred', handleTicketStatusChange);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('ticket:created', handleTicketCreated);
      socket.off('ticket:called', handleTicketStatusChange);
      socket.off('ticket:serving', handleTicketStatusChange);
      socket.off('ticket:completed', handleTicketStatusChange);
      socket.off('ticket:no-show', handleTicketStatusChange);
      socket.off('ticket:transferred', handleTicketStatusChange);
    };
  }, [router]);

  const loadQueue = async () => {
    try {
      const response = await agentApi.getMyQueue();
      setQueue(response.data);
      // Only set current ticket if it's serving (not hold or completed)
      const serving = response.data.find((t: any) => t.status === 'serving');
      if (serving) {
        setCurrentTicket(serving);
      } else {
        // Clear current ticket if no serving ticket exists
        setCurrentTicket(null);
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentProfile = async () => {
    try {
      const response = await authApi.getProfile();
      const agent = response.data;
      // Find the active assigned service (agent can only have one)
      // Handle MSSQL bit type (1/0) for isActive
      const activeCategory = agent.agentCategories?.find(
        (ac: any) => (ac.isActive === true || ac.isActive === 1) && ac.category
      );
      if (activeCategory) {
        setAssignedService(activeCategory.category);
      }
    } catch (error) {
      console.error('Failed to load agent profile:', error);
    }
  };

  const handleCallNext = async () => {
    try {
      const response = await agentApi.callNext();
      setCurrentTicket(response.data);
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.callNext'));
    }
  };


  const handleComplete = async (ticketId: string) => {
    try {
      await agentApi.markAsCompleted(ticketId);
      setCurrentTicket(null);
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.completeTicket'));
    }
  };

  const handleNoShow = async (ticketId: string) => {
    try {
      await agentApi.markAsNoShow(ticketId);
      // Clear current ticket if it's the one being put on hold
      if (currentTicket && currentTicket.id === ticketId) {
        setCurrentTicket(null);
      }
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.holdTicket'));
    }
  };

  const handleReopen = async (ticketId: string) => {
    const confirmed = await confirm(t('admin.queues.confirmReopen'));
    if (!confirmed) return;
    try {
      await agentApi.reopenTicket(ticketId);
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.reopenTicket'));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentPendingTickets = queue.filter((t: any) => t.status === 'pending');
    const oldIndex = currentPendingTickets.findIndex((t: any) => t.id === active.id);
    const newIndex = currentPendingTickets.findIndex((t: any) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newOrder = arrayMove(currentPendingTickets, oldIndex, newIndex);
    const updatedOrder = newOrder.map((ticket: any, index: number) => ({
      ...ticket,
      positionInQueue: index + 1,
    }));
    const newQueue = [
      ...queue.filter((t: any) => t.status !== 'pending'),
      ...updatedOrder,
    ];
    setQueue(newQueue);

    try {
      const ticketIds = newOrder.map((t: any) => t.id);
      await agentApi.reorderQueue(ticketIds);
    } catch (error: any) {
      loadQueue();
      alert(error.response?.data?.message || 'Failed to reorder queue');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
            <div className="text-lg text-muted-foreground">{t('admin.loadingDashboard')}</div>
          </motion.div>
        </div>
      </div>
    );
  }

  const pendingTickets = queue.filter((t: any) => t.status === 'pending');
  const holdTickets = queue.filter((t: any) => t.status === 'hold');
  const completedTickets = queue.filter((t: any) => t.status === 'completed' || t.status === 'no_show');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-4xl font-bold text-foreground">{t('dashboard.agent')}</h1>
              </div>
              {assignedService && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 ml-11"
                >
                  <FolderOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('agent.assignedService')}</span>
                  <span className="text-sm font-semibold text-foreground">{assignedService.name}</span>
                </motion.div>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                socketConnected 
                  ? 'bg-chart-2/10 border-chart-2/30 text-chart-2' 
                  : 'bg-destructive/10 border-destructive/30 text-destructive'
              }`}
            >
              {socketConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {socketConnected ? t('status.connected') : t('status.disconnected')}
              </span>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Queue Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Currently Serving */}
            <AnimatePresence>
              {currentTicket && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-gradient-to-br from-chart-2/20 to-chart-2/5 border-2 border-chart-2/30 rounded-2xl shadow-lg p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-chart-2/20 rounded-xl">
                      <UserCheck className="w-6 h-6 text-chart-2" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{t('agent.currentlyServing')}</h2>
                  </div>
                  <div className="mb-4 space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ticket ID</p>
                      <p className="text-4xl font-mono font-bold text-foreground">
                        {currentTicket.tokenNumber}
                      </p>
                    </div>
                    {currentTicket.category && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t('customer.category')}</p>
                        <p className="text-lg font-semibold text-foreground">
                          {currentTicket.category.name}
                        </p>
                      </div>
                    )}
                    {(currentTicket.customerName || currentTicket.customerPhone || currentTicket.customerEmail) && (
                      <div className="pt-2 border-t border-chart-2/20">
                        <p className="text-xs text-muted-foreground mb-2">{t('agent.customerDetails')}</p>
                        <div className="space-y-1">
                          {currentTicket.customerName && (
                            <p className="text-sm text-foreground flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              {currentTicket.customerName}
                            </p>
                          )}
                          {currentTicket.customerPhone && (
                            <p className="text-sm text-foreground flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              {currentTicket.customerPhone}
                            </p>
                          )}
                          {currentTicket.customerEmail && (
                            <p className="text-sm text-foreground flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              {currentTicket.customerEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                    <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleComplete(currentTicket.id)}
                      className="flex-1 bg-chart-2 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {t('admin.queues.complete')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNoShow(currentTicket.id)}
                      className="flex-1 bg-destructive text-destructive-foreground px-6 py-3 rounded-xl hover:bg-destructive/90 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      {t('common.hold')}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Queue Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card text-card-foreground border rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Ticket className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t('agent.myQueue')}</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCallNext}
                  disabled={pendingTickets.length === 0}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors shadow-lg"
                  >
                  <Phone className="w-5 h-5" />
                  {t('admin.queues.callNext')}
                </motion.button>
              </div>

              {/* Pending Tickets */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-chart-4" />
                  {t('common.pending')} ({pendingTickets.length})
                </h3>
                {pendingTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('admin.queues.noPendingTickets')}</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pendingTickets.map((t: any) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {pendingTickets.map((ticket: any, index: number) => (
                          <SortableTicketItem key={ticket.id} ticket={ticket} index={index} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              {/* Hold Tickets */}
              {holdTickets.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    {t('common.hold')} ({holdTickets.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {holdTickets.map((ticket: any, index: number) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-xl text-foreground">
                                {ticket.tokenNumber}
                              </span>
                              {ticket.category && (
                                <span className="px-2 py-1 bg-destructive/20 text-destructive rounded-full text-xs">
                                  {ticket.category.name}
                                </span>
                              )}
                            </div>
                            {(ticket.customerName || ticket.customerPhone || ticket.customerEmail) && (
                              <div className="space-y-1">
                                {ticket.customerName && (
                                  <p className="text-sm text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    {ticket.customerName}
                                  </p>
                                )}
                                {ticket.customerPhone && (
                                  <p className="text-sm text-foreground flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    {ticket.customerPhone}
                                  </p>
                                )}
                                {ticket.customerEmail && (
                                  <p className="text-sm text-foreground flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    {ticket.customerEmail}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleReopen(ticket.id)}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 ml-4"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {t('admin.queues.reopen')}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tickets */}
              {completedTickets.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-chart-3" />
                    {t('status.completed')} ({completedTickets.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {completedTickets.map((ticket: any, index: number) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-muted border rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-xl text-foreground">
                                {ticket.tokenNumber}
                              </span>
                              {ticket.category && (
                                <span className="px-2 py-1 bg-chart-3/20 text-chart-3 rounded-full text-xs">
                                  {ticket.category.name}
                                </span>
                              )}
                              <span className="px-2 py-1 bg-muted-foreground/20 text-muted-foreground rounded-full text-xs">
                                {ticket.status}
                              </span>
                            </div>
                            {(ticket.customerName || ticket.customerPhone || ticket.customerEmail) && (
                              <div className="space-y-1">
                                {ticket.customerName && (
                                  <p className="text-sm text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    {ticket.customerName}
                                  </p>
                                )}
                                {ticket.customerPhone && (
                                  <p className="text-sm text-foreground flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    {ticket.customerPhone}
                                  </p>
                                )}
                                {ticket.customerEmail && (
                                  <p className="text-sm text-foreground flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    {ticket.customerEmail}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleReopen(ticket.id)}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2 ml-4"
                          >
                            <RotateCcw className="w-4 h-4" />
                            {t('admin.queues.reopen')}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Statistics Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card text-card-foreground border rounded-2xl shadow-lg p-6 h-fit"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t('agent.statistics')}</h2>
            </div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 bg-white dark:bg-[#171717] border border-primary/20 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                      <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  <span className="text-muted-foreground">{t('agent.totalInQueue')}</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">{queue.length}</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-white dark:bg-[#171717] border border-chart-4/20 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  <span className="text-muted-foreground">{t('common.pending')}</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">{pendingTickets.length}</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-4 bg-white dark:bg-[#171717] border border-chart-2/20 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                      <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  <span className="text-muted-foreground">{t('common.serving')}</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    {currentTicket ? 1 : 0}
                  </span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-4 bg-white dark:bg-[#171717] border border-destructive/20 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-lg">
                      <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  <span className="text-muted-foreground">{t('common.hold')}</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">{holdTickets.length}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Sortable Ticket Item Component
function SortableTicketItem({ ticket, index }: { ticket: any; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl flex justify-between items-center hover:shadow-md transition-all ${
          isDragging ? 'cursor-grabbing shadow-xl z-50' : 'cursor-grab'
        }`}
      >
        <div 
          className="flex items-center gap-3 flex-1" 
          {...attributes} 
          {...listeners}
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono font-bold text-xl text-foreground">
                {ticket.tokenNumber}
              </span>
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                #{ticket.positionInQueue}
              </span>
            </div>
            {ticket.category && (
              <p className="text-sm text-muted-foreground mb-1">
                {ticket.category.name}
              </p>
            )}
            {(ticket.customerName || ticket.customerPhone || ticket.customerEmail) && (
              <div className="mt-2 space-y-1">
                {ticket.customerName && (
                  <p className="text-xs text-foreground flex items-center gap-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    {ticket.customerName}
                  </p>
                )}
                {ticket.customerPhone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {ticket.customerPhone}
                  </p>
                )}
                {ticket.customerEmail && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {ticket.customerEmail}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
