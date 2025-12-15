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

  @Column({ unique: true })
  tokenNumber: string; // Format: CATEGORY_CODE-001, CATEGORY_CODE-002, etc.

  @Column()
  categoryId: string;

  @Column({ nullable: true })
  agentId: string; // Assigned agent

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;

  @Column({ nullable: true, transformer: encryptTransformer })
  customerName: string;

  @Column({ nullable: true, transformer: encryptTransformer })
  customerPhone: string;

  @Column({ nullable: true, transformer: encryptTransformer })
  customerEmail: string;

  @Column({ type: 'json', nullable: true, transformer: encryptObjectTransformer })
  formData: Record<string, any>; // Additional form data

  @Column({ nullable: true })
  calledAt: Date;

  @Column({ nullable: true })
  servingStartedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  noShowAt: Date;

  @Column({ type: 'int', default: 0 })
  positionInQueue: number; // Position in agent's queue

  @ManyToOne(() => Category, (category) => category.tickets)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => User, (user) => user.tickets, { nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

