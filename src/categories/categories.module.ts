import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { AgentCategory } from './entities/agent-category.entity';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../queue/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, AgentCategory, User, Ticket])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

