'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';

export default function TokenPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const tokenNumber = params.tokenNumber as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);

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

  // Auto-redirect after 10 seconds
  useEffect(() => {
    if (!loading && ticket) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push('/customer/check-in');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [loading, ticket, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-destructive">{t('error.ticketNotFound')}</div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-chart-4/20 text-chart-4 border border-chart-4/30',
    called: 'bg-primary/20 text-primary border border-primary/30',
    serving: 'bg-chart-2/20 text-chart-2 border border-chart-2/30',
    completed: 'bg-muted text-muted-foreground border border-border',
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Theme Toggle and Language Selector Header */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      
      <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🎫</div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {ticket.tokenNumber}
        </h1>
        <p className="text-muted-foreground mb-6">{t('customer.tokenNumber')}</p>

        <div className="space-y-4 mb-6">
          <div>
            <span className="text-sm text-muted-foreground">{t('customer.category')}</span>
            <p className="font-semibold text-foreground">{ticket.category?.name}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('customer.status')}</span>
            <p
              className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                statusColors[ticket.status] || 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {ticket.status === 'pending' ? t('status.pending') : 
               ticket.status === 'called' ? t('status.called') :
               ticket.status === 'serving' ? t('status.serving') :
               ticket.status === 'completed' ? t('status.completed') :
               ticket.status.toUpperCase()}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('customer.positionInQueue')}</span>
            <p className="font-semibold text-2xl text-foreground">{ticket.positionInQueue}</p>
          </div>
          {ticket.agent && (
            <div>
              <span className="text-sm text-muted-foreground">{t('customer.assignedAgent')}</span>
              <p className="font-semibold text-foreground">
                {ticket.agent.firstName} {ticket.agent.lastName}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">
            {t('customer.redirectingIn')} {countdown} {t('customer.seconds')}...
          </p>
          <button
            onClick={() => router.push('/customer/check-in')}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors shadow-xs"
          >
            {t('customer.checkInAgain')}
          </button>
        </div>
      </div>
    </div>
  );
}
