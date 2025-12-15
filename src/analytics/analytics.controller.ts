import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import * as ExcelJS from 'exceljs';

@ApiTags('admin')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  async getDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getDashboardStats(start, end);
  }

  @Get('avg-wait-time')
  @ApiOperation({ summary: 'Get average wait time (Admin only)' })
  async getAvgWaitTime(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return {
      avgWaitTime: await this.analyticsService.getAverageWaitTime(start, end),
    };
  }

  @Get('avg-service-time')
  @ApiOperation({ summary: 'Get average service time (Admin only)' })
  async getAvgServiceTime(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return {
      avgServiceTime: await this.analyticsService.getAverageServiceTime(
        start,
        end,
      ),
    };
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Get peak hours heatmap (Admin only)' })
  async getPeakHours(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getPeakHours(start, end);
  }

  @Get('abandonment-rate')
  @ApiOperation({ summary: 'Get abandonment rate (Admin only)' })
  async getAbandonmentRate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return {
      abandonmentRate: await this.analyticsService.getAbandonmentRate(
        start,
        end,
      ),
    };
  }

  @Get('agent-performance')
  @ApiOperation({ summary: 'Get agent performance ranking (Admin only)' })
  async getAgentPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getAgentPerformance(start, end);
  }

  @Get('category-stats')
  @ApiOperation({ summary: 'Get category statistics (Admin only)' })
  async getCategoryStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getCategoryStats(start, end);
  }

  @Get('detailed-agent-performance')
  @ApiOperation({ summary: 'Get detailed agent performance with all metrics (Admin only)' })
  async getDetailedAgentPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getDetailedAgentPerformance(start, end, categoryId);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export analytics to Excel (Admin only)' })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=analytics.xlsx')
  async exportExcel(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.analyticsService.getDashboardStats(start, end);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analytics');

    // Add data
    worksheet.addRow(['Metric', 'Value']);
    worksheet.addRow(['Average Wait Time (minutes)', stats.avgWaitTime]);
    worksheet.addRow(['Average Service Time (minutes)', stats.avgServiceTime]);
    worksheet.addRow(['Abandonment Rate (%)', stats.abandonmentRate]);
    worksheet.addRow([]);
    worksheet.addRow(['Agent Performance']);
    worksheet.addRow(['Agent Name', 'Total Tickets', 'Completed', 'Avg Service Time', 'Completion Rate']);
    stats.agentPerformance.forEach((agent) => {
      worksheet.addRow([
        agent.agentName,
        agent.totalTickets,
        agent.completedTickets,
        agent.avgServiceTime,
        `${agent.completionRate.toFixed(2)}%`,
      ]);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);
  }
}

