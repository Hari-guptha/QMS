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
import { booleanTransformer } from '../../encryption/transformers';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'bit', default: true, transformer: booleanTransformer })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  estimatedWaitTime: number; // in minutes

  @OneToMany(() => AgentCategory, (agentCategory) => agentCategory.category)
  agentCategories: AgentCategory[];

  @OneToMany(() => Ticket, (ticket) => ticket.category)
  tickets: Ticket[];

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;
}

