'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agentApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

export default function AgentDashboard() {
  const router = useRouter();
  const [queue, setQueue] = useState<any[]>([]);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/agent/login');
      return;
    }

    loadQueue();

    const socket = getSocket();
    const user = auth.getUser();
    if (user) {
      socket.emit('join-agent-room', user.id);
    }
    socket.on('queue:updated', () => {
      loadQueue();
    });

    return () => {
      socket.off('queue:updated');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const pendingTickets = queue.filter((t: any) => t.status === 'pending');
  const calledTickets = queue.filter((t: any) => t.status === 'called');

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <button
            onClick={() => {
              auth.logout();
              router.push('/');
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">My Queue</h2>

            {currentTicket && (
              <div className="mb-6 p-4 bg-green-100 rounded-lg border-2 border-green-500">
                <h3 className="font-bold text-lg mb-2">Currently Serving</h3>
                <p className="text-2xl font-mono font-bold">
                  {currentTicket.tokenNumber}
                </p>
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => handleComplete(currentTicket.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleNoShow(currentTicket.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    No Show
                  </button>
                </div>
              </div>
            )}

            {calledTickets.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Called</h3>
                {calledTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    className="p-3 bg-blue-100 rounded mb-2 flex justify-between items-center"
                  >
                    <span className="font-mono font-bold">{ticket.tokenNumber}</span>
                    <button
                      onClick={() => handleMarkServing(ticket.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Mark Serving
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Pending ({pendingTickets.length})</h3>
              {pendingTickets.length === 0 ? (
                <p className="text-gray-500">No pending tickets</p>
              ) : (
                <div className="space-y-2">
                  {pendingTickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className="p-3 bg-gray-100 rounded flex justify-between items-center"
                    >
                      <div>
                        <span className="font-mono font-bold">{ticket.tokenNumber}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          #{ticket.positionInQueue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleCallNext}
              disabled={pendingTickets.length === 0}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Call Next
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Queue Statistics</h2>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600">Total in Queue:</span>
                <span className="ml-2 font-bold text-xl">{queue.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Pending:</span>
                <span className="ml-2 font-bold text-xl">{pendingTickets.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Called:</span>
                <span className="ml-2 font-bold text-xl">{calledTickets.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Serving:</span>
                <span className="ml-2 font-bold text-xl">
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

