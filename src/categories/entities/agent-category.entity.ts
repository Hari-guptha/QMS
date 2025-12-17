import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { booleanTransformer } from '../../encryption/transformers';

@Entity('agent_categories')
export class AgentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uniqueidentifier' })
  agentId: string;

  @Column({ type: 'uniqueidentifier' })
  categoryId: string;

  @ManyToOne(() => User, (user) => user.agentCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @ManyToOne(() => Category, (category) => category.agentCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'bit', default: true, transformer: booleanTransformer })
  isActive: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  assignedAt: Date;
}

