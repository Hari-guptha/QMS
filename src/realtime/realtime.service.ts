import { Injectable } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { Ticket } from '@prisma/client';

@Injectable()
export class RealtimeService {
  constructor(private gateway: RealtimeGateway) { }

  emitTicketCreated(ticket: Ticket) {
    this.gateway.server.emit('ticket:created', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.gateway.server
      .to(`category:${ticket.categoryId}`)
      .emit('queue:updated', { categoryId: ticket.categoryId, ticket });
    this.emitPublicStatusUpdate();
  }

  emitTicketCalled(ticket: Ticket) {
    this.gateway.server.emit('ticket:called', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.emitPublicStatusUpdate();
  }

  emitTicketServing(ticket: Ticket) {
    this.gateway.server.emit('ticket:serving', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.emitPublicStatusUpdate();
  }

  emitTicketCompleted(ticket: Ticket) {
    this.gateway.server.emit('ticket:completed', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.emitPublicStatusUpdate();
  }

  emitTicketHold(ticket: Ticket) {
    this.gateway.server.emit('ticket:hold', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.emitPublicStatusUpdate();
  }

  emitTicketTransferred(ticket: Ticket) {
    this.gateway.server.emit('ticket:transferred', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.emitPublicStatusUpdate();
  }

  emitQueueUpdate(agentId?: string, categoryId?: string) {
    if (agentId) {
      this.gateway.server.to(`agent:${agentId}`).emit('queue:updated', {
        agentId,
      });
    }
    if (categoryId) {
      this.gateway.server.to(`category:${categoryId}`).emit('queue:updated', {
        categoryId,
      });
    }
    this.emitPublicStatusUpdate();
  }

  emitPublicStatusUpdate() {
    this.gateway.server.to('public').emit('status:updated');
  }

  emitAgentStatusUpdate(agentId: string) {
    this.emitPublicStatusUpdate();
    this.gateway.server.to(`agent:${agentId}`).emit('agent:status_changed', { agentId });
  }
}
