'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
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
  Search
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useConfirm } from '@/components/ConfirmDialog';

export default function AllQueues() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [agents, setAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });

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
      loadAgentQueue(selectedAgentId);
    } else {
      setQueue([]);
    }
  }, [selectedAgentId]);

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
      alert('Failed to load queue');
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
      alert(error.response?.data?.message || 'Failed to reorder queue');
    }
  };

  const handleAdminCallNext = async (agentId: string) => {
    try {
      await adminApi.adminCallNext(agentId);
      loadAgentQueue(agentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to call next');
    }
  };

  const handleAdminComplete = async (ticketId: string) => {
    const confirmed = await confirm('Mark this ticket as completed?');
    if (!confirmed) return;
    try {
      await adminApi.adminMarkAsCompleted(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete ticket');
    }
  };

  const handleAdminHold = async (ticketId: string) => {
    const confirmed = await confirm('Put this ticket on hold?');
    if (!confirmed) return;
    try {
      await adminApi.adminMarkAsNoShow(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to put ticket on hold');
    }
  };


  const handleDeleteTicket = async (ticketId: string) => {
    const confirmed = await confirm('Are you sure you want to delete this ticket? This action cannot be undone.');
    if (!confirmed) return;
    try {
      await adminApi.deleteTicket(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    const confirmed = await confirm('Reopen this ticket? It will be added back to the queue.');
    if (!confirmed) return;
    try {
      await adminApi.adminReopenTicket(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reopen ticket');
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
      alert(error.response?.data?.message || 'Failed to update ticket');
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
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-chart-1/10 rounded-lg">
              <List className="w-6 h-6 text-chart-1" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Queue Management</h1>
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
            Select Agent or Category
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Filter by Agent
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
                      placeholder="Search agents..."
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
                      No agents found
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
                  placeholder="Select an agent..."
                  options={[
                    { value: '', label: 'Select an agent...' },
                    ...agents.map((agent) => ({
                      value: agent.id,
                      label: `${agent.firstName} ${agent.lastName}`,
                    })),
                  ]}
                />
              )}
              {agentSearchQuery.trim() && !selectedAgentId && (
                <div className="text-sm text-muted-foreground mt-2">
                  {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found. Click on one to select.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Filter by Category
              </label>
              <Select
                value={selectedCategoryId}
                onChange={(value) => {
                  setSelectedCategoryId(value);
                  setSelectedAgentId('');
                  setAgentSearchQuery('');
                }}
                disabled={!!selectedAgentId}
                placeholder="Select a category..."
                options={[
                  { value: '', label: 'Select a category...' },
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
                Queue for {agents.find((a) => a.id === selectedAgentId)?.firstName}{' '}
                {agents.find((a) => a.id === selectedAgentId)?.lastName}
              </h2>
              {pendingTickets.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAdminCallNext(selectedAgentId)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
                >
                  <Phone className="w-5 h-5" />
                  Call Next
                </motion.button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No tickets in queue
              </div>
            ) : (
              <>
                {/* Hold Tickets */}
                {holdTickets.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                      <X className="w-5 h-5 text-destructive" />
                      Hold ({holdTickets.length})
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
                                  hold
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
                              Reopen
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEditTicket(ticket)}
                              className="bg-chart-4 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
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
                      Active Tickets ({otherTickets.length})
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
                                Reopen
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
                                  Complete
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleAdminHold(ticket.id)}
                                  className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm hover:bg-destructive/90 transition-colors shadow-sm flex items-center gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  Hold
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
                              Edit
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm hover:bg-destructive/90 transition-colors shadow-sm flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
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
                    Pending Tickets ({pendingTickets.length})
                  </h3>
                  {pendingTickets.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No pending tickets</p>
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
              Queues for Category: {categories.find((c) => c.id === selectedCategoryId)?.name}
            </h2>
            <p className="text-muted-foreground mb-6">
              Select an agent from the list above to manage their queue
            </p>
            {/* Search Input for Category Agents */}
            <div className="mb-4">
              <div className="flex items-center gap-0 bg-card/80 dark:bg-card border border-border rounded-xl px-2 py-1 max-w-md">
                <span className="pl-2 pr-1 text-xl text-primary/80">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={agentSearchQuery}
                  onChange={(e) => setAgentSearchQuery(e.target.value)}
                  className="flex h-9 w-full min-w-0 py-1 outline-none border-0 bg-transparent rounded-lg focus:ring-0 focus-visible:ring-0 shadow-none text-base px-2 text-foreground placeholder:text-muted-foreground transition-[color,box-shadow]"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {agents
                .filter((agent) => {
                  const matchesCategory = agent.agentCategories?.some(
                    (ac: any) => ac.categoryId === selectedCategoryId && ac.isActive
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
                          Click to manage queue
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
                    Edit Ticket: {editingTicket.tokenNumber}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.customerName}
                        onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Customer Phone
                      </label>
                      <input
                        type="tel"
                        value={editFormData.customerPhone}
                        onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Customer Email
                      </label>
                      <input
                        type="email"
                        value={editFormData.customerEmail}
                        onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        placeholder="Enter email address"
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
  index 
}: { 
  ticket: any; 
  onComplete: (id: string) => void; 
  onHold: (id: string) => void;
  onDelete: (id: string) => void;
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
        </div>
      </div>
    </motion.div>
  );
}
