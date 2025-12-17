import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
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

  @Column({ type: 'nvarchar', length: 255, unique: true })
  email: string; // Keep unencrypted for login/search purposes

  @Column({ type: 'nvarchar', length: 500, nullable: true, transformer: encryptTransformer })
  phone: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  password: string; // Already hashed, don't encrypt. Null for OAuth users

  @Column({ type: 'nvarchar', length: 500, transformer: encryptTransformer })
  firstName: string;

  @Column({ type: 'nvarchar', length: 500, transformer: encryptTransformer })
  lastName: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ type: 'bit', default: true })
  isActive: boolean;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  employeeId: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  counterNumber: string;

  // Note: In MSSQL, unique constraint on nullable column only allows ONE null
  // Using Index instead - uniqueness for non-null values enforced at app level
  @Index()
  @Column({ type: 'nvarchar', length: 255, nullable: true })
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

