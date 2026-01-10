import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketStatus } from '../common/enums';
import { EncryptionService } from '../encryption/encryption.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) { }

  private decryptUser(user: any) {
    if (!user) return user;
    if (user.phone) user.phone = this.encryptionService.decrypt(user.phone);
    if (user.firstName) user.firstName = this.encryptionService.decrypt(user.firstName);
    if (user.lastName) user.lastName = this.encryptionService.decrypt(user.lastName);
    return user;
  }

  async getAverageWaitTime(startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = {
      status: TicketStatus.COMPLETED,
      calledAt: { not: null },
      servingStartedAt: { not: null },
    };

    if (startDate && endDate) {
      where.completedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      select: {
        calledAt: true,
        servingStartedAt: true,
      },
    });

    if (tickets.length === 0) return 0;

    const totalWaitTime = tickets.reduce((sum, ticket) => {
      if (!ticket.servingStartedAt || !ticket.calledAt) return sum;
      return sum + (ticket.servingStartedAt.getTime() - ticket.calledAt.getTime());
    }, 0);

    return Math.round(totalWaitTime / tickets.length / 1000 / 60);
  }

  async getAverageServiceTime(startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = {
      status: TicketStatus.COMPLETED,
      servingStartedAt: { not: null },
      completedAt: { not: null },
    };

    if (startDate && endDate) {
      where.completedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      select: {
        servingStartedAt: true,
        completedAt: true,
      },
    });

    if (tickets.length === 0) return 0;

    const totalServiceTime = tickets.reduce((sum, ticket) => {
      if (!ticket.completedAt || !ticket.servingStartedAt) return sum;
      return sum + (ticket.completedAt.getTime() - ticket.servingStartedAt.getTime());
    }, 0);

    return Math.round(totalServiceTime / tickets.length / 1000 / 60);
  }

  async getPeakHours(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate ? startDate.toISOString() : '1970-01-01';
    const end = endDate ? endDate.toISOString() : '9999-12-31';

    const results: any[] = await this.prisma.$queryRaw`
      SELECT DATEPART(HOUR, createdAt) as hour, COUNT(id) as count
      FROM tickets
      WHERE createdAt BETWEEN ${start} AND ${end}
      GROUP BY DATEPART(HOUR, createdAt)
      ORDER BY count DESC
    `;

    return results.map((r) => ({
      hour: parseInt(r.hour),
      count: parseInt(r.count),
    }));
  }

  async getAbandonmentRate(startDate?: Date, endDate?: Date): Promise<number> {
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const allTickets = await this.prisma.ticket.findMany({
      where,
      select: { status: true },
    });

    if (allTickets.length === 0) return 0;

    const holdTickets = allTickets.filter((t) => t.status === TicketStatus.HOLD);
    return (holdTickets.length / allTickets.length) * 100;
  }

  async getAgentPerformance(startDate?: Date, endDate?: Date): Promise<any[]> {
    const start = startDate ? startDate.toISOString() : '1970-01-01';
    const end = endDate ? endDate.toISOString() : '9999-12-31';

    const results: any[] = await this.prisma.$queryRaw`
      SELECT 
        agentId,
        COUNT(id) as totalTickets,
        SUM(CASE WHEN status = ${TicketStatus.COMPLETED} THEN 1 ELSE 0 END) as completedTickets,
        AVG(CASE WHEN completedAt IS NOT NULL AND servingStartedAt IS NOT NULL THEN DATEDIFF(MINUTE, servingStartedAt, completedAt) ELSE NULL END) as avgServiceTime
      FROM tickets
      WHERE agentId IS NOT NULL AND createdAt BETWEEN ${start} AND ${end}
      GROUP BY agentId
      ORDER BY completedTickets DESC
    `;

    const agentIds = results.map((r) => r.agentId);
    const rawAgents = await this.prisma.user.findMany({
      where: { id: { in: agentIds } },
    });
    const agents = rawAgents.map(a => this.decryptUser(a));

    return results.map((r) => {
      const agent = agents.find((a) => a.id === r.agentId);
      return {
        agentId: r.agentId,
        agentName: agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown',
        agentEmail: agent?.email || '',
        employeeId: agent?.employeeId || '',
        totalTickets: parseInt(r.totalTickets),
        completedTickets: parseInt(r.completedTickets),
        avgServiceTime: r.avgServiceTime ? Math.round(parseFloat(r.avgServiceTime)) : 0,
        completionRate: r.totalTickets > 0 ? (parseInt(r.completedTickets) / parseInt(r.totalTickets)) * 100 : 0,
      };
    });
  }

  async getCategoryStats(startDate?: Date, endDate?: Date): Promise<any[]> {
    const start = startDate ? startDate.toISOString() : '1970-01-01';
    const end = endDate ? endDate.toISOString() : '9999-12-31';

    const results: any[] = await this.prisma.$queryRaw`
      SELECT 
        categoryId,
        COUNT(id) as totalTickets,
        AVG(CASE WHEN completedAt IS NOT NULL AND createdAt IS NOT NULL THEN DATEDIFF(MINUTE, createdAt, completedAt) ELSE NULL END) as avgTotalTime
      FROM tickets
      WHERE createdAt BETWEEN ${start} AND ${end}
      GROUP BY categoryId
    `;

    const categoryIds = results.map((r) => r.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    return results.map((r) => {
      const category = categories.find((c) => c.id === r.categoryId);
      return {
        categoryId: r.categoryId,
        categoryName: category ? category.name : 'Unknown',
        totalTickets: parseInt(r.totalTickets),
        avgTotalTime: r.avgTotalTime ? Math.round(parseFloat(r.avgTotalTime)) : 0,
      };
    });
  }

  async getTicketCounts(startDate?: Date, endDate?: Date): Promise<any> {
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const counts = await this.prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const result = {
      total: 0,
      pending: 0,
      serving: 0,
      hold: 0,
      completed: 0,
      cancelled: 0,
    };

    counts.forEach((c) => {
      const count = c._count.id;
      result.total += count;
      if (c.status === TicketStatus.PENDING) result.pending = count;
      if (c.status === TicketStatus.SERVING) result.serving = count;
      if (c.status === TicketStatus.HOLD) result.hold = count;
      if (c.status === TicketStatus.COMPLETED) result.completed = count;
      if (c.status === TicketStatus.CANCELLED) result.cancelled = count;
    });

    return result;
  }

  async getServicePerformance(startDate?: Date, endDate?: Date): Promise<any[]> {
    const start = startDate ? startDate.toISOString() : '1970-01-01';
    const end = endDate ? endDate.toISOString() : '9999-12-31';

    const results: any[] = await this.prisma.$queryRaw`
      SELECT 
        categoryId,
        COUNT(id) as totalTickets,
        SUM(CASE WHEN status = ${TicketStatus.PENDING} THEN 1 ELSE 0 END) as pendingTickets,
        SUM(CASE WHEN status = ${TicketStatus.SERVING} THEN 1 ELSE 0 END) as servingTickets,
        SUM(CASE WHEN status = ${TicketStatus.HOLD} THEN 1 ELSE 0 END) as holdTickets,
        SUM(CASE WHEN status = ${TicketStatus.COMPLETED} THEN 1 ELSE 0 END) as completedTickets,
        AVG(CASE WHEN completedAt IS NOT NULL AND createdAt IS NOT NULL THEN DATEDIFF(MINUTE, createdAt, completedAt) ELSE NULL END) as avgTotalTime,
        AVG(CASE WHEN completedAt IS NOT NULL AND servingStartedAt IS NOT NULL THEN DATEDIFF(MINUTE, servingStartedAt, completedAt) ELSE NULL END) as avgServiceTime
      FROM tickets
      WHERE createdAt BETWEEN ${start} AND ${end}
      GROUP BY categoryId
    `;

    const categoryIds = results.map((r) => r.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
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
        completionRate: parseInt(r.totalTickets) > 0 ? (parseInt(r.completedTickets) / parseInt(r.totalTickets)) * 100 : 0,
      };
    });
  }

  async getDetailedAgentPerformance(startDate?: Date, endDate?: Date, categoryId?: string): Promise<any[]> {
    const where: any = { agentId: { not: null } };
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const allTickets = await this.prisma.ticket.findMany({
      where,
      include: { category: true },
    });

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

      if (ticket.status === TicketStatus.PENDING) agentData.pendingTickets++;
      if (ticket.status === TicketStatus.SERVING) agentData.servingTickets++;
      if (ticket.status === TicketStatus.HOLD) agentData.holdTickets++;
      if (ticket.status === TicketStatus.COMPLETED) agentData.completedTickets++;

      if (ticket.calledAt && ticket.createdAt) {
        agentData.waitTimes.push(Math.round((ticket.calledAt.getTime() - ticket.createdAt.getTime()) / 60000));
      }
      if (ticket.servingStartedAt && ticket.calledAt) {
        agentData.calledToServingTimes.push(Math.round((ticket.servingStartedAt.getTime() - ticket.calledAt.getTime()) / 60000));
      }
      if (ticket.completedAt && ticket.servingStartedAt) {
        agentData.serviceTimes.push(Math.round((ticket.completedAt.getTime() - ticket.servingStartedAt.getTime()) / 60000));
      }
      if (ticket.completedAt && ticket.createdAt) {
        agentData.totalTimes.push(Math.round((ticket.completedAt.getTime() - ticket.createdAt.getTime()) / 60000));
      }

      if (ticket.category) {
        const existingService = agentData.serviceBreakdown.find((s: any) => s.categoryId === ticket.categoryId);
        if (existingService) {
          existingService.totalTickets++;
          if (ticket.status === TicketStatus.COMPLETED) existingService.completedTickets++;
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

    const agentIds = Array.from(agentMap.keys());
    const rawAgents = await this.prisma.user.findMany({
      where: { id: { in: agentIds } },
    });
    const agents = rawAgents.map(a => this.decryptUser(a));

    return Array.from(agentMap.entries()).map(([agentId, agentData]) => {
      const agent = agents.find((a) => a.id === agentId);
      return {
        agentId,
        agentName: agent ? `${agent.firstName} ${agent.lastName}` : 'Unknown',
        agentEmail: agent?.email || '',
        employeeId: agent?.employeeId || '',
        totalTickets: agentData.totalTickets,
        pendingTickets: agentData.pendingTickets,
        servingTickets: agentData.servingTickets,
        holdTickets: agentData.holdTickets,
        completedTickets: agentData.completedTickets,
        avgWaitTime: agentData.waitTimes.length > 0 ? Math.round(agentData.waitTimes.reduce((a: any, b: any) => a + b, 0) / agentData.waitTimes.length) : 0,
        avgCalledToServingTime: agentData.calledToServingTimes.length > 0 ? Math.round(agentData.calledToServingTimes.reduce((a: any, b: any) => a + b, 0) / agentData.calledToServingTimes.length) : 0,
        avgServiceTime: agentData.serviceTimes.length > 0 ? Math.round(agentData.serviceTimes.reduce((a: any, b: any) => a + b, 0) / agentData.serviceTimes.length) : 0,
        avgTotalTime: agentData.totalTimes.length > 0 ? Math.round(agentData.totalTimes.reduce((a: any, b: any) => a + b, 0) / agentData.totalTimes.length) : 0,
        completionRate: agentData.totalTickets > 0 ? (agentData.completedTickets / agentData.totalTickets) * 100 : 0,
        serviceBreakdown: agentData.serviceBreakdown,
      };
    });
  }

  async getDailyTicketTrends(startDate?: Date, endDate?: Date): Promise<any[]> {
    let finalStart = startDate;
    let finalEnd = endDate;

    if (!finalStart || !finalEnd) {
      finalEnd = new Date();
      finalStart = new Date();
      finalStart.setDate(finalStart.getDate() - 30);
    }

    const startStr = finalStart.toISOString();
    const endStr = finalEnd.toISOString();

    const results: any[] = await this.prisma.$queryRaw`
      SELECT 
        CAST(createdAt AS DATE) as date,
        COUNT(id) as count,
        SUM(CASE WHEN status = ${TicketStatus.COMPLETED} THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = ${TicketStatus.PENDING} THEN 1 ELSE 0 END) as pending
      FROM tickets
      WHERE createdAt BETWEEN ${startStr} AND ${endStr}
      GROUP BY CAST(createdAt AS DATE)
      ORDER BY date ASC
    `;

    return results.map((r) => ({
      date: r.date,
      total: parseInt(r.count),
      completed: parseInt(r.completed),
      pending: parseInt(r.pending),
    }));
  }

  async getHourlyDistribution(startDate?: Date, endDate?: Date): Promise<any[]> {
    const start = startDate ? startDate.toISOString() : '1970-01-01';
    const end = endDate ? endDate.toISOString() : '9999-12-31';

    const results: any[] = await this.prisma.$queryRaw`
      SELECT DATEPART(HOUR, createdAt) as hour, COUNT(id) as count
      FROM tickets
      WHERE createdAt BETWEEN ${start} AND ${end}
      GROUP BY DATEPART(HOUR, createdAt)
      ORDER BY hour ASC
    `;

    return Array.from({ length: 24 }, (_, hour) => {
      const hourData = results.find((r) => parseInt(r.hour) === hour);
      return {
        hour,
        count: hourData ? parseInt(hourData.count) : 0,
      };
    });
  }

  async getDayOfWeekDistribution(startDate?: Date, endDate?: Date): Promise<any[]> {
    const start = startDate ? startDate.toISOString() : '1970-01-01';
    const end = endDate ? endDate.toISOString() : '9999-12-31';

    const results: any[] = await this.prisma.$queryRaw`
      SELECT DATEPART(WEEKDAY, createdAt) as dayOfWeek, COUNT(id) as count
      FROM tickets
      WHERE createdAt BETWEEN ${start} AND ${end}
      GROUP BY DATEPART(WEEKDAY, createdAt)
      ORDER BY dayOfWeek ASC
    `;

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
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const counts = await this.prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const statusCounts: Record<string, number> = {
      [TicketStatus.PENDING]: 0,
      [TicketStatus.SERVING]: 0,
      [TicketStatus.COMPLETED]: 0,
      [TicketStatus.HOLD]: 0,
      [TicketStatus.CANCELLED]: 0,
    };

    counts.forEach((c) => {
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status] = c._count.id;
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

