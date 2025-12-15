import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealtimeGateway } from './realtime.gateway';
import { Ticket } from '../queue/entities/ticket.entity';

@Injectable()
export class RealtimeService {
  constructor(
    private gateway: RealtimeGateway,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

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
    this.gateway.server.to('public').emit('status:updated');
  }

  emitTicketCalled(ticket: Ticket) {
    this.gateway.server.emit('ticket:called', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.gateway.server.to('public').emit('status:updated');
  }

  emitTicketServing(ticket: Ticket) {
    this.gateway.server.emit('ticket:serving', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.gateway.server.to('public').emit('status:updated');
  }

  emitTicketCompleted(ticket: Ticket) {
    this.gateway.server.emit('ticket:completed', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
    this.gateway.server.to('public').emit('status:updated');
  }

  emitTicketNoShow(ticket: Ticket) {
    this.gateway.server.emit('ticket:no-show', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
  }

  emitTicketTransferred(ticket: Ticket) {
    this.gateway.server.emit('ticket:transferred', ticket);
    if (ticket.agentId) {
      this.gateway.server.to(`agent:${ticket.agentId}`).emit('queue:updated', {
        agentId: ticket.agentId,
        ticket,
      });
    }
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
    this.gateway.server.to('public').emit('status:updated');
  }
}

