import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { Category } from '../categories/entities/category.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UsersService } from '../users/users.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private realtimeService: RealtimeService,
    private notificationService: NotificationService,
    private dataSource: DataSource,
  ) {}

  /**
   * Core Logic: Create ticket and route to least busy agent
   */
  async createTicket(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const category = await queryRunner.manager.findOne(Category, {
        where: { id: createTicketDto.categoryId, isActive: true },
      });

      if (!category) {
        throw new NotFoundException('Category not found or inactive');
      }

      // Get all active agents for this category
      const agents = await this.usersService.getAgentsByCategory(
        createTicketDto.categoryId,
      );

      if (agents.length === 0) {
        throw new BadRequestException(
          'No active agents available for this category',
        );
      }

      // Find the least busy agent
      const agent = await this.findLeastBusyAgent(
        agents.map((a) => a.id),
        createTicketDto.categoryId,
      );

      // Generate token number with transaction to avoid race conditions
      const tokenNumber = await this.generateTokenNumberWithLock(
        category,
        queryRunner,
      );

      // Get position in queue for this agent
      const positionInQueue = await this.getNextPositionInQueue(agent.id);

      // Create ticket
      const ticket = queryRunner.manager.create(Ticket, {
        ...createTicketDto,
        categoryId: createTicketDto.categoryId,
        agentId: agent.id,
        tokenNumber,
        positionInQueue,
        status: TicketStatus.PENDING,
      });

      const savedTicket = await queryRunner.manager.save(ticket);
      await queryRunner.commitTransaction();

      // Send notifications
      if (savedTicket.customerPhone) {
        await this.notificationService.sendSMS(
          savedTicket.customerPhone,
          `Your token number is ${tokenNumber}. Your position in queue is ${positionInQueue}.`,
        );
      }

      if (savedTicket.customerEmail) {
        await this.notificationService.sendEmail(
          savedTicket.customerEmail,
          'Token Generated',
          `Your token number is ${tokenNumber}. Your position in queue is ${positionInQueue}.`,
        );
      }

      // Emit real-time update
      this.realtimeService.emitTicketCreated(savedTicket);
      this.realtimeService.emitQueueUpdate(agent.id, savedTicket.categoryId);

      return savedTicket;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find the least busy agent (agent with fewest pending tickets across all categories)
   * This includes agents with 0 tickets in the comparison
   */
  private async findLeastBusyAgent(
    agentIds: string[],
    categoryId: string,
  ): Promise<User> {
    // Get all agents first
    const agents = await this.userRepository.find({
      where: { id: In(agentIds) },
    });

    if (agents.length === 0) {
      throw new BadRequestException('No agents found');
    }

    // Count pending tickets for each agent (including those with 0 tickets)
    const agentCounts = await Promise.all(
      agents.map(async (agent) => {
        const ticketCount = await this.ticketRepository.count({
          where: {
            agentId: agent.id,
            status: In([
              TicketStatus.PENDING,
              TicketStatus.CALLED,
              TicketStatus.SERVING,
            ]),
          },
        });
        return {
          agent,
          count: ticketCount,
        };
      }),
    );

    // Sort by ticket count (ascending) and return the agent with the least tickets
    agentCounts.sort((a, b) => a.count - b.count);
    return agentCounts[0].agent;
  }

  /**
   * Generate unique token number (e.g., CATEGORY-001, CATEGORY-002)
   * Uses transaction with row locking to prevent race conditions
   */
  private async generateTokenNumberWithLock(
    category: Category,
    queryRunner: any,
  ): Promise<string> {
    const categoryCode = category.name.substring(0, 3).toUpperCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use FOR UPDATE to lock rows and prevent concurrent access
    const lastTicket = await queryRunner.manager
      .createQueryBuilder(Ticket, 'ticket')
      .where('ticket.tokenNumber LIKE :pattern', {
        pattern: `${categoryCode}-%`,
      })
      .andWhere('ticket.createdAt >= :today', { today })
      .orderBy('ticket.createdAt', 'DESC')
      .setLock('pessimistic_write')
      .getOne();

    let nextNumber = 1;
    if (lastTicket) {
      const lastNumber = parseInt(
        lastTicket.tokenNumber.split('-')[1] || '0',
      );
      nextNumber = lastNumber + 1;
    }

    // Retry logic in case of collision (shouldn't happen with lock, but safety net)
    let attempts = 0;
    const maxAttempts = 10;
    let tokenNumber = `${categoryCode}-${nextNumber.toString().padStart(3, '0')}`;

    while (attempts < maxAttempts) {
      const existing = await queryRunner.manager.findOne(Ticket, {
        where: { tokenNumber },
      });

      if (!existing) {
        return tokenNumber;
      }

      // If token exists, try next number
      nextNumber++;
      tokenNumber = `${categoryCode}-${nextNumber.toString().padStart(3, '0')}`;
      attempts++;
    }

    throw new Error('Failed to generate unique token number after multiple attempts');
  }

  /**
   * Get next position in queue for an agent
   */
  private async getNextPositionInQueue(agentId: string): Promise<number> {
    const lastTicket = await this.ticketRepository.findOne({
      where: { agentId },
      order: { positionInQueue: 'DESC' },
    });

    return lastTicket ? lastTicket.positionInQueue + 1 : 1;
  }

  /**
   * Get agent's own queue
   */
  async getAgentQueue(agentId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { agentId },
      relations: ['category'],
      order: { positionInQueue: 'ASC' },
    });
  }

  /**
   * Get all queues (Admin only)
   */
  async getAllQueues(categoryId?: string, agentId?: string): Promise<Ticket[]> {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (agentId) where.agentId = agentId;

    return this.ticketRepository.find({
      where,
      relations: ['category', 'agent'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['category', 'agent'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  /**
   * Get ticket by token number (Public)
   */
  async getTicketByToken(tokenNumber: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { tokenNumber },
      relations: ['category', 'agent'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  /**
   * Call next ticket (Agent)
   */
  async callNext(agentId: string): Promise<Ticket> {
    const nextTicket = await this.ticketRepository.findOne({
      where: {
        agentId,
        status: TicketStatus.PENDING,
      },
      relations: ['category'],
      order: { positionInQueue: 'ASC' },
    });

    if (!nextTicket) {
      throw new NotFoundException('No pending tickets in queue');
    }

    nextTicket.status = TicketStatus.CALLED;
    nextTicket.calledAt = new Date();
    const savedTicket = await this.ticketRepository.save(nextTicket);

    // Send SMS notification
    if (savedTicket.customerPhone) {
      await this.notificationService.sendSMS(
        savedTicket.customerPhone,
        `Your token ${savedTicket.tokenNumber} has been called. Please proceed to counter.`,
      );
    }

    // Emit real-time update
    this.realtimeService.emitTicketCalled(savedTicket);
    this.realtimeService.emitQueueUpdate(agentId, savedTicket.categoryId);

    return savedTicket;
  }

  /**
   * Mark ticket as serving
   */
  async markAsServing(ticketId: string, agentId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);

    // Verify agent owns this ticket
    if (ticket.agentId !== agentId) {
      throw new BadRequestException('You can only serve your own tickets');
    }

    if (ticket.status !== TicketStatus.CALLED) {
      throw new BadRequestException('Ticket must be called first');
    }

    ticket.status = TicketStatus.SERVING;
    ticket.servingStartedAt = new Date();
    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitTicketServing(savedTicket);
    this.realtimeService.emitQueueUpdate(agentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Mark ticket as completed
   */
  async markAsCompleted(ticketId: string, agentId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);

    // Verify agent owns this ticket (or admin)
    if (ticket.agentId !== agentId) {
      throw new BadRequestException('You can only complete your own tickets');
    }

    ticket.status = TicketStatus.COMPLETED;
    ticket.completedAt = new Date();
    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitTicketCompleted(savedTicket);
    this.realtimeService.emitQueueUpdate(agentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Mark ticket as no-show
   */
  async markAsNoShow(ticketId: string, agentId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);

    if (ticket.agentId !== agentId) {
      throw new BadRequestException('You can only mark your own tickets');
    }

    ticket.status = TicketStatus.NO_SHOW;
    ticket.noShowAt = new Date();
    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitTicketNoShow(savedTicket);
    this.realtimeService.emitQueueUpdate(agentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Reorder queue (Agent can reorder their own queue)
   */
  async reorderQueue(
    agentId: string,
    ticketIds: string[],
  ): Promise<Ticket[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tickets = await this.ticketRepository.find({
        where: { agentId, id: In(ticketIds) },
      });

      if (tickets.length !== ticketIds.length) {
        throw new BadRequestException('Some tickets not found');
      }

      // Update positions
      for (let i = 0; i < ticketIds.length; i++) {
        const ticket = tickets.find((t) => t.id === ticketIds[i]);
        if (ticket) {
          ticket.positionInQueue = i + 1;
          await queryRunner.manager.save(ticket);
        }
      }

      await queryRunner.commitTransaction();

      const updatedTickets = await this.getAgentQueue(agentId);
      this.realtimeService.emitQueueUpdate(agentId, tickets[0]?.categoryId);

      return updatedTickets;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Transfer ticket to another agent
   */
  async transferTicket(
    ticketId: string,
    newAgentId: string,
    currentAgentId: string,
  ): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);

    if (ticket.agentId !== currentAgentId) {
      throw new BadRequestException('You can only transfer your own tickets');
    }

    const newAgent = await this.userRepository.findOne({
      where: { id: newAgentId, role: UserRole.AGENT },
    });

    if (!newAgent) {
      throw new NotFoundException('New agent not found');
    }

    // Verify new agent handles this category
    const agentsForCategory =
      await this.usersService.getAgentsByCategory(ticket.categoryId);
    if (!agentsForCategory.find((a) => a.id === newAgentId)) {
      throw new BadRequestException(
        'New agent does not handle this category',
      );
    }

    const newPosition = await this.getNextPositionInQueue(newAgentId);

    ticket.agentId = newAgentId;
    ticket.positionInQueue = newPosition;
    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitTicketTransferred(savedTicket);
    this.realtimeService.emitQueueUpdate(currentAgentId, ticket.categoryId);
    this.realtimeService.emitQueueUpdate(newAgentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Get public status page data
   */
  async getPublicStatus(categoryId?: string): Promise<any> {
    const where: any = {
      status: In([TicketStatus.PENDING, TicketStatus.CALLED, TicketStatus.SERVING]),
    };
    if (categoryId) where.categoryId = categoryId;

    const tickets = await this.ticketRepository.find({
      where,
      relations: ['category', 'agent'],
      order: { positionInQueue: 'ASC' },
    });

    // Group by category and agent
    const status = tickets.reduce((acc, ticket) => {
      const catName = ticket.category.name;
      if (!acc[catName]) {
        acc[catName] = {};
      }
      const agentName = ticket.agent
        ? `${ticket.agent.firstName} ${ticket.agent.lastName}`
        : 'Unassigned';
      if (!acc[catName][agentName]) {
        acc[catName][agentName] = [];
      }
      acc[catName][agentName].push({
        tokenNumber: ticket.tokenNumber,
        status: ticket.status,
        positionInQueue: ticket.positionInQueue,
      });
      return acc;
    }, {});

    return status;
  }

  /**
   * Admin: Call next ticket for any agent
   */
  async adminCallNext(agentId: string): Promise<Ticket> {
    return this.callNext(agentId);
  }

  /**
   * Admin: Mark any ticket as completed
   */
  async adminMarkAsCompleted(ticketId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    ticket.status = TicketStatus.COMPLETED;
    ticket.completedAt = new Date();
    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitTicketCompleted(savedTicket);
    this.realtimeService.emitQueueUpdate(ticket.agentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Admin: Mark any ticket as serving
   */
  async adminMarkAsServing(ticketId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    
    if (ticket.status !== TicketStatus.CALLED && ticket.status !== TicketStatus.PENDING) {
      throw new BadRequestException('Ticket must be called or pending to mark as serving');
    }

    ticket.status = TicketStatus.SERVING;
    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitTicketServing(savedTicket);
    this.realtimeService.emitQueueUpdate(ticket.agentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Admin: Mark any ticket as no-show
   */
  async adminMarkAsNoShow(ticketId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    ticket.status = TicketStatus.NO_SHOW;
    ticket.noShowAt = new Date();
    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitTicketNoShow(savedTicket);
    this.realtimeService.emitQueueUpdate(ticket.agentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Admin: Delete ticket from queue
   */
  async deleteTicket(ticketId: string): Promise<void> {
    const ticket = await this.getTicketById(ticketId);
    await this.ticketRepository.remove(ticket);
    
    // Emit update to notify affected agent
    this.realtimeService.emitQueueUpdate(ticket.agentId, ticket.categoryId);
  }

  /**
   * Reopen ticket (Agent can reopen their own tickets)
   */
  async reopenTicket(ticketId: string, agentId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);

    // Verify agent owns this ticket
    if (ticket.agentId !== agentId) {
      throw new BadRequestException('You can only reopen your own tickets');
    }

    // Only allow reopening completed or no-show tickets
    if (ticket.status !== TicketStatus.COMPLETED && ticket.status !== TicketStatus.NO_SHOW) {
      throw new BadRequestException('Can only reopen completed or no-show tickets');
    }

    // Reset to pending and recalculate position
    ticket.status = TicketStatus.PENDING;
    ticket.completedAt = null;
    ticket.noShowAt = null;
    ticket.calledAt = null;
    ticket.servingStartedAt = null;

    // Recalculate position in queue
    const positionInQueue = await this.getNextPositionInQueue(ticket.agentId);
    ticket.positionInQueue = positionInQueue;

    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitQueueUpdate(ticket.agentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Admin: Reopen any ticket
   */
  async adminReopenTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);

    // Only allow reopening completed or no-show tickets
    if (ticket.status !== TicketStatus.COMPLETED && ticket.status !== TicketStatus.NO_SHOW) {
      throw new BadRequestException('Can only reopen completed or no-show tickets');
    }

    // Reset to pending and recalculate position
    ticket.status = TicketStatus.PENDING;
    ticket.completedAt = null;
    ticket.noShowAt = null;
    ticket.calledAt = null;
    ticket.servingStartedAt = null;

    // Recalculate position in queue
    const positionInQueue = await this.getNextPositionInQueue(ticket.agentId);
    ticket.positionInQueue = positionInQueue;

    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitQueueUpdate(ticket.agentId, ticket.categoryId);

    return savedTicket;
  }

  /**
   * Admin: Update ticket information
   */
  async adminUpdateTicket(
    ticketId: string,
    updateData: {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      formData?: Record<string, any>;
    },
  ): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);

    if (updateData.customerName !== undefined) {
      ticket.customerName = updateData.customerName;
    }
    if (updateData.customerPhone !== undefined) {
      ticket.customerPhone = updateData.customerPhone;
    }
    if (updateData.customerEmail !== undefined) {
      ticket.customerEmail = updateData.customerEmail;
    }
    if (updateData.formData !== undefined) {
      ticket.formData = updateData.formData;
    }

    const savedTicket = await this.ticketRepository.save(ticket);

    this.realtimeService.emitQueueUpdate(ticket.agentId, ticket.categoryId);

    return savedTicket;
  }
}

