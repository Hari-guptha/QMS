'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <Link href="/admin/dashboard" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Queue Management</h1>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Agent or Category</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Agent
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value);
                  setSelectedCategoryId('');
                }}
                disabled={!!selectedCategoryId}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedAgentId('');
                }}
                disabled={!!selectedAgentId}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Queue for{' '}
              {agents.find((a) => a.id === selectedAgentId)?.firstName}{' '}
              {agents.find((a) => a.id === selectedAgentId)?.lastName}
            </h2>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : queue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No tickets in queue
              </div>
            ) : (
              <>
                {otherTickets.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2 text-gray-600 dark:text-gray-400">
                      Active Tickets (Non-Pending)
                    </h3>
                    <div className="space-y-2">
                      {otherTickets.map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="p-3 bg-gray-100 dark:bg-gray-700 rounded flex justify-between items-center"
                        >
                          <div>
                            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                              {ticket.tokenNumber}
                            </span>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              Status: {ticket.status}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {ticket.status === 'called' && (
                              <button
                                onClick={() => handleAdminMarkServing(ticket.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                              >
                                Mark Serving
                              </button>
                            )}
                            {(ticket.status === 'completed' || ticket.status === 'no_show') && (
                              <button
                                onClick={() => handleReopenTicket(ticket.id)}
                                className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700"
                              >
                                Reopen
                              </button>
                            )}
                            {ticket.status !== 'completed' && ticket.status !== 'no_show' && (
                              <button
                                onClick={() => handleAdminComplete(ticket.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                              >
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleEditTicket(ticket)}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
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
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      Pending Tickets ({pendingTickets.length})
                    </h3>
                    {pendingTickets.length > 0 && (
                      <button
                        onClick={() => handleAdminCallNext(selectedAgentId)}
                        className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Call Next
                      </button>
                    )}
                  </div>
                  {pendingTickets.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No pending tickets</p>
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
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Queues for Category: {categories.find((c) => c.id === selectedCategoryId)?.name}
            </h2>
            <p className="text-gray-600 mb-4">
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
                    className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-left transition-colors"
                  >
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {agent.firstName} {agent.lastName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Click to manage queue
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Edit Ticket Modal */}
        {editingTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Edit Ticket: {editingTicket.tokenNumber}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    value={editFormData.customerPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.customerEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTicket(null)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
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
      className="p-3 bg-gray-100 rounded flex justify-between items-center hover:bg-gray-200"
    >
      <div className="flex items-center gap-2 flex-1 cursor-move" {...attributes} {...listeners}>
        <span className="text-gray-400">⋮⋮</span>
        <div>
          <span className="font-mono font-bold">{ticket.tokenNumber}</span>
          <span className="ml-2 text-sm text-gray-600">
            #{ticket.positionInQueue}
          </span>
          {ticket.category && (
            <span className="ml-2 text-xs text-gray-500">
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
          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
        >
          Complete
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ticket.id);
          }}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
