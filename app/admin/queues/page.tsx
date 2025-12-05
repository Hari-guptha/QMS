'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
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

export default function AllQueues() {
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
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
    const newQueue = [
      ...queue.filter((t: any) => t.status !== 'pending'),
      ...newOrder,
    ];
    setQueue(newQueue);

    // Update backend
    try {
      const ticketIds = newOrder.map((t: any) => t.id);
      await adminApi.reorderAgentQueue(selectedAgentId, ticketIds);
      // Reload to ensure consistency
      loadAgentQueue(selectedAgentId);
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
    if (!confirm('Mark this ticket as completed?')) return;
    try {
      await adminApi.adminMarkAsCompleted(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete ticket');
    }
  };

  const handleAdminMarkServing = async (ticketId: string) => {
    try {
      await adminApi.adminMarkAsServing(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    try {
      await adminApi.deleteTicket(ticketId);
      loadAgentQueue(selectedAgentId);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete ticket');
    }
  };

  const handleReopenTicket = async (ticketId: string) => {
    if (!confirm('Reopen this ticket? It will be added back to the queue.')) return;
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
  const otherTickets = queue.filter((t: any) => t.status !== 'pending');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/admin/dashboard" className="text-primary hover:text-primary/80 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Queue Management</h1>
        </div>
        <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Select Agent or Category</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Filter by Agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value);
                  setSelectedCategoryId('');
                }}
                disabled={!!selectedCategoryId}
                className="w-full px-4 py-2 border border-border rounded-md disabled:bg-muted disabled:cursor-not-allowed bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
              >
                <option value="">Select an agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.firstName} {agent.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedAgentId('');
                }}
                disabled={!!selectedAgentId}
                className="w-full px-4 py-2 border border-border rounded-md disabled:bg-muted disabled:cursor-not-allowed bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
              >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedAgentId && (
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Queue for{' '}
              {agents.find((a) => a.id === selectedAgentId)?.firstName}{' '}
              {agents.find((a) => a.id === selectedAgentId)?.lastName}
            </h2>

            {loading ? (
              <div className="text-center py-8 text-foreground">Loading...</div>
            ) : queue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tickets in queue
              </div>
            ) : (
              <>
                {otherTickets.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2 text-muted-foreground">
                      Active Tickets (Non-Pending)
                    </h3>
                    <div className="space-y-2">
                      {otherTickets.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="p-3 bg-muted border rounded-md flex justify-between items-center"
                        >
                          <div>
                            <span className="font-mono font-bold text-foreground">
                              {ticket.tokenNumber}
                            </span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              Status: {ticket.status}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {ticket.status === 'called' && (
                              <button
                                onClick={() => handleAdminMarkServing(ticket.id)}
                                className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs hover:bg-primary/90 transition-colors shadow-xs"
                              >
                                Mark Serving
                              </button>
                            )}
                            {(ticket.status === 'completed' || ticket.status === 'no_show') && (
                              <button
                                onClick={() => handleReopenTicket(ticket.id)}
                                className="bg-chart-4 text-white px-3 py-1 rounded-md text-xs hover:opacity-90 transition-opacity shadow-xs"
                              >
                                Reopen
                              </button>
                            )}
                            {ticket.status !== 'completed' && ticket.status !== 'no_show' && (
                              <button
                                onClick={() => handleAdminComplete(ticket.id)}
                                className="bg-chart-2 text-white px-3 py-1 rounded-md text-xs hover:opacity-90 transition-opacity shadow-xs"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleEditTicket(ticket)}
                              className="bg-chart-4 text-white px-3 py-1 rounded-md text-xs hover:opacity-90 transition-opacity shadow-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-xs hover:bg-destructive/90 transition-colors shadow-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-foreground">
                      Pending Tickets ({pendingTickets.length})
                    </h3>
                    {pendingTickets.length > 0 && (
                      <button
                        onClick={() => handleAdminCallNext(selectedAgentId)}
                        className="bg-primary text-primary-foreground px-4 py-1 rounded-md text-sm hover:bg-primary/90 transition-colors shadow-xs"
                      >
                        Call Next
                      </button>
                    )}
                  </div>
                  {pendingTickets.length === 0 ? (
                    <p className="text-muted-foreground">No pending tickets</p>
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
                        <div className="space-y-2">
                          {pendingTickets.map((ticket: any) => (
                            <SortableTicketItem 
                              key={ticket.id} 
                              ticket={ticket}
                              onComplete={handleAdminComplete}
                              onDelete={handleDeleteTicket}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {selectedCategoryId && !selectedAgentId && (
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Queues for Category: {categories.find((c) => c.id === selectedCategoryId)?.name}
            </h2>
            <p className="text-muted-foreground mb-4">
              Select an agent from the list above to manage their queue
            </p>
            <div className="space-y-4">
              {agents
                .filter((agent) => {
                  // Filter agents assigned to this category
                  return agent.agentCategories?.some(
                    (ac: any) => ac.categoryId === selectedCategoryId && ac.isActive
                  );
                })
                .map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      setSelectedCategoryId('');
                    }}
                    className="w-full p-4 bg-muted border rounded-lg hover:bg-accent hover:text-accent-foreground text-left transition-colors"
                  >
                    <div className="font-semibold text-foreground">
                      {agent.firstName} {agent.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Click to manage queue
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Edit Ticket Modal */}
        {editingTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card text-card-foreground border rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">
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
                    className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
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
                    className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
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
                    className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTicket(null)}
                    className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}

// Sortable Ticket Item Component
function SortableTicketItem({ ticket, onComplete, onDelete }: { ticket: any; onComplete: (id: string) => void; onDelete: (id: string) => void }) {
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
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 bg-muted border rounded-md flex justify-between items-center hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-2 flex-1 cursor-move" {...attributes} {...listeners}>
        <span className="text-muted-foreground">⋮⋮</span>
        <div>
          <span className="font-mono font-bold text-foreground">{ticket.tokenNumber}</span>
          <span className="ml-2 text-sm text-muted-foreground">
            #{ticket.positionInQueue}
          </span>
          {ticket.category && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({ticket.category.name})
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(ticket.id);
          }}
          className="bg-chart-2 text-white px-3 py-1 rounded-md text-xs hover:opacity-90 transition-opacity shadow-xs"
        >
          Complete
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ticket.id);
          }}
          className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-xs hover:bg-destructive/90 transition-colors shadow-xs"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
