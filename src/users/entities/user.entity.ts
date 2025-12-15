import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Ticket } from '../../queue/entities/ticket.entity';
import { AgentCategory } from '../../categories/entities/agent-category.entity';
import { encryptTransformer } from '../../encryption/transformers';

export enum UserRole {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string; // Keep unencrypted for login/search purposes

  @Column({ nullable: true, transformer: encryptTransformer })
  phone: string;

  @Column({ nullable: true })
  password: string; // Already hashed, don't encrypt. Null for OAuth users

  @Column({ transformer: encryptTransformer })
  firstName: string;

  @Column({ transformer: encryptTransformer })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  employeeId: string;

  @Column({ nullable: true })
  counterNumber: string;

  @Column({ nullable: true, unique: true })
  microsoftId: string;

  @OneToMany(() => Ticket, (ticket) => ticket.agent)
  tickets: Ticket[];

  @OneToMany(() => AgentCategory, (agentCategory) => agentCategory.agent)
  agentCategories: AgentCategory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

