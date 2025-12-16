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
      .select('DATEPART(HOUR, ticket.createdAt)', 'hour')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('DATEPART(HOUR, ticket.createdAt)')
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
        'AVG(CASE WHEN ticket.completedAt IS NOT NULL AND ticket.servingStartedAt IS NOT NULL THEN DATEDIFF(MINUTE, ticket.servingStartedAt, ticket.completedAt) ELSE NULL END)',
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
        'AVG(CASE WHEN ticket.completedAt IS NOT NULL AND ticket.createdAt IS NOT NULL THEN DATEDIFF(MINUTE, ticket.createdAt, ticket.completedAt) ELSE NULL END)',
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

  async getTicketCounts(startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.ticketRepository.createQueryBuilder('ticket');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const allTickets = await query.getMany();

    return {
      total: allTickets.length,
      pending: allTickets.filter((t) => t.status === TicketStatus.PENDING).length,
      serving: allTickets.filter((t) => t.status === TicketStatus.SERVING).length,
      hold: allTickets.filter((t) => t.status === TicketStatus.HOLD).length,
      completed: allTickets.filter((t) => t.status === TicketStatus.COMPLETED).length,
      noShow: allTickets.filter((t) => t.status === TicketStatus.NO_SHOW).length,
      cancelled: allTickets.filter((t) => t.status === TicketStatus.CANCELLED).length,
    };
  }

  async getServicePerformance(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.category', 'category')
      .select('ticket.categoryId', 'categoryId')
      .addSelect('COUNT(ticket.id)', 'totalTickets')
      .addSelect(
        'SUM(CASE WHEN ticket.status = :pending THEN 1 ELSE 0 END)',
        'pendingTickets',
      )
      .addSelect(
        'SUM(CASE WHEN ticket.status = :serving THEN 1 ELSE 0 END)',
        'servingTickets',
      )
      .addSelect(
        'SUM(CASE WHEN ticket.status = :hold THEN 1 ELSE 0 END)',
        'holdTickets',
      )
      .addSelect(
        'SUM(CASE WHEN ticket.status = :completed THEN 1 ELSE 0 END)',
        'completedTickets',
      )
      .addSelect(
        'AVG(CASE WHEN ticket.completedAt IS NOT NULL AND ticket.createdAt IS NOT NULL THEN DATEDIFF(MINUTE, ticket.createdAt, ticket.completedAt) ELSE NULL END)',
        'avgTotalTime',
      )
      .addSelect(
        'AVG(CASE WHEN ticket.completedAt IS NOT NULL AND ticket.servingStartedAt IS NOT NULL THEN DATEDIFF(MINUTE, ticket.servingStartedAt, ticket.completedAt) ELSE NULL END)',
        'avgServiceTime',
      )
      .setParameter('pending', TicketStatus.PENDING)
      .setParameter('serving', TicketStatus.SERVING)
      .setParameter('hold', TicketStatus.HOLD)
      .setParameter('completed', TicketStatus.COMPLETED)
      .groupBy('ticket.categoryId');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();

    const categoryIds = results.map((r) => r.categoryId);
    const categories = await this.categoryRepository.find({
      where: { id: In(categoryIds) },
    });

    return results.map((r) => {
      const category = categories.find((c) => c.id === r.categoryId);
      return {
        categoryId: r.categoryId,
        categoryName: category ? category.name : 'Unknown',
        totalTickets: parseInt(r.totalTickets) || 0,
        pendingTickets: parseInt(r.pendingTickets) || 0,
        servingTickets: parseInt(r.servingTickets) || 0,
        holdTickets: parseInt(r.holdTickets) || 0,
        completedTickets: parseInt(r.completedTickets) || 0,
        avgTotalTime: r.avgTotalTime ? Math.round(parseFloat(r.avgTotalTime)) : 0,
        avgServiceTime: r.avgServiceTime ? Math.round(parseFloat(r.avgServiceTime)) : 0,
        completionRate:
          parseInt(r.totalTickets) > 0
            ? (parseInt(r.completedTickets) / parseInt(r.totalTickets)) * 100
            : 0,
      };
    });
  }

  async getDetailedAgentPerformance(
    startDate?: Date,
    endDate?: Date,
    categoryId?: string,
  ): Promise<any[]> {
    // First, get all tickets for the agents
    const ticketQuery = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.category', 'category')
      .where('ticket.agentId IS NOT NULL');

    if (startDate && endDate) {
      ticketQuery.andWhere('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (categoryId) {
      ticketQuery.andWhere('ticket.categoryId = :categoryId', { categoryId });
    }

    const allTickets = await ticketQuery.getMany();

    // Group tickets by agent
    const agentMap = new Map<string, any>();

    allTickets.forEach((ticket) => {
      if (!ticket.agentId) return;

      if (!agentMap.has(ticket.agentId)) {
        agentMap.set(ticket.agentId, {
          agentId: ticket.agentId,
          totalTickets: 0,
          pendingTickets: 0,
          servingTickets: 0,
          holdTickets: 0,
          completedTickets: 0,
          waitTimes: [] as number[],
          calledToServingTimes: [] as number[],
          serviceTimes: [] as number[],
          totalTimes: [] as number[],
          serviceBreakdown: [] as any[],
        });
      }

      const agentData = agentMap.get(ticket.agentId)!;
      agentData.totalTickets++;

      // Count by status
      if (ticket.status === TicketStatus.PENDING) agentData.pendingTickets++;
      if (ticket.status === TicketStatus.SERVING) agentData.servingTickets++;
      if (ticket.status === TicketStatus.HOLD) agentData.holdTickets++;
      if (ticket.status === TicketStatus.COMPLETED) agentData.completedTickets++;

      // Calculate times
      if (ticket.calledAt && ticket.createdAt) {
        const waitTime = Math.round(
          (new Date(ticket.calledAt).getTime() - new Date(ticket.createdAt).getTime()) / 60000
        );
        agentData.waitTimes.push(waitTime);
      }

      if (ticket.servingStartedAt && ticket.calledAt) {
        const calledToServing = Math.round(
          (new Date(ticket.servingStartedAt).getTime() - new Date(ticket.calledAt).getTime()) / 60000
        );
        agentData.calledToServingTimes.push(calledToServing);
      }

      if (ticket.completedAt && ticket.servingStartedAt) {
        const serviceTime = Math.round(
          (new Date(ticket.completedAt).getTime() - new Date(ticket.servingStartedAt).getTime()) / 60000
        );
        agentData.serviceTimes.push(serviceTime);
      }

      if (ticket.completedAt && ticket.createdAt) {
        const totalTime = Math.round(
          (new Date(ticket.completedAt).getTime() - new Date(ticket.createdAt).getTime()) / 60000
        );
        agentData.totalTimes.push(totalTime);
      }

      // Service breakdown
      if (ticket.category) {
        const existingService = agentData.serviceBreakdown.find(
          (s: any) => s.categoryId === ticket.categoryId
        );
        if (existingService) {
          existingService.totalTickets++;
          if (ticket.status === TicketStatus.COMPLETED) {
            existingService.completedTickets++;
          }
        } else {
          agentData.serviceBreakdown.push({
            categoryId: ticket.categoryId,
            categoryName: ticket.category.name,
            totalTickets: 1,
            completedTickets: ticket.status === TicketStatus.COMPLETED ? 1 : 0,
          });
        }
      }
    });

    // Get agent details
    const agentIds = Array.from(agentMap.keys());
    const agents = await this.userRepository.find({
      where: { id: In(agentIds) },
    });

    // Calculate averages and enrich with agent info
    return Array.from(agentMap.entries()).map(([agentId, agentData]: [string, any]) => {
      const agent = agents.find((a) => a.id === agentId);
      
      return {
        agentId,
        agentName: agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown',
        agentEmail: agent?.email || '',
        totalTickets: agentData.totalTickets,
        pendingTickets: agentData.pendingTickets,
        servingTickets: agentData.servingTickets,
        holdTickets: agentData.holdTickets,
        completedTickets: agentData.completedTickets,
        avgWaitTime:
          agentData.waitTimes.length > 0
            ? Math.round(
                agentData.waitTimes.reduce((a: number, b: number) => a + b, 0) /
                  agentData.waitTimes.length
              )
            : 0,
        avgCalledToServingTime:
          agentData.calledToServingTimes.length > 0
            ? Math.round(
                agentData.calledToServingTimes.reduce((a: number, b: number) => a + b, 0) /
                  agentData.calledToServingTimes.length
              )
            : 0,
        avgServiceTime:
          agentData.serviceTimes.length > 0
            ? Math.round(
                agentData.serviceTimes.reduce((a: number, b: number) => a + b, 0) /
                  agentData.serviceTimes.length
              )
            : 0,
        avgTotalTime:
          agentData.totalTimes.length > 0
            ? Math.round(
                agentData.totalTimes.reduce((a: number, b: number) => a + b, 0) /
                  agentData.totalTimes.length
              )
            : 0,
        completionRate:
          agentData.totalTickets > 0
            ? (agentData.completedTickets / agentData.totalTickets) * 100
            : 0,
        serviceBreakdown: agentData.serviceBreakdown,
      };
    });
  }

  async getDailyTicketTrends(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('CAST(ticket.createdAt AS DATE)', 'date')
      .addSelect('COUNT(ticket.id)', 'count')
      .addSelect(
        'SUM(CASE WHEN ticket.status = :completed THEN 1 ELSE 0 END)',
        'completed',
      )
      .addSelect(
        'SUM(CASE WHEN ticket.status = :pending THEN 1 ELSE 0 END)',
        'pending',
      )
      .setParameter('completed', TicketStatus.COMPLETED)
      .setParameter('pending', TicketStatus.PENDING)
      .groupBy('CAST(ticket.createdAt AS DATE)')
      .orderBy('CAST(ticket.createdAt AS DATE)', 'ASC');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else {
      // Default to last 30 days
      const defaultEnd = new Date();
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate: defaultStart,
        endDate: defaultEnd,
      });
    }

    const results = await query.getRawMany();
    return results.map((r) => ({
      date: r.date,
      total: parseInt(r.count),
      completed: parseInt(r.completed),
      pending: parseInt(r.pending),
    }));
  }

  async getHourlyDistribution(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('DATEPART(HOUR, ticket.createdAt)', 'hour')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('DATEPART(HOUR, ticket.createdAt)')
      .orderBy('DATEPART(HOUR, ticket.createdAt)', 'ASC');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();
    return Array.from({ length: 24 }, (_, hour) => {
      const hourData = results.find((r) => parseInt(r.hour) === hour);
      return {
        hour,
        count: hourData ? parseInt(hourData.count) : 0,
      };
    });
  }

  async getDayOfWeekDistribution(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .select('DATEPART(WEEKDAY, ticket.createdAt)', 'dayOfWeek')
      .addSelect('COUNT(ticket.id)', 'count')
      .groupBy('DATEPART(WEEKDAY, ticket.createdAt)')
      .orderBy('DATEPART(WEEKDAY, ticket.createdAt)', 'ASC');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const results = await query.getRawMany();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Array.from({ length: 7 }, (_, index) => {
      const dayData = results.find((r) => parseInt(r.dayOfWeek) === index + 1);
      return {
        day: dayNames[index],
        dayIndex: index,
        count: dayData ? parseInt(dayData.count) : 0,
      };
    });
  }

  async getStatusDistribution(startDate?: Date, endDate?: Date): Promise<any[]> {
    const query = this.ticketRepository.createQueryBuilder('ticket');

    if (startDate && endDate) {
      query.where('ticket.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const allTickets = await query.getMany();
    const statusCounts = {
      [TicketStatus.PENDING]: 0,
      [TicketStatus.SERVING]: 0,
      [TicketStatus.COMPLETED]: 0,
      [TicketStatus.HOLD]: 0,
      [TicketStatus.NO_SHOW]: 0,
      [TicketStatus.CANCELLED]: 0,
    };

    allTickets.forEach((ticket) => {
      if (statusCounts[ticket.status] !== undefined) {
        statusCounts[ticket.status]++;
      }
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        label: status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '),
        value: count,
        status,
      }));
  }

  async getDashboardStats(startDate?: Date, endDate?: Date): Promise<any> {
    const [
      avgWaitTime,
      avgServiceTime,
      peakHours,
      abandonmentRate,
      agentPerformance,
      categoryStats,
      ticketCounts,
      servicePerformance,
      dailyTrends,
      hourlyDistribution,
      dayOfWeekDistribution,
      statusDistribution,
    ] = await Promise.all([
      this.getAverageWaitTime(startDate, endDate),
      this.getAverageServiceTime(startDate, endDate),
      this.getPeakHours(startDate, endDate),
      this.getAbandonmentRate(startDate, endDate),
      this.getAgentPerformance(startDate, endDate),
      this.getCategoryStats(startDate, endDate),
      this.getTicketCounts(startDate, endDate),
      this.getServicePerformance(startDate, endDate),
      this.getDailyTicketTrends(startDate, endDate),
      this.getHourlyDistribution(startDate, endDate),
      this.getDayOfWeekDistribution(startDate, endDate),
      this.getStatusDistribution(startDate, endDate),
    ]);

    return {
      avgWaitTime,
      avgServiceTime,
      peakHours,
      abandonmentRate,
      agentPerformance,
      categoryStats,
      ticketCounts,
      servicePerformance,
      dailyTrends,
      hourlyDistribution,
      dayOfWeekDistribution,
      statusDistribution,
    };
  }
}

