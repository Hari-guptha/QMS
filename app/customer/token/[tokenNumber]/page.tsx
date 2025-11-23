'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function TokenPage() {
  const params = useParams();
  const router = useRouter();
  const tokenNumber = params.tokenNumber as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .getTicketByToken(tokenNumber)
      .then((res) => {
        setTicket(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    const socket = getSocket();
    socket.emit('join-public-room');
    socket.on('ticket:called', (data: any) => {
      if (data.tokenNumber === tokenNumber) {
        setTicket((prev: any) => ({ ...prev, status: 'called' }));
      }
    });

    return () => {
      socket.off('ticket:called');
    };
  }, [tokenNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">Ticket not found</div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    called: 'bg-blue-100 text-blue-800',
    serving: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎫</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {ticket.tokenNumber}
        </h1>
        <p className="text-gray-600 mb-6">Your Token Number</p>

        <div className="space-y-4 mb-6">
          <div>
            <span className="text-sm text-gray-500">Category</span>
            <p className="font-semibold">{ticket.category?.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Status</span>
            <p
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                statusColors[ticket.status] || 'bg-gray-100'
              }`}
            >
              {ticket.status.toUpperCase()}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Position in Queue</span>
            <p className="font-semibold text-2xl">{ticket.positionInQueue}</p>
          </div>
          {ticket.agent && (
            <div>
              <span className="text-sm text-gray-500">Assigned Agent</span>
              <p className="font-semibold">
                {ticket.agent.firstName} {ticket.agent.lastName}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => router.push('/status')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            View Status Page
          </button>
          <button
            onClick={() => router.push('/customer/check-in')}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
          >
            Check In Again
          </button>
        </div>
      </div>
    </div>
  );
}

