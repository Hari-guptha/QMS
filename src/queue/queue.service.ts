import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TicketStatus, UserRole } from '../common/enums';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UsersService } from '../users/users.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class QueueService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private realtimeService: RealtimeService,
    private notificationService: NotificationService,
    private encryptionService: EncryptionService,
  ) { }

  private encryptTicket(data: any) {
    if (data.customerName) data.customerName = this.encryptionService.encrypt(data.customerName);
    if (data.customerPhone) data.customerPhone = this.encryptionService.encrypt(data.customerPhone);
    if (data.customerEmail) data.customerEmail = this.encryptionService.encrypt(data.customerEmail);
    if (data.formData) {
      const formDataObj = typeof data.formData === 'string' ? JSON.parse(data.formData) : data.formData;
      data.formData = this.encryptionService.encryptObject(formDataObj);
    }
    return data;
  }

  private decryptUser(user: any) {
    if (!user) return user;
    if (user.phone) user.phone = this.encryptionService.decrypt(user.phone);
    if (user.firstName) user.firstName = this.encryptionService.decrypt(user.firstName);
    if (user.lastName) user.lastName = this.encryptionService.decrypt(user.lastName);
    return user;
  }

  private decryptTicket(ticket: any) {
    if (!ticket) return ticket;
    if (ticket.customerName) ticket.customerName = this.encryptionService.decrypt(ticket.customerName);
    if (ticket.customerPhone) ticket.customerPhone = this.encryptionService.decrypt(ticket.customerPhone);
    if (ticket.customerEmail) ticket.customerEmail = this.encryptionService.decrypt(ticket.customerEmail);
    if (ticket.formData) {
      try {
        ticket.formData = this.encryptionService.decryptObject(ticket.formData);
      } catch (e) {
        // Fallback or ignore
      }
    }
    if (ticket.agent) {
      ticket.agent = this.decryptUser(ticket.agent);
    }
    return ticket;
  }

  /**
   * Core Logic: Create ticket and route to least busy agent
   * Includes retry logic to handle concurrent token number conflicts
   */
  async createTicket(createTicketDto: CreateTicketDto) {
    // Get all active agents for this category (outside transaction to avoid timeout)
    const agents = await this.usersService.getAgentsByCategory(createTicketDto.categoryId);

    if (agents.length === 0) {
      throw new BadRequestException('No active agents available for this category');
    }

    // Retry logic for handling unique constraint violations (P2002) and transaction timeouts (P2028)
    const maxRetries = 5;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Add delay BEFORE transaction on retries to reduce collision probability
        // This prevents the delay from counting against transaction timeout
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 * attempt));
        }

        // Use transaction with increased timeout (30 seconds) to prevent P2028 errors
        const savedTicket = await this.prisma.$transaction(async (tx: any) => {
          const category = await tx.category.findUnique({
            where: { id: createTicketDto.categoryId },
          });

          if (!category || !category.isActive) {
            throw new NotFoundException('Category not found or inactive');
          }

          // Find the least busy agent
          const agent = await this.findLeastBusyAgentInternal(tx, agents.map((a) => a.id));

          // Generate token number (Simplified locking for Prisma/MSSQL)
          const tokenNumber = await this.generateTokenNumberInternal(tx, category, attempt);

          // Get position in queue for this agent
          const positionInQueue = await this.getNextPositionInQueueInternal(tx, agent.id);

          // Prepare data with encryption
          const data = this.encryptTicket({
            ...createTicketDto,
            categoryId: createTicketDto.categoryId,
            agentId: agent.id,
            tokenNumber,
            positionInQueue,
            status: TicketStatus.PENDING,
          });

          // Create ticket
          const ticket = await tx.ticket.create({
            data,
            include: {
              category: true,
              agent: true,
            }
          });

          return ticket;
        }, {
          maxWait: 30000, // Maximum time to wait for a transaction slot (30 seconds)
          timeout: 30000, // Maximum time the transaction can run (30 seconds)
        });

        // If successful, process and return
        return this.processCreatedTicket(savedTicket);
      } catch (error: any) {
        // Check if it's a unique constraint violation (P2002) or transaction timeout (P2028)
        const isRetryableError = 
          error.code === 'P2002' || // Unique constraint violation
          error.code === 'P2028';   // Transaction timeout/expired

        if (isRetryableError) {
          // For P2002, check if it's related to tickets table
          if (error.code === 'P2002') {
            const isTicketConstraint = 
              error.meta?.modelName === 'Ticket' || 
              error.meta?.target?.includes('tickets') ||
              error.meta?.target?.includes('tokenNumber');
            
            if (!isTicketConstraint) {
              // Not a ticket-related constraint, don't retry
              throw error;
            }
          }

          lastError = error;
          // Wait before retrying (exponential backoff)
          if (attempt < maxRetries - 1) {
            const backoffDelay = error.code === 'P2028' 
              ? 100 * Math.pow(2, attempt) // Longer backoff for timeouts
              : 50 * Math.pow(2, attempt);  // Shorter backoff for constraint violations
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue; // Retry
          }
        }
        // If it's not a retryable error or we've exhausted retries, throw
        throw error;
      }
    }

    // If we've exhausted all retries, throw a descriptive error
    if (lastError) {
      if (lastError.code === 'P2028') {
        throw new BadRequestException('Transaction timeout: Please try again. The system is experiencing high load.');
      } else if (lastError.code === 'P2002') {
        throw new BadRequestException('Unable to generate unique token number. Please try again.');
      }
      throw lastError;
    }
    throw new BadRequestException('Failed to create ticket after multiple attempts. Please try again.');
  }

  /**
   * Process a successfully created ticket (notifications, realtime updates, etc.)
   */
  private async processCreatedTicket(savedTicket: any) {
    const decrypted = this.decryptTicket(savedTicket);

    // Send notifications (using decrypted data)
    const method = await this.notificationService.getMethod();
    const message = `Your token number is ${decrypted.tokenNumber}. Your position in queue is ${decrypted.positionInQueue}.`;
    if (method === 'sms') {
      if (decrypted.customerPhone) {
        await this.notificationService.sendSMS(decrypted.customerPhone, message);
      }
    } else {
      if (decrypted.customerEmail) {
        // send email; no agent context for a public check-in
        await this.notificationService.sendEmail(decrypted.customerEmail, 'Token Generated', message);
      }
    }

    // Emit real-time update
    this.realtimeService.emitTicketCreated(decrypted);
    this.realtimeService.emitQueueUpdate(decrypted.agentId, decrypted.categoryId);

    return decrypted;
  }

  /**
   * Internal find least busy agent using transaction context
   * Optimized to use a single query with aggregation
   */
  private async findLeastBusyAgentInternal(tx: any, agentIds: string[]) {
    // Only consider tickets created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get all agents first
    const agents = await tx.user.findMany({
      where: { id: { in: agentIds } },
      select: { id: true }, // Only select id for faster query
    });

    if (agents.length === 0) {
      throw new BadRequestException('No agents found');
    }

    // Get ticket counts for all agents in a single query using groupBy
    // Note: Prisma doesn't support groupBy with count directly, so we use a more efficient approach
    // Get all relevant tickets and count in memory (faster than multiple queries for small datasets)
    const tickets = await tx.ticket.findMany({
      where: {
        agentId: { in: agentIds },
        status: {
          in: [TicketStatus.PENDING, TicketStatus.CALLED, TicketStatus.SERVING],
        },
        createdAt: {
          gte: today,
          lte: todayEnd,
        }
      },
      select: { agentId: true }, // Only select agentId for faster query
    });

    // Count tickets per agent
    const agentCountMap = new Map<string, number>();
    agentIds.forEach(id => agentCountMap.set(id, 0));
    tickets.forEach(ticket => {
      if (ticket.agentId) {
        agentCountMap.set(ticket.agentId, (agentCountMap.get(ticket.agentId) || 0) + 1);
      }
    });

    // Find agent with minimum count
    let minCount = Infinity;
    let leastBusyAgentId = agentIds[0];
    agentCountMap.forEach((count, agentId) => {
      if (count < minCount) {
        minCount = count;
        leastBusyAgentId = agentId;
      }
    });

    // Return full agent object
    const agent = await tx.user.findUnique({
      where: { id: leastBusyAgentId },
    });

    if (!agent) {
      throw new BadRequestException('Agent not found');
    }

    return agent;
  }

  /**
   * Internal token generation with serializable-like behavior in MSSQL
   * Optimized to reduce transaction time and avoid timeouts
   * @param retryAttempt - Current retry attempt (0 for first try, >0 for retries)
   */
  private async generateTokenNumberInternal(tx: any, category: any, retryAttempt: number = 0): Promise<string> {
    const categoryCode = category.name.substring(0, 3).toUpperCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the highest token number for today in a single query
    const lastTicket = await tx.ticket.findFirst({
      where: {
        tokenNumber: { startsWith: `${categoryCode}-` },
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
      select: { tokenNumber: true },
    });

    let nextNumber = 1;
    if (lastTicket) {
      const parts = lastTicket.tokenNumber.split('-');
      const lastNum = parseInt(parts[1] || '0', 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    // On retries, add a random offset to reduce collision probability
    if (retryAttempt > 0) {
      const randomOffset = Math.floor(Math.random() * (retryAttempt * 10)) + 1;
      nextNumber += randomOffset;
    }

    // Generate initial token number
    let tokenNumber = `${categoryCode}-${nextNumber.toString().padStart(3, '0')}`;
    
    // Check if token exists - limit attempts to avoid transaction timeout
    // Reduced to 3 attempts since we have retry logic at the transaction level
    const maxAttempts = 3;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      // Single query to check existence for today
      const existing = await tx.ticket.findFirst({
        where: {
          tokenNumber,
          createdAt: { gte: today },
        },
        select: { id: true }, // Only select id for faster query
      });
      
      if (!existing) {
        return tokenNumber;
      }

      nextNumber++;
      tokenNumber = `${categoryCode}-${nextNumber.toString().padStart(3, '0')}`;
      attempts++;
    }
    
    // Fallback: use timestamp-based token with random component to ensure uniqueness
    // This ensures we always return a unique token even if all sequential numbers are taken
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    tokenNumber = `${categoryCode}-${timestamp}${randomSuffix}`;
    
    return tokenNumber;
  }

  private async getNextPositionInQueueInternal(tx: any, agentId: string): Promise<number> {
    // Only consider tickets created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const lastTicket = await tx.ticket.findFirst({
      where: {
        agentId,
        status: { in: [TicketStatus.PENDING, TicketStatus.CALLED, TicketStatus.SERVING] },
        positionInQueue: { gt: 0 },
        createdAt: {
          gte: today,
          lte: todayEnd,
        }
      },
      orderBy: { positionInQueue: 'desc' },
    });
    return lastTicket ? lastTicket.positionInQueue + 1 : 1;
  }

  private async shiftQueuePositionsUp(tx: any, agentId: string, removedPosition: number) {
    if (removedPosition <= 0) return;
    await tx.ticket.updateMany({
      where: {
        agentId,
        positionInQueue: { gt: removedPosition },
      },
      data: {
        positionInQueue: { decrement: 1 },
      },
    });
  }

  async getAgentQueue(agentId: string) {
    // Only return tickets created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        agentId,
        createdAt: {
          gte: today,
          lte: todayEnd,
        }
      },
      include: { category: true },
      orderBy: { positionInQueue: 'asc' },
    });
    return tickets.map((t) => this.decryptTicket(t));
  }

  async getAgentHistory(agentId: string, startDate?: string, endDate?: string) {
    const where: Prisma.TicketWhereInput = {
      agentId,
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: start,
        lte: end,
      };
    } else {
      // Default to today if no date range is provided
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      where.createdAt = {
        gte: today,
        lt: tomorrow,
      };
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: { category: true, agent: true },
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((t) => this.decryptTicket(t));
  }

  async getAllQueues(categoryId?: string, agentId?: string) {
    const where: Prisma.TicketWhereInput = {};
    if (categoryId) where.categoryId = categoryId;
    if (agentId) where.agentId = agentId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: { category: true, agent: true },
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((t) => this.decryptTicket(t));
  }

  async getTicketById(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { category: true, agent: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.decryptTicket(ticket);
  }

  async getTicketByToken(tokenNumber: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { tokenNumber },
      include: { category: true, agent: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.decryptTicket(ticket);
  }

  async callNext(agentId: string) {
    // Only consider tickets created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const nextTicket = await this.prisma.ticket.findFirst({
      where: {
        agentId,
        status: TicketStatus.PENDING,
        createdAt: {
          gte: today,
          lte: todayEnd,
        }
      },
      include: { category: true },
      orderBy: { positionInQueue: 'asc' },
    });

    if (!nextTicket) throw new NotFoundException('No pending tickets in queue');

    const updated = await this.prisma.ticket.update({
      where: { id: nextTicket.id },
      data: {
        status: TicketStatus.SERVING,
        calledAt: new Date(),
        servingStartedAt: new Date(),
      },
      include: { category: true, agent: true }
    });

    const decrypted = this.decryptTicket(updated);

    if (decrypted.customerPhone) {
      await this.notificationService.sendSMS(
        decrypted.customerPhone,
        `Your token ${decrypted.tokenNumber} has been called. Please proceed to counter.`,
      );
    }
    // Also respect configured method and send email if configured
    const method = await this.notificationService.getMethod();
    if (method !== 'sms' && decrypted.customerEmail) {
      // If agent exists, send from agent
      const from = decrypted.agent && decrypted.agent.email ? { name: `${decrypted.agent.firstName} ${decrypted.agent.lastName}`, email: decrypted.agent.email } : undefined;
      await this.notificationService.sendTemplate(decrypted.customerEmail, 'Token Called', 'application_applied', { companyName: 'QMS', name: decrypted.customerName, token: decrypted.tokenNumber }, from as any);
    }

    this.realtimeService.emitTicketServing(decrypted);
    this.realtimeService.emitQueueUpdate(agentId, decrypted.categoryId);

    return decrypted;
  }

  async markAsServing(ticketId: string, agentId: string) {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.agentId !== agentId) throw new BadRequestException('You can only serve your own tickets');
    if (ticket.status !== TicketStatus.CALLED) throw new BadRequestException('Ticket must be called first');

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.SERVING,
        servingStartedAt: new Date(),
      },
      include: { category: true, agent: true }
    });

    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitTicketServing(decrypted);
    this.realtimeService.emitQueueUpdate(agentId, ticket.categoryId);
    return decrypted;
  }

  async markAsCompleted(ticketId: string, agentId: string, note?: string) {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.agentId !== agentId) throw new BadRequestException('You can only complete your own tickets');

    const updateData: any = {
      status: TicketStatus.COMPLETED,
      completedAt: new Date(),
      positionInQueue: 0,
    };

    if (note && note.trim()) {
      updateData.note = note.trim();
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const removedPosition = ticket.positionInQueue;
      const t = await tx.ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: { category: true, agent: true }
      });
      await this.shiftQueuePositionsUp(tx, agentId, removedPosition);
      return t;
    });

    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitTicketCompleted(decrypted);
    this.realtimeService.emitQueueUpdate(agentId, ticket.categoryId);
    return decrypted;
  }

  async markAsNoShow(ticketId: string, agentId: string, note?: string) {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.agentId !== agentId) throw new BadRequestException('You can only mark your own tickets');

    const updateData: any = {
      status: TicketStatus.HOLD,
      noShowAt: new Date(),
      positionInQueue: 0,
    };

    if (note && note.trim()) {
      updateData.note = note.trim();
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const removedPosition = ticket.positionInQueue;
      const t = await tx.ticket.update({
        where: { id: ticketId },
        data: updateData,
        include: { category: true, agent: true }
      });
      await this.shiftQueuePositionsUp(tx, agentId, removedPosition);
      return t;
    });

    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitTicketHold(decrypted);
    this.realtimeService.emitQueueUpdate(agentId, ticket.categoryId);
    return decrypted;
  }

  async reorderQueue(agentId: string, ticketIds: string[]) {
    return this.prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < ticketIds.length; i++) {
        await tx.ticket.updateMany({
          where: { id: ticketIds[i], agentId },
          data: { positionInQueue: i + 1 },
        });
      }
      return tx.ticket.findMany({
        where: { agentId },
        include: { category: true },
        orderBy: { positionInQueue: 'asc' },
      });
    }).then((updatedTickets) => {
      const decrypted = updatedTickets.map((t) => this.decryptTicket(t));
      this.realtimeService.emitQueueUpdate(agentId, decrypted[0]?.categoryId);
      return decrypted;
    });
  }

  async transferTicket(ticketId: string, newAgentId: string, currentAgentId: string) {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.agentId !== currentAgentId) throw new BadRequestException('You can only transfer your own tickets');

    const newAgent = await this.prisma.user.findUnique({
      where: { id: newAgentId },
    });

    if (!newAgent || newAgent.role !== UserRole.AGENT) {
      throw new NotFoundException('New agent not found');
    }

    const agentsForCategory = await this.usersService.getAgentsByCategory(ticket.categoryId);
    if (!agentsForCategory.find((a: any) => a.id === newAgentId)) {
      throw new BadRequestException('New agent does not handle this category');
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const oldPosition = ticket.positionInQueue;
      const newPosition = await this.getNextPositionInQueueInternal(tx, newAgentId);

      const t = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          agentId: newAgentId,
          positionInQueue: newPosition,
        },
        include: { category: true, agent: true }
      });

      await this.shiftQueuePositionsUp(tx, currentAgentId, oldPosition);
      return t;
    });

    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitTicketTransferred(decrypted);
    this.realtimeService.emitQueueUpdate(currentAgentId, ticket.categoryId);
    this.realtimeService.emitQueueUpdate(newAgentId, ticket.categoryId);

    return decrypted;
  }

  async adminReassignTicket(ticketId: string, newAgentId: string) {
    const ticket = await this.getTicketById(ticketId);

    const newAgent = await this.prisma.user.findUnique({
      where: { id: newAgentId },
    });

    if (!newAgent || newAgent.role !== UserRole.AGENT) {
      throw new NotFoundException('New agent not found');
    }

    const agentsForCategory = await this.getAgentsByCategoryInternal(ticket.categoryId);
    if (!agentsForCategory.find((a: any) => a.id === newAgentId)) {
      throw new BadRequestException('New agent does not handle this category');
    }

    const currentAgentId = ticket.agentId;

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const oldPosition = ticket.positionInQueue;
      const newPosition = await this.getNextPositionInQueueInternal(tx, newAgentId);

      const t = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          agentId: newAgentId,
          positionInQueue: newPosition,
        },
        include: { category: true, agent: true }
      });

      if (currentAgentId) {
        await this.shiftQueuePositionsUp(tx, currentAgentId, oldPosition);
      }
      return t;
    });

    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitTicketTransferred(decrypted);
    if (currentAgentId) {
      this.realtimeService.emitQueueUpdate(currentAgentId, ticket.categoryId);
    }
    this.realtimeService.emitQueueUpdate(newAgentId, ticket.categoryId);

    return decrypted;
  }

  private async getAgentsByCategoryInternal(categoryId: string) {
    const agentCategories = await this.prisma.agentCategory.findMany({
      where: { categoryId, isActive: true },
      include: { agent: true },
    });
    return agentCategories.map((ac) => ac.agent);
  }

  async getPublicStatus(categoryId?: string) {
    // 1. Get all active categories
    const categories = await this.prisma.category.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { id: categoryId } : {})
      },
      include: {
        agentCategories: {
          where: { isActive: true },
          include: {
            agent: true
          }
        }
      }
    });

    const result: any = {};

    // 2. Initialize categories and agents
    for (const cat of categories) {
      // Handle bit type for isActive and filter agents properly
      const activeAgentAssignments = cat.agentCategories.filter(ac => ac.agent.isActive);

      if (activeAgentAssignments.length === 0) continue; // Skip categories with no agents

      result[cat.name] = {};
      for (const ac of activeAgentAssignments) {
        const decryptedAgent = this.decryptUser(ac.agent);
        const agentName = `${decryptedAgent.firstName} ${decryptedAgent.lastName}`;
        result[cat.name][agentName] = [];
      }
    }

    // 3. Get all active tickets created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const where: Prisma.TicketWhereInput = {
      status: { in: [TicketStatus.PENDING, TicketStatus.CALLED, TicketStatus.SERVING] },
      positionInQueue: { gt: 0 },
      createdAt: {
        gte: today,
        lte: todayEnd,
      }
    };
    if (categoryId) where.categoryId = categoryId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: { category: true, agent: true },
      orderBy: { positionInQueue: 'asc' },
    });

    // 4. Populate tickets
    for (const ticket of tickets) {
      const decrypted = this.decryptTicket(ticket);
      const catName = decrypted.category.name;

      // Safety check if category was filtered out or inactive
      if (!result[catName]) continue;

      const agentName = decrypted.agent
        ? `${decrypted.agent.firstName} ${decrypted.agent.lastName}`
        : 'Unassigned';

      if (!result[catName][agentName]) {
        result[catName][agentName] = [];
      }

      result[catName][agentName].push({
        tokenNumber: decrypted.tokenNumber,
        status: decrypted.status,
        positionInQueue: decrypted.positionInQueue,
        createdAt: ticket.createdAt, // Include createdAt for frontend filtering
      });
    }

    return result;
  }

  async adminCallNext(agentId: string) {
    return this.callNext(agentId);
  }

  async adminMarkAsCompleted(ticketId: string) {
    const ticket = await this.getTicketById(ticketId);
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const removedPosition = ticket.positionInQueue;
      const t = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.COMPLETED,
          completedAt: new Date(),
          positionInQueue: 0,
        },
        include: { category: true, agent: true }
      });
      if (ticket.agentId) {
        await this.shiftQueuePositionsUp(tx, ticket.agentId, removedPosition);
      }
      return t;
    });
    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitTicketCompleted(decrypted);
    this.realtimeService.emitQueueUpdate(decrypted.agentId, decrypted.categoryId);
    return decrypted;
  }

  async adminMarkAsServing(ticketId: string) {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.status !== TicketStatus.CALLED && ticket.status !== TicketStatus.PENDING) {
      throw new BadRequestException('Ticket must be called or pending to mark as serving');
    }
    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.SERVING },
      include: { category: true, agent: true }
    });
    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitTicketServing(decrypted);
    this.realtimeService.emitQueueUpdate(decrypted.agentId, decrypted.categoryId);
    return decrypted;
  }

  async adminMarkAsNoShow(ticketId: string) {
    const ticket = await this.getTicketById(ticketId);
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const removedPosition = ticket.positionInQueue;
      const t = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.HOLD,
          noShowAt: new Date(),
          positionInQueue: 0,
        },
        include: { category: true, agent: true }
      });
      if (ticket.agentId) {
        await this.shiftQueuePositionsUp(tx, ticket.agentId, removedPosition);
      }
      return t;
    });
    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitTicketNoShow(decrypted);
    this.realtimeService.emitQueueUpdate(decrypted.agentId, decrypted.categoryId);
    return decrypted;
  }

  async deleteTicket(ticketId: string): Promise<void> {
    const ticket = await this.getTicketById(ticketId);
    await this.prisma.$transaction(async (tx: any) => {
      const removedPosition = ticket.positionInQueue;
      await tx.ticket.delete({ where: { id: ticketId } });
      if (ticket.agentId) {
        await this.shiftQueuePositionsUp(tx, ticket.agentId, removedPosition);
      }
    });
    this.realtimeService.emitQueueUpdate(ticket.agentId, ticket.categoryId);
  }

  async reopenTicket(ticketId: string, agentId: string) {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.agentId !== agentId) throw new BadRequestException('You can only reopen your own tickets');
    if (ticket.status !== TicketStatus.COMPLETED && ticket.status !== TicketStatus.HOLD) {
      throw new BadRequestException('Can only reopen completed or hold tickets');
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const positionInQueue = await this.getNextPositionInQueueInternal(tx, ticket.agentId);
      return tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.PENDING,
          completedAt: null,
          noShowAt: null,
          calledAt: null,
          servingStartedAt: null,
          positionInQueue,
        },
        include: { category: true, agent: true }
      });
    });
    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitQueueUpdate(decrypted.agentId, decrypted.categoryId);
    return decrypted;
  }

  async adminReopenTicket(ticketId: string) {
    const ticket = await this.getTicketById(ticketId);
    if (ticket.status !== TicketStatus.COMPLETED && ticket.status !== TicketStatus.HOLD) {
      throw new BadRequestException('Can only reopen completed or hold tickets');
    }
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const positionInQueue = await this.getNextPositionInQueueInternal(tx, ticket.agentId);
      return tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.PENDING,
          completedAt: null,
          noShowAt: null,
          calledAt: null,
          servingStartedAt: null,
          positionInQueue,
        },
        include: { category: true, agent: true }
      });
    });
    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitQueueUpdate(decrypted.agentId, decrypted.categoryId);
    return decrypted;
  }

  async adminUpdateTicket(ticketId: string, updateData: any) {
    await this.getTicketById(ticketId);
    const data = this.encryptTicket({ ...updateData });

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data,
      include: { category: true, agent: true }
    });
    const decrypted = this.decryptTicket(updated);
    this.realtimeService.emitQueueUpdate(decrypted.agentId, decrypted.categoryId);
    return decrypted;
  }
}
