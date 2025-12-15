import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AgentCategory } from './agent-category.entity';
import { Ticket } from '../../queue/entities/ticket.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  estimatedWaitTime: number; // in minutes

  @OneToMany(() => AgentCategory, (agentCategory) => agentCategory.category)
  agentCategories: AgentCategory[];

  @OneToMany(() => Ticket, (ticket) => ticket.category)
  tickets: Ticket[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

