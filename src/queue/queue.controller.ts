import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../common/enums';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('public', 'agent', 'admin')
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) { }

  // Public endpoints
  @Post('check-in')
  @Public()
  @ApiTags('public')
  @ApiOperation({ summary: 'Customer check-in - Create ticket (Public)' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  async checkIn(@Body() createTicketDto: CreateTicketDto) {
    return this.queueService.createTicket(createTicketDto);
  }

  @Get('status')
  @Public()
  @ApiTags('public')
  @ApiOperation({ summary: 'Get public status page (Public)' })
  async getPublicStatus(@Query('categoryId') categoryId?: string) {
    return this.queueService.getPublicStatus(categoryId);
  }

  @Get('ticket/:tokenNumber')
  @Public()
  @ApiTags('public')
  @ApiOperation({ summary: 'Get ticket by token number (Public)' })
  async getTicketByToken(@Param('tokenNumber') tokenNumber: string) {
    return this.queueService.getTicketByToken(tokenNumber);
  }

  // Agent endpoints
  @Get('agent/my-queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiTags('agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my queue (Agent only)' })
  async getMyQueue(@GetUser() user: User) {
    return this.queueService.getAgentQueue(user.id);
  }

  @Post('agent/call-next')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiTags('agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Call next ticket (Agent only)' })
  async callNext(@GetUser() user: User) {
    return this.queueService.callNext(user.id);
  }

  @Patch('agent/:ticketId/serving')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiTags('agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark ticket as serving (Agent only)' })
  async markAsServing(
    @Param('ticketId') ticketId: string,
    @GetUser() user: User,
  ) {
    return this.queueService.markAsServing(ticketId, user.id);
  }

  @Patch('agent/:ticketId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiTags('agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark ticket as completed (Agent only)' })
  async markAsCompleted(
    @Param('ticketId') ticketId: string,
    @GetUser() user: User,
  ) {
    return this.queueService.markAsCompleted(ticketId, user.id);
  }

  @Patch('agent/:ticketId/no-show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiTags('agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark ticket as no-show (Agent only)' })
  async markAsNoShow(
    @Param('ticketId') ticketId: string,
    @GetUser() user: User,
  ) {
    return this.queueService.markAsNoShow(ticketId, user.id);
  }

  @Put('agent/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiTags('agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder my queue (Agent only)' })
  async reorderQueue(
    @Body() body: { ticketIds: string[] },
    @GetUser() user: User,
  ) {
    return this.queueService.reorderQueue(user.id, body.ticketIds);
  }

  @Post('agent/:ticketId/transfer/:newAgentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiTags('agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer ticket to another agent (Agent only)' })
  async transferTicket(
    @Param('ticketId') ticketId: string,
    @Param('newAgentId') newAgentId: string,
    @GetUser() user: User,
  ) {
    return this.queueService.transferTicket(ticketId, newAgentId, user.id);
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all queues (Admin only)' })
  async getAllQueues(
    @Query('categoryId') categoryId?: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.queueService.getAllQueues(categoryId, agentId);
  }

  @Get('admin/ticket/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket by ID (Admin only)' })
  async getTicketById(@Param('id') id: string) {
    return this.queueService.getTicketById(id);
  }

  @Put('admin/reorder/:agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder any agent queue (Admin only)' })
  async adminReorderQueue(
    @Param('agentId') agentId: string,
    @Body() body: { ticketIds: string[] },
  ) {
    return this.queueService.reorderQueue(agentId, body.ticketIds);
  }

  @Post('admin/call-next/:agentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Call next ticket for any agent (Admin only)' })
  async adminCallNext(@Param('agentId') agentId: string) {
    return this.queueService.adminCallNext(agentId);
  }

  @Patch('admin/:ticketId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark any ticket as completed (Admin only)' })
  async adminMarkAsCompleted(@Param('ticketId') ticketId: string) {
    return this.queueService.adminMarkAsCompleted(ticketId);
  }

  @Patch('admin/:ticketId/serving')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark any ticket as serving (Admin only)' })
  async adminMarkAsServing(@Param('ticketId') ticketId: string) {
    return this.queueService.adminMarkAsServing(ticketId);
  }

  @Patch('admin/:ticketId/no-show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark any ticket as no-show (Admin only)' })
  async adminMarkAsNoShow(@Param('ticketId') ticketId: string) {
    return this.queueService.adminMarkAsNoShow(ticketId);
  }

  @Patch('agent/:ticketId/reopen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @ApiTags('agent')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reopen ticket (Agent only - own tickets)' })
  async reopenTicket(
    @Param('ticketId') ticketId: string,
    @GetUser() user: User,
  ) {
    return this.queueService.reopenTicket(ticketId, user.id);
  }

  @Delete('admin/:ticketId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete any ticket from queue (Admin only)' })
  async deleteTicket(@Param('ticketId') ticketId: string) {
    await this.queueService.deleteTicket(ticketId);
    return { message: 'Ticket deleted successfully' };
  }

  @Patch('admin/:ticketId/reassign/:newAgentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reassign ticket to another agent (Admin only)' })
  async adminReassignTicket(
    @Param('ticketId') ticketId: string,
    @Param('newAgentId') newAgentId: string,
  ) {
    return this.queueService.adminReassignTicket(ticketId, newAgentId);
  }

  @Patch('admin/:ticketId/reopen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reopen any ticket (Admin only)' })
  async adminReopenTicket(@Param('ticketId') ticketId: string) {
    return this.queueService.adminReopenTicket(ticketId);
  }

  @Put('admin/:ticketId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket information (Admin only)' })
  async adminUpdateTicket(
    @Param('ticketId') ticketId: string,
    @Body() updateData: {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      formData?: Record<string, any>;
    },
  ) {
    return this.queueService.adminUpdateTicket(ticketId, updateData);
  }

  @Patch('admin/:ticketId/override')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiTags('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin override - Update any ticket (Admin only)' })
  async adminOverride(
    @Param('ticketId') ticketId: string,
    @Body() updateData: any,
  ) {
    // Admin can override any ticket status or data
    return this.queueService.adminUpdateTicket(ticketId, updateData);
  }
}

