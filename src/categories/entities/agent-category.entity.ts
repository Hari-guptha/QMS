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

@Entity('agent_categories')
export class AgentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  agentId: string;

  @Column()
  categoryId: string;

  @ManyToOne(() => User, (user) => user.agentCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @ManyToOne(() => Category, (category) => category.agentCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  assignedAt: Date;
}

