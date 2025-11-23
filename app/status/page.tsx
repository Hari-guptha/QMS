'use client';

import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';

export default function StatusPage() {
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();

    const socket = getSocket();
    socket.emit('join-public-room');
    socket.on('status:updated', () => {
      loadStatus();
    });

    return () => {
      socket.off('status:updated');
    };
  }, []);

  const loadStatus = async () => {
    try {
      const response = await publicApi.getStatus();
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Queue Status
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(status).map(([categoryName, agents]: [string, any]) => (
            <div key={categoryName} className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">{categoryName}</h2>
              {Object.entries(agents).map(([agentName, tickets]: [string, any]) => (
                <div key={agentName} className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">{agentName}</h3>
                  <div className="space-y-1">
                    {Array.isArray(tickets) && tickets.map((ticket: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded ${
                          ticket.status === 'called'
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : ticket.status === 'serving'
                            ? 'bg-green-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        <span className="font-mono font-bold">{ticket.tokenNumber}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          #{ticket.positionInQueue} - {ticket.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {Object.keys(status).length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No active queues at the moment
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

