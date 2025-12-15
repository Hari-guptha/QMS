import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Ticket, TicketStatus } from '../queue/entities/ticket.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getAverageWaitTime(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.status = :status', { status: TicketStatus.COMPLETED })
      .andWhere('ticket.calledAt IS NOT NULL')
      .andWhere('ticket.servingStartedAt IS NOT NULL');

    if (startDate && endDate) {
      query.andWhere('ticket.completedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const tickets = await query.getMany();

    if (tickets.length === 0) return 0;

    const totalWaitTime = tickets.reduce((sum, ticket) => {
      if (!ticket.servingStartedAt || !ticket.calledAt) return sum;
      const servingStart = ticket.servingStartedAt instanceof Date 
        ? ticket.servingStartedAt 
        : new Date(ticket.servingStartedAt);
      const called = ticket.calledAt instanceof Date 
        ? ticket.calledAt 
        : new Date(ticket.calledAt);
      const waitTime = servingStart.getTime() - called.getTime();
      return sum + waitTime;
    }, 0);

    return Math.round(totalWaitTime / tickets.length / 1000 / 60); // Convert to minutes
  }

  async getAverageServiceTime(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .where('ticket.status = :status', { status: TicketStatus.COMPLETED })
      .andWhere('ticket.servingStartedAt IS NOT NULL')
      .andWhere('ticket.completedAt IS NOT NULL');

    if (startDate && endDate) {
      query.andWhere('ticket.completedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const tickets = await query.getMany();

    if (tickets.length === 0) return 0;

    const totalServiceTime = tickets.reduce((sum, ticket) => {
      if (!ticket.completedAt || !ticket.servingStartedAt) return sum;
      const completed = ticket.completedAt instanceof Date 
        ? ticket.completedAt 
        : new Date(ticket.completedAt);
      const servingStart = ticket.servingStartedAt instanceof Date 
        ? ticket.servingStartedAt 
        : new Date(ticket.servingStartedAt);
      const serviceTime = completed.getTime() - servingStart.getTime();
      return sum + serviceTime;
    }, 0);

    return Math.round(totalServiceTime / tickets.length / 1000 / 60); // Convert to minutes
  }

  async getPeakHours(startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('HOUR(ticket.createdAt)', 'hour')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('hour')
      .orderBy('count', 'DESC');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();

    return results.map((r) => ({
      hour: parseInt(r.hour),
      count: parseInt(r.count),
    }));
  }

  async getAbandonmentRate(
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const query = this.ticketRepository.createQueryBuilder('ticket');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const allTickets = await query.getMany();
    const noShowTickets = allTickets.filter(
      (t) => t.status === TicketStatus.NO_SHOW,
    );

    if (allTickets.length === 0) return 0;

    return (noShowTickets.length / allTickets.length) * 100;
  }

  async getAgentPerformance(
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.agentId', 'agentId')
      .addSelect('COUNT(ticket.id)', 'totalTickets')
      .addSelect(
        'SUM(CASE WHEN ticket.status = :completed THEN 1 ELSE 0 END)',
        'completedTickets',
      )
      .addSelect(
        'AVG(CASE WHEN ticket.completedAt IS NOT NULL AND ticket.servingStartedAt IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, ticket.servingStartedAt, ticket.completedAt) ELSE NULL END)',
        'avgServiceTime',
      )
      .where('ticket.agentId IS NOT NULL')
      .setParameter('completed', TicketStatus.COMPLETED)
      .groupBy('ticket.agentId')
      .orderBy('SUM(CASE WHEN ticket.status = :completed THEN 1 ELSE 0 END)', 'DESC');

    if (startDate && endDate) {
      query.andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();

    // Enrich with agent details
    const agentIds = results.map((r) => r.agentId);
    const agents = await this.userRepository.find({
      where: { id: In(agentIds) },
    });

    return results.map((r) => {
      const agent = agents.find((a) => a.id === r.agentId);
      return {
        agentId: r.agentId,
        agentName: agent
          ? `${agent.firstName} ${agent.lastName}`
          : 'Unknown',
        totalTickets: parseInt(r.totalTickets),
        completedTickets: parseInt(r.completedTickets),
        avgServiceTime: r.avgServiceTime
          ? Math.round(parseFloat(r.avgServiceTime))
          : 0,
        completionRate:
          r.totalTickets > 0
            ? (parseInt(r.completedTickets) / parseInt(r.totalTickets)) * 100
            : 0,
      };
    });
  }

  async getCategoryStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('ticket.categoryId', 'categoryId')
      .addSelect('COUNT(ticket.id)', 'totalTickets')
      .addSelect(
        'AVG(CASE WHEN ticket.completedAt IS NOT NULL AND ticket.createdAt IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, ticket.createdAt, ticket.completedAt) ELSE NULL END)',
        'avgTotalTime',
      )
      .groupBy('ticket.categoryId');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();

    // Enrich with category details
    const categoryIds = results.map((r) => r.categoryId);
    const categories = await this.categoryRepository.find({
      where: { id: In(categoryIds) },
    });

    return results.map((r) => {
      const category = categories.find((c) => c.id === r.categoryId);
      return {
        categoryId: r.categoryId,
        categoryName: category ? category.name : 'Unknown',
        totalTickets: parseInt(r.totalTickets),
        avgTotalTime: r.avgTotalTime
          ? Math.round(parseFloat(r.avgTotalTime))
          : 0,
      };
    });
  }

  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<any> {
    const [avgWaitTime, avgServiceTime, peakHours, abandonmentRate, agentPerformance, categoryStats] =
      await Promise.all([
        this.getAverageWaitTime(startDate, endDate),
        this.getAverageServiceTime(startDate, endDate),
        this.getPeakHours(startDate, endDate),
        this.getAbandonmentRate(startDate, endDate),
        this.getAgentPerformance(startDate, endDate),
        this.getCategoryStats(startDate, endDate),
      ]);

    return {
      avgWaitTime,
      avgServiceTime,
      peakHours,
      abandonmentRate,
      agentPerformance,
      categoryStats,
    };
  }
}

