import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { Ticket } from '../queue/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}

