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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Clock,
  Users,
  Mail,
  Phone,
  Loader2,
  Search,
  List,
  Eye,
  X,
  CheckCircle2,
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
  getWeek,
  getYear,
  getMonth,
} from 'date-fns';
import { Select } from '@/components/ui/Select';

type ViewMode = 'day' | 'week' | 'month';

export default function AgentCalendar() {
  const router = useRouter();
  const { t } = useI18n();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [hoveredTicket, setHoveredTicket] = useState<any | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketDetails, setSelectedTicketDetails] = useState<any | null>(null);
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return format(today, 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return format(today, 'yyyy-MM-dd');
  });

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'agent') {
      router.push('/agent/login');
      return;
    }
    if (viewType === 'calendar') {
      loadTickets();
    } else {
      loadListTickets();
    }
  }, [router, currentDate, viewMode, viewType, startDate, endDate]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const user = auth.getUser();
      if (!user) return;

      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'day') {
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
      } else if (viewMode === 'week') {
        startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
        endDate = addDays(startDate, 6);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = startOfMonth(currentDate);
        endDate = addMonths(startDate, 1);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
      }

      const response = await agentApi.getAgentHistory(
        user.id,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      setTickets(response.data || []);
    } catch (error) {
      console.error('Failed to load agent calendar tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadListTickets = async () => {
    setLoading(true);
    try {
      const user = auth.getUser();
      if (!user) return;

      const response = await agentApi.getAgentHistory(
        user.id,
        startDate,
        endDate
      );
      setTickets(response.data || []);
    } catch (error) {
      console.error('Failed to load list tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true;
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 5 + i);

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
            <div className="text-lg text-muted-foreground">{t('common.loadingCalendar')}</div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 w-full">
          {/* Top Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center mt-2 lg:mt-5 justify-end w-full gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto ml-auto">
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

              {/* Search */}
              <div className="relative w-full sm:w-[180px] lg:w-[250px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('agent.calendar.searchTickets')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 w-full min-w-0 border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-10 pl-10 pr-10 rounded-full bg-background border-border"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={t('common.clearFilter') || 'Clear filter'}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {viewType === 'calendar' && (
            <>
              {/* Calendar Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-6 w-6" />
                  <div>
                    <h2 className="text-xl font-semibold">{t('common.customerHistory')}</h2>
                    <p className="text-sm text-muted-foreground">{t('common.calendarView')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Today Button */}
                  <button
                    onClick={handleToday}
                    className="inline-flex items-center justify-center text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-8 rounded-md gap-1.5 px-3 whitespace-nowrap border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
                  >
                    Today
                  </button>

                  {/* Navigation Arrows */}
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={handlePrev}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 rounded-full hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 size-9 rounded-full hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Month/Year Selectors */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={months[getMonth(currentDate)]}
                      onChange={(value) => {
                        const monthIndex = months.indexOf(value);
                        setCurrentDate(new Date(getYear(currentDate), monthIndex, 1));
                      }}
                      options={months.map(month => ({ value: month, label: month }))}
                      className="w-[130px]"
                    />
                    <Select
                      value={getYear(currentDate).toString()}
                      onChange={(value) => {
                        setCurrentDate(new Date(parseInt(value), getMonth(currentDate), 1));
                      }}
                      options={years.map(year => ({ value: year.toString(), label: year.toString() }))}
                      className="w-[100px]"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1">
                    {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 h-8 gap-1.5 px-3 text-xs font-medium capitalize rounded-full ${
                          viewMode === mode
                            ? 'bg-background shadow-sm border border-border'
                            : 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar Content */}
              <div className="flex-1">
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'day' && renderDayView()}
              </div>
            </>
          )}

          {viewType === 'list' && (
            <>
              {/* List View Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-2">
                  <List className="h-6 w-6" />
                  <div>
                    <h2 className="text-xl font-semibold">{t('agent.calendar.ticketHistory')}</h2>
                    <p className="text-sm text-muted-foreground">{t('agent.calendar.listViewDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-card border rounded-xl mb-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-foreground">{t('agent.calendar.startDate')}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-foreground">{t('agent.calendar.endDate')}</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-2 min-w-[200px]">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('agent.calendar.searchTicketsSimple')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 outline-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              {/* Tickets Table */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card text-card-foreground border rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6 border-b border-border">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Ticket className="w-6 h-6 text-primary" />
                    {t('agent.calendar.history')} ({filteredTickets.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('agent.calendar.token')}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('agent.calendar.customerName')}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('agent.calendar.service')}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {t('agent.calendar.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedTickets.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                            {searchQuery ? t('agent.calendar.noTicketsFound') : t('agent.calendar.noTicketsAvailable')}
                          </td>
                        </tr>
                      ) : (
                        paginatedTickets.map((ticket, index) => (
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
                              {ticket.customerName || t('common.value')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-foreground">
                              {ticket.category?.name || t('common.value')}
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

              {/* Pagination - Separate Section */}
              {filteredTickets.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-6 bg-card text-card-foreground border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-colors ${
                          currentPage === 1
                            ? 'text-muted-foreground cursor-not-allowed opacity-50'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4 shrink-0" />
                        <span>{t('agent.calendar.previous')}</span>
                      </button>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('agent.calendar.page')} {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-colors ${
                          currentPage === totalPages
                            ? 'text-muted-foreground cursor-not-allowed opacity-50'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <span>{t('agent.calendar.next')}</span>
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{t('agent.calendar.itemsPerPage')}</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary pr-8"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Ticket Detail Popup */}
        <AnimatePresence>
          {hoveredTicket && hoverPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bg-card text-card-foreground border border-border rounded-lg shadow-xl p-4 z-50 max-w-xs"
              style={{ left: hoverPosition.x + 15, top: hoverPosition.y + 15 }}
            >
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                {hoveredTicket.tokenNumber}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                <span className="font-semibold">{t('agent.calendar.category')}</span> {hoveredTicket.category?.name}
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                <span className="font-semibold">{t('agent.calendar.status')}</span> {t(`status.${hoveredTicket.status}` as any) || hoveredTicket.status}
              </p>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(parseISO(hoveredTicket.createdAt), 'PPP p')}
              </p>
              {hoveredTicket.customerName && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {hoveredTicket.customerName}
                </p>
              )}
              {hoveredTicket.customerEmail && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {hoveredTicket.customerEmail}
                </p>
              )}
              {hoveredTicket.customerPhone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {hoveredTicket.customerPhone}
                </p>
              )}
              {hoveredTicket.note && (
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-semibold">{t('common.note')}:</span> {hoveredTicket.note}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
                        <span className="text-sm font-medium text-muted-foreground">{t('agent.calendar.status')}</span>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                          selectedTicketDetails.status === 'completed'
                            ? 'bg-chart-2/20 text-chart-2 border border-chart-2/30'
                            : selectedTicketDetails.status === 'hold' || selectedTicketDetails.status === 'no_show'
                            ? 'bg-destructive/20 text-destructive border border-destructive/30'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {t(`agent.calendar.status.${selectedTicketDetails.status}` as any) || selectedTicketDetails.status}
                        </span>
                      </div>
                      {selectedTicketDetails.positionInQueue > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{t('agent.calendar.position')}</span>
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
                          {t('agent.calendar.customerInformation')}
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
                          {t('agent.calendar.timeline')}
                        </h3>
                        <div className="space-y-3">
                          {selectedTicketDetails.createdAt && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-background rounded-lg">
                                <Clock className="w-4 h-4 text-chart-1" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">{t('admin.analytics.createdAt')}</p>
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
                                <p className="text-xs text-muted-foreground">{t('admin.analytics.completedAt')}</p>
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
                                <p className="text-xs text-muted-foreground">{t('agent.calendar.holdNoShowAt')}</p>
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
    </div>
  );
}
