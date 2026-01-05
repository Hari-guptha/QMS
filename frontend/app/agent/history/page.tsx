'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { agentApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  History as HistoryIcon,
  ArrowLeft,
  Calendar,
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';

export default function AgentHistory() {
  const router = useRouter();
  const { t } = useI18n();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
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
    loadHistory();
  }, [router, startDate, endDate]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      // For now, get all tickets and filter by date on frontend
      // Backend API endpoint would be: agentApi.getMyHistory(startDate, endDate)
      const response = await agentApi.getMyQueue();
      const allTickets = response.data || [];
      
      // Filter completed/no-show tickets within date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const filtered = allTickets.filter((ticket: any) => {
        const ticketDate = new Date(ticket.completedAt || ticket.noShowAt || ticket.createdAt);
        return (ticket.status === 'completed' || ticket.status === 'no_show') &&
               ticketDate >= start && ticketDate <= end;
      });
      
      setTickets(filtered);
    } catch (error) {
      console.error('Failed to load history:', error);
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
      ticket.category?.name?.toLowerCase().includes(query)
    );
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
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HistoryIcon className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Ticket History</h1>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-card border rounded-xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
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
            <div className="flex-1 flex items-center gap-2 bg-card/80 border border-border rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </motion.div>

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
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Completed At
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
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
                        {ticket.category?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-foreground text-sm">
                          {ticket.customerName || 'N/A'}
                          {ticket.customerPhone && (
                            <div className="text-xs text-muted-foreground">{ticket.customerPhone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            ticket.status === 'completed'
                              ? 'bg-chart-2/20 text-chart-2 border border-chart-2/30'
                              : 'bg-destructive/20 text-destructive border border-destructive/30'
                          }`}
                        >
                          {ticket.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                          {ticket.status === 'completed' ? 'Completed' : 'No Show'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-foreground text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {ticket.completedAt || ticket.noShowAt
                            ? new Date(ticket.completedAt || ticket.noShowAt).toLocaleString()
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-foreground text-sm max-w-xs">
                          {ticket.note ? (
                            <span className="bg-muted/50 p-2 rounded-lg block">{ticket.note}</span>
                          ) : (
                            <span className="text-muted-foreground italic">No note</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

