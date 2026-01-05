'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
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
  List,
  ArrowLeft,
  User,
  FolderOpen,
  GripVertical,
  CheckCircle2,
  X,
  Edit2,
  Trash2,
  Phone,
  UserCheck,
  RotateCcw,
  Loader2,
  Save,
  Search,
  Users,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  startOfMonth,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Select } from '@/components/ui/Select';
import { useConfirm } from '@/components/ConfirmDialog';

export default function AllQueues() {
  const router = useRouter();
  const { t } = useI18n();
  const { confirm } = useConfirm();
  const [agents, setAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [reassigningTicket, setReassigningTicket] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });
  const [viewType, setViewType] = useState<'queue' | 'history'>('queue');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  const [hoveredTicket, setHoveredTicket] = useState<any | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadAgents();
    loadCategories();
  }, [router]);

  useEffect(() => {
    if (selectedAgentId) {
      if (viewType === 'queue') {
        loadAgentQueue(selectedAgentId);
      } else {
        loadAgentHistory(selectedAgentId);
      }
    } else {
      setQueue([]);
      setHistoryTickets([]);
    }
  }, [selectedAgentId, viewType, currentDate, viewMode]);

  const loadAgents = async () => {
    try {
      const response = await adminApi.getAgents();
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadAgentQueue = async (agentId: string) => {
    setLoading(true);
    try {
      const response = await adminApi.getAgentQueue(agentId);
      setQueue(response.data);
    } catch (error) {
      console.error('Failed to load queue:', error);
      alert(t('admin.queues.alert.loadQueue'));
    } finally {
      setLoading(false);
    }
  };

  const loadAgentHistory = async (agentId: string) => {
    setLoading(true);
    try {
      let start: Date;
      let end: Date;

      if (viewMode === 'day') {
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
      } else if (viewMode === 'week') {
        start = startOfWeek(currentDate, { weekStartsOn: 0 });
        end = addDays(start, 6);
        end.setHours(23, 59, 59, 999);
      } else {
        start = startOfMonth(currentDate);
        end = addMonths(start, 1);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
      }

      const response = await agentApi.getAgentHistory(
        agentId,
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      setHistoryTickets(response.data || []);
    } catch (error) {
      console.error('Failed to load agent history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const pendingTickets = queue.filter((t: any) => t.status === 'pending');
    const oldIndex = pendingTickets.findIndex((t: any) => t.id === active.id);
    const newIndex = pendingTickets.findIndex((t: any) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const newOrder = arrayMove(pendingTickets, oldIndex, newIndex);
    // Update positionInQueue for each ticket
    const updatedOrder = newOrder.map((ticket: any, index: number) => ({
      ...ticket,
      positionInQueue: index + 1,
    }));
    const newQueue = [
      ...queue.filter((t: any) => t.status !== 'pending'),
      ...updatedOrder,
    ];
    setQueue(newQueue);

    // Update backend
    try {
      const ticketIds = newOrder.map((t: any) => t.id);
      await adminApi.reorderAgentQueue(selectedAgentId, ticketIds);
      // Don't reload immediately - the optimistic update is already in place
      // Only reload if we need to sync with server state later
    } catch (error: any) {
      // Revert on error
      loadAgentQueue(selectedAgentId);
      alert(error.response?.data?.message || t('admin.queues.alert.reorderQueue'));
    }
  };

  const handleAdminCallNext = async (agentId: string) => {
    try {
      await adminApi.adminCallNext(agentId);
      loadAgentQueue(agentId);
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.callNext'));
    }
  };

  const handleAdminComplete = async (ticketId: string) => {
    const confirmed = await confirm(t('admin.queues.confirmComplete'));
    if (!confirmed) return;
    try {
      await adminApi.adminMarkAsCompleted(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.completeTicket'));
    }
  };

  const handleAdminHold = async (ticketId: string) => {
    const confirmed = await confirm(t('admin.queues.confirmHold'));
    if (!confirmed) return;
    try {
      await adminApi.adminMarkAsNoShow(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.holdTicket'));
    }
  };


  const handleDeleteTicket = async (ticketId: string) => {
    const confirmed = await confirm(t('admin.queues.confirmDelete'));
    if (!confirmed) return;
    try {
      await adminApi.deleteTicket(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.deleteTicket'));
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    const confirmed = await confirm(t('admin.queues.confirmReopen'));
    if (!confirmed) return;
    try {
      await adminApi.adminReopenTicket(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.reopenTicket'));
    }
  };

  const handleEditTicket = (ticket: any) => {
    setEditingTicket(ticket);
    setEditFormData({
      customerName: ticket.customerName || '',
      customerPhone: ticket.customerPhone || '',
      customerEmail: ticket.customerEmail || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTicket) return;
    try {
      await adminApi.adminUpdateTicket(editingTicket.id, editFormData);
      setEditingTicket(null);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || t('admin.queues.alert.updateTicket'));
    }
  };

  const handleReassignTicket = async (ticketId: string, newAgentId: string) => {
    try {
      await adminApi.reassignTicket(ticketId, newAgentId);
      setReassigningTicket(null);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reassign ticket');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const pendingTickets = queue.filter((t: any) => t.status === 'pending');
  const holdTickets = queue.filter((t: any) => t.status === 'hold');
  const otherTickets = queue.filter((t: any) => t.status !== 'pending' && t.status !== 'hold');

  // Filter agents based on search query
  const filteredAgents = useMemo(() => {
    if (!agentSearchQuery.trim()) {
      return agents;
    }
    const query = agentSearchQuery.toLowerCase().trim();
    return agents.filter((agent) => {
      const fullName = `${agent.firstName || ''} ${agent.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(query) ||
        agent.firstName?.toLowerCase().includes(query) ||
        agent.lastName?.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query) ||
        agent.employeeId?.toLowerCase().includes(query)
      );
    });
  }, [agents, agentSearchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'serving':
        return <UserCheck className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'hold':
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handlePrev = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getTicketsForDate = (date: Date) => {
    return historyTickets.filter((ticket) => isSameDay(parseISO(ticket.createdAt), date));
  };

  const getTicketsForHour = (date: Date, hour: number) => {
    return historyTickets.filter((ticket) => {
      const ticketDate = parseISO(ticket.createdAt);
      return isSameDay(ticketDate, date) && ticketDate.getHours() === hour;
    });
  };

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'HH:mm');
  };

  const renderMonthView = () => {
    const startDay = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const daysInMonth = Array.from({ length: 42 }, (_, i) => addDays(startDay, i));

    return (
      <div className="rounded-xl border border-border overflow-hidden bg-border">
        <div className="grid grid-cols-7 bg-muted/60 text-xs font-medium text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 px-2 text-center border-b border-border/70">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-border">
          {daysInMonth.map(day => {
            const dayTickets = getTicketsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const maxVisible = 3;

            return (
              <button
                key={day.toISOString()}
                className={`min-h-[110px] bg-background p-1.5 text-left border-border/70 border-r border-b ${
                  !isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${isTodayDate ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {isTodayDate && (
                    <span className="inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
                      Today
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayTickets.slice(0, maxVisible).map(ticket => (
                    <div
                      key={ticket.id}
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        setHoveredTicket(ticket);
                        setHoverPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredTicket(null)}
                    >
                      <span className="inline-flex items-center justify-center rounded-full border font-medium w-fit whitespace-nowrap shrink-0 text-[10px] px-1.5 py-0.5 text-foreground hover:bg-accent hover:text-accent-foreground transition">
                        {ticket.tokenNumber || formatTime(ticket.createdAt)}
                      </span>
                    </div>
                  ))}
                  {dayTickets.length > maxVisible && (
                    <div className="text-[11px] text-primary cursor-pointer">
                      +{dayTickets.length - maxVisible} more tickets
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDay = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDay, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="border rounded-xl bg-background overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-muted/60">
          <div></div>
          {days.map(day => (
            <div key={day.toISOString()} className="py-2 text-center text-xs font-medium">
              {format(day, 'EEE d')}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[60px_repeat(7,1fr)] text-xs">
          {hours.map(hour => (
            <>
              <div key={`hour-${hour}`} className="h-16 border-r text-muted-foreground pl-2 pt-2">
                {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
              </div>
              {days.map(day => {
                const hourTickets = getTicketsForHour(day, hour);
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="border-r border-b relative h-16 cursor-pointer hover:bg-muted/40 transition"
                    onMouseEnter={(e) => {
                      if (hourTickets.length > 0) {
                        setHoveredTicket(hourTickets[0]);
                        setHoverPosition({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={() => setHoveredTicket(null)}
                  >
                    {hourTickets.length > 0 && (
                      <div className="absolute top-1 left-1 right-1 rounded bg-primary/10 p-1 text-[10px]">
                        {hourTickets.length === 1 
                          ? hourTickets[0].tokenNumber || 'Ticket'
                          : `${hourTickets.length} tickets`}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayTickets = getTicketsForDate(currentDate);

    return (
      <div className="border rounded-xl bg-background overflow-hidden">
        <div className="py-3 px-4 border-b bg-muted/40 text-sm font-semibold">
          {format(currentDate, 'EEE EEE MMM dd yyyy')}
        </div>
        <div className="grid grid-cols-[70px_1fr] text-xs">
          {hours.map(hour => {
            const hourTickets = getTicketsForHour(currentDate, hour);
            return (
              <>
                <div key={`hour-${hour}`} className="h-16 border-r text-muted-foreground flex items-start pt-2 pl-2">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>
                <div
                  className="border-b h-16 relative cursor-pointer hover:bg-muted/30 transition"
                  onMouseEnter={(e) => {
                    if (hourTickets.length > 0) {
                      setHoveredTicket(hourTickets[0]);
                      setHoverPosition({ x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseLeave={() => setHoveredTicket(null)}
                >
                  {hourTickets.length > 0 && (
                    <div className="absolute top-1 left-1 right-1 rounded bg-primary/10 p-1 text-[10px]">
                      {hourTickets.length === 1 
                        ? hourTickets[0].tokenNumber || 'Ticket'
                        : `${hourTickets.length} tickets`}
                    </div>
                  )}
                </div>
              </>
            );
          })}
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'serving':
        return 'bg-chart-2/20 text-chart-2 border-chart-2/30';
      case 'completed':
        return 'bg-chart-3/20 text-chart-3 border-chart-3/30';
      case 'hold':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

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
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.users.backToDashboard')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-1/10 rounded-lg">
              <List className="w-6 h-6 text-chart-1" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">{t('admin.queues.title')}</h1>
          </div>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card text-card-foreground border rounded-2xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            {t('admin.queues.selectAgentOrCategory')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('admin.queues.filterByAgent')}
              </label>
              {/* Search Input for Agents - Only show when agent dropdown is enabled */}
              {!selectedCategoryId && (
                <div className="mb-3 relative">
                  <div className="flex items-center gap-0 bg-card/80 dark:bg-card border border-border rounded-xl px-2 py-1">
                    <span className="pl-2 pr-1 text-xl text-primary/80">
                      <Search className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder={t('admin.queues.searchAgents')}
                      value={agentSearchQuery}
                      onChange={(e) => setAgentSearchQuery(e.target.value)}
                      className="flex h-9 w-full min-w-0 py-1 outline-none border-0 bg-transparent rounded-lg focus:ring-0 focus-visible:ring-0 shadow-none text-base px-2 text-foreground placeholder:text-muted-foreground transition-[color,box-shadow]"
                    />
                  </div>
                  {/* Show filtered agents list when searching */}
                  {agentSearchQuery.trim() && filteredAgents.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-auto"
                    >
                      <div className="p-1">
                        {filteredAgents.map((agent) => (
                          <button
                            key={agent.id}
                            type="button"
                            onClick={() => {
                              setSelectedAgentId(agent.id);
                              setSelectedCategoryId('');
                              setAgentSearchQuery('');
                            }}
                            className="w-full px-4 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground text-foreground transition-colors"
                          >
                            {agent.firstName} {agent.lastName}
                            {agent.email && (
                              <span className="text-xs text-muted-foreground block">{agent.email}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {agentSearchQuery.trim() && filteredAgents.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg p-4 text-center text-muted-foreground"
                    >
                      {t('admin.queues.noAgentsFound')}
                    </motion.div>
                  )}
                </div>
              )}
              {!agentSearchQuery.trim() && (
                <Select
                  value={selectedAgentId}
                  onChange={(value) => {
                    setSelectedAgentId(value);
                    setSelectedCategoryId('');
                    setAgentSearchQuery('');
                  }}
                  disabled={!!selectedCategoryId}
                  placeholder={t('admin.queues.selectAgent')}
                  options={[
                    { value: '', label: t('admin.queues.selectAgent') },
                    ...agents.map((agent) => ({
                      value: agent.id,
                      label: `${agent.firstName} ${agent.lastName}`,
                    })),
                  ]}
                />
              )}
              {agentSearchQuery.trim() && !selectedAgentId && (
                <div className="text-sm text-muted-foreground mt-2">
                  {filteredAgents.length} {t('admin.queues.agentsFound')}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                {t('admin.queues.filterByCategory')}
              </label>
              <Select
                value={selectedCategoryId}
                onChange={(value) => {
                  setSelectedCategoryId(value);
                  setSelectedAgentId('');
                  setAgentSearchQuery('');
                }}
                disabled={!!selectedAgentId}
                placeholder={t('admin.queues.selectCategory')}
                options={[
                  { value: '', label: t('admin.queues.selectCategory') },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
              />
            </div>
          </div>
        </motion.div>

        {/* Agent Queue */}
        {selectedAgentId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card text-card-foreground border rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <User className="w-6 h-6 text-primary" />
                {t('admin.queues.queueFor')} {agents.find((a) => a.id === selectedAgentId)?.firstName}{' '}
                {agents.find((a) => a.id === selectedAgentId)?.lastName}
              </h2>
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div
                  role="tablist"
                  className="text-muted-foreground h-9 w-fit items-center justify-center p-[3px] flex gap-2 rounded-full bg-card border border-border"
                >
                  <button
                    type="button"
                    onClick={() => setViewType('queue')}
                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 border border-transparent text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 p-2 rounded-full border-none cursor-pointer ${
                      viewType === 'queue'
                        ? 'bg-accent/20 text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewType('history')}
                    className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 border border-transparent text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 p-2 rounded-full border-none cursor-pointer ${
                      viewType === 'history'
                        ? 'bg-accent/20 text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    History
                  </button>
                </div>
                {viewType === 'queue' && pendingTickets.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAdminCallNext(selectedAgentId)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Phone className="w-5 h-5" />
                    {t('admin.queues.callNext')}
                  </motion.button>
                )}
              </div>
            </div>

            {viewType === 'history' ? (
              <>
                {/* Calendar View Controls */}
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6" />
                    <div>
                      <h3 className="text-xl font-semibold">Customer history</h3>
                      <p className="text-sm text-muted-foreground">Calendar view of customer appointments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 border border-border rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('day')}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          viewMode === 'day'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        Day
                      </button>
                      <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          viewMode === 'week'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          viewMode === 'month'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        Month
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrev}
                        className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleToday}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm"
                      >
                        Today
                      </button>
                      <button
                        onClick={handleNext}
                        className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calendar View */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden">
                    {viewMode === 'month' && renderMonthView()}
                    {viewMode === 'week' && renderWeekView()}
                    {viewMode === 'day' && renderDayView()}
                  </div>
                )}

                {/* Ticket Hover Tooltip */}
                <AnimatePresence>
                  {hoveredTicket && hoverPosition && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="fixed z-50 bg-card border border-border rounded-lg shadow-xl p-4 max-w-xs pointer-events-none"
                      style={{
                        left: hoverPosition.x + 10,
                        top: hoverPosition.y + 10,
                      }}
                    >
                      <div className="space-y-2">
                        <div className="font-bold text-foreground">{hoveredTicket.tokenNumber}</div>
                        {hoveredTicket.customerName && (
                          <div className="text-sm text-foreground">Customer: {hoveredTicket.customerName}</div>
                        )}
                        {hoveredTicket.category && (
                          <div className="text-sm text-muted-foreground">Category: {hoveredTicket.category.name}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(hoveredTicket.createdAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                        <div className="text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            hoveredTicket.status === 'completed'
                              ? 'bg-chart-2/20 text-chart-2'
                              : hoveredTicket.status === 'no_show' || hoveredTicket.status === 'hold'
                              ? 'bg-destructive/20 text-destructive'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {hoveredTicket.status}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : queue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('admin.queues.noTickets')}
                  </div>
                ) : (
                  <>
                {/* Hold Tickets */}
                {holdTickets.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                      <X className="w-5 h-5 text-destructive" />
                      {t('common.hold')} ({holdTickets.length})
                    </h3>
                    <div className="space-y-3">
                      {holdTickets.map((ticket: any, index: number) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex justify-between items-center hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-destructive/20 rounded-lg">
                              <X className="w-4 h-4 text-destructive" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-lg text-foreground">
                                  {ticket.tokenNumber}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-medium border bg-destructive/20 text-destructive border-destructive/30">
                                  {t('common.hold')}
                                </span>
                              </div>
                              {ticket.customerName && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {ticket.customerName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleReopenTicket(ticket.id)}
                              className="bg-chart-4 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                            >
                              <RotateCcw className="w-4 h-4" />
                              {t('admin.queues.reopen')}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditTicket(ticket)}
                              className="bg-chart-4 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              {t('common.edit')}
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Tickets */}
                {otherTickets.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-chart-2" />
                      {t('admin.queues.activeTickets')} ({otherTickets.length})
                    </h3>
                    <div className="space-y-3">
                      {otherTickets.map((ticket: any, index: number) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gradient-to-r from-muted to-muted/50 border border-border rounded-xl flex justify-between items-center hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              {getStatusIcon(ticket.status)}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-lg text-foreground">
                                  {ticket.tokenNumber}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                                  {ticket.status}
                                </span>
                              </div>
                              {ticket.customerName && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {ticket.customerName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(ticket.status === 'completed' || ticket.status === 'no_show' || ticket.status === 'hold') && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleReopenTicket(ticket.id)}
                                className="bg-chart-4 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" />
                                {t('admin.queues.reopen')}
                              </motion.button>
                            )}
                            {ticket.status !== 'completed' && ticket.status !== 'no_show' && ticket.status !== 'hold' && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAdminComplete(ticket.id)}
                                  className="bg-chart-2 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {t('admin.queues.complete')}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAdminHold(ticket.id)}
                                  className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm hover:bg-destructive/90 transition-colors shadow-sm flex items-center gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  {t('common.hold')}
                                </motion.button>
                              </>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditTicket(ticket)}
                              className="bg-chart-4 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              {t('common.edit')}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm hover:bg-destructive/90 transition-colors shadow-sm flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('admin.queues.delete')}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setReassigningTicket(ticket)}
                              className="bg-chart-1 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                            >
                              <Users className="w-4 h-4" />
                              Reassign
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Tickets */}
                <div>
                  <h3 className="font-bold text-xl mb-4 text-foreground flex items-center gap-2">
                    <List className="w-5 h-5 text-primary" />
                    {t('admin.queues.pendingTickets')} ({pendingTickets.length})
                  </h3>
                  {pendingTickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t('admin.queues.noPendingTickets')}</p>
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
                            <SortableTicketItem
                              key={ticket.id}
                              ticket={ticket}
                              onComplete={handleAdminComplete}
                              onHold={handleAdminHold}
                              onDelete={handleDeleteTicket}
                              onReassign={(t) => setReassigningTicket(t)}
                              index={index}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Category Selection */}
        {selectedCategoryId && !selectedAgentId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card text-card-foreground border rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-chart-2" />
              {t('admin.queues.queuesForCategory')}: {categories.find((c) => c.id === selectedCategoryId)?.name}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('admin.queues.selectAgentToManage')}
            </p>
            {/* Search Input for Category Agents */}
            <div className="mb-4">
              <div className="flex items-center gap-0 bg-card/80 dark:bg-card border border-border rounded-xl px-2 py-1 max-w-md">
                <span className="pl-2 pr-1 text-xl text-primary/80">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder={t('admin.queues.searchAgents')}
                  value={agentSearchQuery}
                  onChange={(e) => setAgentSearchQuery(e.target.value)}
                  className="flex h-9 w-full min-w-0 py-1 outline-none border-0 bg-transparent rounded-lg focus:ring-0 focus-visible:ring-0 shadow-none text-base px-2 text-foreground placeholder:text-muted-foreground transition-[color,box-shadow]"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {agents
                .filter((agent) => {
                  // Handle MSSQL bit type (1/0) for isActive
                  const matchesCategory = agent.agentCategories?.some(
                    (ac: any) => ac.categoryId === selectedCategoryId && (ac.isActive === true || ac.isActive === 1)
                  );
                  if (!matchesCategory) return false;

                  const query = agentSearchQuery.toLowerCase();
                  return (
                    !agentSearchQuery ||
                    agent.firstName?.toLowerCase().includes(query) ||
                    agent.lastName?.toLowerCase().includes(query) ||
                    agent.email?.toLowerCase().includes(query) ||
                    agent.employeeId?.toLowerCase().includes(query)
                  );
                })
                .map((agent, index) => (
                  <motion.button
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setSelectedCategoryId('');
                    }}
                    className="p-4 bg-gradient-to-r from-muted to-muted/50 border border-border rounded-xl hover:shadow-md text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {agent.firstName} {agent.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('admin.queues.clickToManage')}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
            </div>
          </motion.div>
        )}

        {/* Edit Ticket Modal */}
        <AnimatePresence>
          {editingTicket && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setEditingTicket(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card text-card-foreground border rounded-2xl shadow-2xl p-8 max-w-md w-full"
                >
                  <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
                    <Edit2 className="w-6 h-6 text-primary" />
                    {t('admin.queues.editTicket')}: {editingTicket.tokenNumber}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('admin.queues.customerName')}
                      </label>
                      <input
                        type="text"
                        value={editFormData.customerName}
                        onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        placeholder={t('admin.queues.enterName')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('admin.queues.customerPhone')}
                      </label>
                      <input
                        type="tel"
                        value={editFormData.customerPhone}
                        onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        placeholder={t('admin.queues.enterPhone')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {t('admin.queues.customerEmail')}
                      </label>
                      <input
                        type="email"
                        value={editFormData.customerEmail}
                        onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        placeholder={t('admin.queues.enterEmail')}
                      />
                    </div>
                    <div className="flex gap-3 mt-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveEdit}
                        className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Save
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEditingTicket(null)}
                        className="flex-1 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl hover:bg-secondary/80 transition-colors border flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Reassign Ticket Modal */}
        <AnimatePresence>
          {reassigningTicket && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setReassigningTicket(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card text-card-foreground border rounded-2xl shadow-2xl p-8 max-w-md w-full"
                >
                  <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    Reassign Ticket: {reassigningTicket.tokenNumber}
                  </h2>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Select another agent in the same service ({reassigningTicket.category?.name}) to reassign this ticket to.
                    </p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {agents
                        .filter(a => a.id !== selectedAgentId && a.agentCategories?.some((ac: any) => ac.categoryId === reassigningTicket.categoryId && (ac.isActive === true || ac.isActive === 1)))
                        .map(agent => (
                          <button
                            key={agent.id}
                            onClick={() => handleReassignTicket(reassigningTicket.id, agent.id)}
                            className="w-full p-3 text-left border border-border rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-3"
                          >
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{agent.firstName} {agent.lastName}</span>
                          </button>
                        ))}
                      {agents.filter(a => a.id !== selectedAgentId && a.agentCategories?.some((ac: any) => ac.categoryId === reassigningTicket.categoryId && (ac.isActive === true || ac.isActive === 1))).length === 0 && (
                        <p className="text-center py-4 text-muted-foreground italic">No other agents available for this service.</p>
                      )}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setReassigningTicket(null)}
                        className="flex-1 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl hover:bg-secondary/80 transition-colors border flex items-center justify-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Sortable Ticket Item Component
function SortableTicketItem({
  ticket,
  onComplete,
  onHold,
  onDelete,
  onReassign,
  index
}: {
  ticket: any;
  onComplete: (id: string) => void;
  onHold: (id: string) => void;
  onDelete: (id: string) => void;
  onReassign: (ticket: any) => void;
  index: number;
}) {
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
        className={`p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl flex justify-between items-center hover:shadow-md transition-all ${isDragging ? 'cursor-grabbing shadow-xl z-50' : 'cursor-grab'
          }`}
      >
        <div
          className="flex items-center gap-3 flex-1"
          {...attributes}
          {...listeners}
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xl text-foreground">{ticket.tokenNumber}</span>
              <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-medium">
                #{ticket.positionInQueue}
              </span>
            </div>
            {ticket.category && (
              <span className="text-sm text-muted-foreground mt-1 block">
                {ticket.category.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onComplete(ticket.id);
            }}
            className="bg-chart-2 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onHold(ticket.id);
            }}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm hover:bg-destructive/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Hold
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(ticket.id);
            }}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm hover:bg-destructive/90 transition-colors shadow-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onReassign(ticket);
            }}
            className="bg-chart-1 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Reassign
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
