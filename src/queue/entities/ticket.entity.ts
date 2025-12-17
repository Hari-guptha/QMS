import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { encryptTransformer, encryptObjectTransformer } from '../../encryption/transformers';

export enum TicketStatus {
  PENDING = 'pending',
  CALLED = 'called',
  SERVING = 'serving',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  HOLD = 'hold',
  CANCELLED = 'cancelled',
}

@Entity('tickets')
@Index(['agentId', 'status', 'createdAt'])
@Index(['categoryId', 'status', 'createdAt'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 50, unique: true })
  tokenNumber: string; // Format: CATEGORY_CODE-001, CATEGORY_CODE-002, etc.

  @Column({ type: 'uniqueidentifier' })
  categoryId: string;

  @Column({ type: 'uniqueidentifier', nullable: true })
  agentId: string; // Assigned agent

  @Column({
    type: 'varchar',
    length: 20,
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;

  @Column({ type: 'nvarchar', length: 500, nullable: true, transformer: encryptTransformer })
  customerName: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true, transformer: encryptTransformer })
  customerPhone: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true, transformer: encryptTransformer })
  customerEmail: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, transformer: encryptObjectTransformer })
  formData: Record<string, any>; // Additional form data (stored as JSON string)

  @Column({ type: 'datetime2', nullable: true })
  calledAt: Date;

  @Column({ type: 'datetime2', nullable: true })
  servingStartedAt: Date;

  @Column({ type: 'datetime2', nullable: true })
  completedAt: Date;

  @Column({ type: 'datetime2', nullable: true })
  noShowAt: Date;

  @Column({ type: 'int', default: 0 })
  positionInQueue: number; // Position in agent's queue

  @ManyToOne(() => Category, (category) => category.tickets)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => User, (user) => user.tickets, { nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;
}

