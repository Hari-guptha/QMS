'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agentApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
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

export default function AgentDashboard() {
  const router = useRouter();
  const [queue, setQueue] = useState<any[]>([]);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

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

    // Load initial queue
    loadQueue();

    // Setup socket connection
    const socket = getSocket();
    
    // Update connection status
    setSocketConnected(socket.connected);
    
    // Join agent room when connected
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

    // Listen for queue updates
    const handleQueueUpdate = (data?: any) => {
      console.log('Queue updated event received:', data);
      loadQueue();
    };

    // Listen for new ticket created
    const handleTicketCreated = (ticket: any) => {
      console.log('New ticket created:', ticket);
      // Only reload if this ticket is assigned to current agent
      if (ticket.agentId === user.id) {
        loadQueue();
      }
    };

    // Listen for ticket status changes
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

    // Cleanup on unmount
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
      const serving = response.data.find((t: any) => t.status === 'serving');
      if (serving) setCurrentTicket(serving);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    try {
      const response = await agentApi.callNext();
      setCurrentTicket(response.data);
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to call next');
    }
  };

  const handleMarkServing = async (ticketId: string) => {
    try {
      await agentApi.markAsServing(ticketId);
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleComplete = async (ticketId: string) => {
    try {
      await agentApi.markAsCompleted(ticketId);
      setCurrentTicket(null);
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to complete');
    }
  };

  const handleNoShow = async (ticketId: string) => {
    try {
      await agentApi.markAsNoShow(ticketId);
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleReopen = async (ticketId: string) => {
    if (!confirm('Reopen this ticket? It will be added back to the queue.')) return;
    try {
      await agentApi.reopenTicket(ticketId);
      loadQueue();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reopen ticket');
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

    // Optimistically update UI
    const newOrder = arrayMove(currentPendingTickets, oldIndex, newIndex);
    const newQueue = [
      ...queue.filter((t: any) => t.status !== 'pending'),
      ...newOrder,
    ];
    setQueue(newQueue);

    // Update backend
    try {
      const ticketIds = newOrder.map((t: any) => t.id);
      await agentApi.reorderQueue(ticketIds);
      // Reload to ensure consistency
      loadQueue();
    } catch (error: any) {
      // Revert on error
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
    );
  }

  const pendingTickets = queue.filter((t: any) => t.status === 'pending');
  const calledTickets = queue.filter((t: any) => t.status === 'called');
  const completedTickets = queue.filter((t: any) => t.status === 'completed' || t.status === 'no_show');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Agent Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-destructive'}`}></div>
            <span className="text-sm text-muted-foreground">
              {socketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">My Queue</h2>

            {currentTicket && (
              <div className="mb-6 p-4 bg-chart-2/20 border-2 border-chart-2 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-foreground">Currently Serving</h3>
                <p className="text-2xl font-mono font-bold text-foreground">
                  {currentTicket.tokenNumber}
                </p>
                {currentTicket.customerName && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Customer: {currentTicket.customerName}
                  </p>
                )}
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => handleComplete(currentTicket.id)}
                    className="bg-chart-2 text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity shadow-xs"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleNoShow(currentTicket.id)}
                    className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors shadow-xs"
                  >
                    No Show
                  </button>
                </div>
              </div>
            )}

            {calledTickets.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-foreground">Called</h3>
                {calledTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="p-3 bg-primary/10 border border-primary/20 rounded-md mb-2 flex justify-between items-center"
                  >
                    <span className="font-mono font-bold text-foreground">{ticket.tokenNumber}</span>
                    <button
                      onClick={() => handleMarkServing(ticket.id)}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      Mark Serving
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2 text-foreground">Pending ({pendingTickets.length})</h3>
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
                        <SortableTicketItem key={ticket.id} ticket={ticket} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <button
              onClick={handleCallNext}
              disabled={pendingTickets.length === 0}
              className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-md font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              Call Next
            </button>

            {completedTickets.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2 text-foreground">
                  Completed/No-Show ({completedTickets.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {completedTickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="p-3 bg-muted border rounded-md flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono font-bold text-foreground">
                          {ticket.tokenNumber}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {ticket.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleReopen(ticket.id)}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs hover:bg-primary/90 transition-colors shadow-xs"
                      >
                        Reopen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Queue Statistics</h2>
            <div className="space-y-4">
              <div>
                <span className="text-muted-foreground">Total in Queue:</span>
                <span className="ml-2 font-bold text-xl text-foreground">{queue.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Pending:</span>
                <span className="ml-2 font-bold text-xl text-foreground">{pendingTickets.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Called:</span>
                <span className="ml-2 font-bold text-xl text-foreground">{calledTickets.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Serving:</span>
                <span className="ml-2 font-bold text-xl text-foreground">
                  {currentTicket ? 1 : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sortable Ticket Item Component
function SortableTicketItem({ ticket }: { ticket: any }) {
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
      className="p-3 bg-muted border rounded-md flex justify-between items-center cursor-move hover:bg-accent transition-colors"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">⋮⋮</span>
        <div>
          <span className="font-mono font-bold text-foreground">{ticket.tokenNumber}</span>
          <span className="ml-2 text-sm text-muted-foreground">
            #{ticket.positionInQueue}
          </span>
        </div>
      </div>
    </div>
  );
}

