'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { agentApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon,
  ArrowLeft,
  Calendar as CalendarIcon,
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  List,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  Mail,
  Phone,
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

type ViewMode = 'day' | 'week' | 'month';

export default function AgentHistory() {
  const router = useRouter();
  const { t } = useI18n();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState<'calendar' | 'list'>('list');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredTicket, setHoveredTicket] = useState<any | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<any | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 30); // Default to last 30 days
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'agent') {
      router.push('/agent/login');
      return;
    }
    if (viewType === 'calendar') {
      loadCalendarHistory();
    } else {
      loadHistory();
    }
  }, [router, startDate, endDate, viewType, currentDate, viewMode]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const user = auth.getUser();
      if (!user) return;

      const response = await agentApi.getAgentHistory(user.id, startDate, endDate);
      setTickets(response.data || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarHistory = async () => {
    setLoading(true);
    try {
      const user = auth.getUser();
      if (!user) return;

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
        user.id,
        format(start, 'yyyy-MM-dd'),
        format(end, 'yyyy-MM-dd')
      );
      setTickets(response.data || []);
    } catch (error) {
      console.error('Failed to load calendar history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const query = searchQuery.toLowerCase();
    return (
      ticket.tokenNumber?.toLowerCase().includes(query) ||
      ticket.customerName?.toLowerCase().includes(query) ||
      ticket.customerPhone?.toLowerCase().includes(query) ||
      ticket.customerEmail?.toLowerCase().includes(query) ||
      ticket.category?.name?.toLowerCase().includes(query) ||
      ticket.status?.toLowerCase().includes(query)
    );
  });

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
    return tickets.filter((ticket) => isSameDay(parseISO(ticket.createdAt), date));
  };

  const getTicketsForHour = (date: Date, hour: number) => {
    return tickets.filter((ticket) => {
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
                      {t('common.today')}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayTickets.slice(0, maxVisible).map(ticket => (
                    <span
                      key={ticket.id}
                      className="inline-flex items-center justify-center rounded-full border font-medium w-fit whitespace-nowrap shrink-0 text-[10px] px-1.5 py-0.5 text-foreground hover:bg-accent hover:text-accent-foreground transition cursor-pointer"
                      onMouseEnter={(e) => {
                        setHoveredTicket(ticket);
                        setHoverPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setHoveredTicket(null)}
                      onClick={() => setSelectedTicketDetails(ticket)}
                    >
                      {ticket.tokenNumber || formatTime(ticket.createdAt)}
                    </span>
                  ))}
                  {dayTickets.length > maxVisible && (
                    <div className="text-[11px] text-primary cursor-pointer">
                      +{dayTickets.length - maxVisible} {t('common.moreTickets')}
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
                    className="border-r border-b relative h-16 overflow-y-auto"
                  >
                    {hourTickets.length > 0 && (
                      <div className="absolute top-1 left-1 right-1 space-y-0.5">
                        {hourTickets.map((ticket) => (
                          <span
                            key={ticket.id}
                            className="inline-flex items-center justify-center rounded-full border font-medium w-fit whitespace-nowrap shrink-0 text-[10px] px-1.5 py-0.5 text-foreground hover:bg-accent hover:text-accent-foreground transition bg-primary/10 cursor-pointer"
                            onMouseEnter={(e) => {
                              setHoveredTicket(ticket);
                              setHoverPosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => setHoveredTicket(null)}
                            onClick={() => setSelectedTicketDetails(ticket)}
                          >
                            {ticket.tokenNumber || formatTime(ticket.createdAt)}
                          </span>
                        ))}
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
                  className="border-b h-16 relative overflow-y-auto"
                >
                  {hourTickets.length > 0 && (
                    <div className="absolute top-1 left-1 right-1 space-y-0.5">
                      {hourTickets.map((ticket) => (
                        <span
                          key={ticket.id}
                          className="inline-flex items-center justify-center rounded-full border font-medium w-fit whitespace-nowrap shrink-0 text-[10px] px-1.5 py-0.5 text-foreground hover:bg-accent hover:text-accent-foreground transition bg-primary/10 cursor-pointer"
                          onMouseEnter={(e) => {
                            setHoveredTicket(ticket);
                            setHoverPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredTicket(null)}
                          onClick={() => setSelectedTicketDetails(ticket)}
                        >
                          {ticket.tokenNumber || formatTime(ticket.createdAt)}
                        </span>
                      ))}
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
            <div className="text-lg text-muted-foreground">Loading history...</div>
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
          className="mb-8"
        >
          <Link
            href="/agent/dashboard"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.users.backToDashboard')}
          </Link>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HistoryIcon className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">{t('common.history')}</h1>
            </div>
          </div>

          {/* Filters and View Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-card border rounded-xl">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {viewType === 'list' && (
                <>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <label className="text-sm font-medium text-foreground">Start Date:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">End Date:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </>
              )}
              <div className="flex-1 flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-2 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                />
                {(searchQuery || (viewType === 'list' && (startDate !== new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0] || endDate !== new Date().toISOString().split('T')[0]))) && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSearchQuery('');
                      if (viewType === 'list') {
                        const today = new Date();
                        today.setDate(today.getDate() - 30);
                        setStartDate(today.toISOString().split('T')[0]);
                        setEndDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={t('common.clearFilter') || 'Clear filter'}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
            {/* Calendar/List Toggle */}
            <div
              role="tablist"
              className="text-muted-foreground h-9 w-fit items-center justify-center p-[3px] flex gap-2 rounded-full bg-card border border-border"
            >
              <button
                type="button"
                onClick={() => setViewType('calendar')}
                className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 border border-transparent text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 p-2 rounded-full border-none cursor-pointer ${
                  viewType === 'calendar'
                    ? 'bg-accent/20 text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewType('list')}
                className={`inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 border border-transparent text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 p-2 rounded-full border-none cursor-pointer ${
                  viewType === 'list'
                    ? 'bg-accent/20 text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {viewType === 'calendar' ? (
          <>
            {/* Calendar View Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-semibold">{t('common.customerHistory')}</h2>
                  <p className="text-sm text-muted-foreground">{t('common.calendarView')}</p>
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
                    {t('common.day')}
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'week'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t('common.week')}
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      viewMode === 'month'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t('common.month')}
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
            </motion.div>

            {/* Calendar View */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card text-card-foreground border rounded-2xl shadow-lg overflow-hidden p-6"
            >
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
            </motion.div>

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
          /* Tickets Table */
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card text-card-foreground border rounded-2xl shadow-lg overflow-hidden"
          >
          <div className="p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Ticket className="w-6 h-6 text-primary" />
              History ({filteredTickets.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No tickets found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket, index) => (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-foreground">{ticket.tokenNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-foreground">
                        {ticket.customerName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-foreground">
                        {ticket.category?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTicketDetails(ticket)}
                          className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm hover:bg-secondary/80 transition-colors shadow-sm flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          {t('common.viewDetails')}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
        )}
      </div>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicketDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTicketDetails(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card text-card-foreground border border-border/50 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-xl">
                      <Ticket className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedTicketDetails.tokenNumber}</h2>
                      {selectedTicketDetails.category && (
                        <p className="text-sm text-muted-foreground mt-0.5">{selectedTicketDetails.category.name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicketDetails(null)}
                    className="p-2 hover:bg-muted/80 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                  {/* Status & Position */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Status:</span>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                        selectedTicketDetails.status === 'completed'
                          ? 'bg-chart-2/20 text-chart-2 border border-chart-2/30'
                          : selectedTicketDetails.status === 'hold' || selectedTicketDetails.status === 'no_show'
                          ? 'bg-destructive/20 text-destructive border border-destructive/30'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {selectedTicketDetails.status}
                      </span>
                    </div>
                    {selectedTicketDetails.positionInQueue > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Position:</span>
                        <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20">
                          #{selectedTicketDetails.positionInQueue}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Customer Information Card */}
                  {(selectedTicketDetails.customerName || selectedTicketDetails.customerPhone || selectedTicketDetails.customerEmail) && (
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 border border-border rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Customer Information
                      </h3>
                      <div className="space-y-3">
                        {selectedTicketDetails.customerName && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg">
                              <Users className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-foreground font-medium">{selectedTicketDetails.customerName}</span>
                          </div>
                        )}
                        {selectedTicketDetails.customerPhone && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg">
                              <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <a href={`tel:${selectedTicketDetails.customerPhone}`} className="text-foreground hover:text-primary transition-colors">
                              {selectedTicketDetails.customerPhone}
                            </a>
                          </div>
                        )}
                        {selectedTicketDetails.customerEmail && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg">
                              <Mail className="w-4 h-4 text-primary" />
                            </div>
                            <a href={`mailto:${selectedTicketDetails.customerEmail}`} className="text-foreground hover:text-primary transition-colors break-all">
                              {selectedTicketDetails.customerEmail}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline Card */}
                  {(selectedTicketDetails.createdAt || selectedTicketDetails.completedAt || selectedTicketDetails.noShowAt) && (
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 border border-border rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timeline
                      </h3>
                      <div className="space-y-3">
                        {selectedTicketDetails.createdAt && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg">
                              <Clock className="w-4 h-4 text-chart-1" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Created At</p>
                              <p className="text-foreground font-medium">{format(parseISO(selectedTicketDetails.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                          </div>
                        )}
                        {selectedTicketDetails.completedAt && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-chart-2" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Completed At</p>
                              <p className="text-foreground font-medium">{format(parseISO(selectedTicketDetails.completedAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                          </div>
                        )}
                        {selectedTicketDetails.noShowAt && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg">
                              <X className="w-4 h-4 text-destructive" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Hold/No Show At</p>
                              <p className="text-foreground font-medium">{format(parseISO(selectedTicketDetails.noShowAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Note Card */}
                  {selectedTicketDetails.note && (
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Note
                      </h3>
                      <p className="text-foreground leading-relaxed">{selectedTicketDetails.note}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

