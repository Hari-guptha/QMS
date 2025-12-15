import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Ticket } from '../queue/entities/ticket.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await this.authService.hashPassword(
      createUserDto.password,
    );

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async findAll(role?: UserRole): Promise<User[]> {
    const where: any = {};
    if (role) {
      where.role = role;
    }
    return this.userRepository.find({
      where,
      relations: ['agentCategories', 'agentCategories.category'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['agentCategories', 'agentCategories.category'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);

    if (updateData.password) {
      updateData.password = await this.authService.hashPassword(
        updateData.password,
      );
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    // Handle foreign key constraint: Set agentId to null for all tickets associated with this user
    await this.ticketRepository.update(
      { agentId: id },
      { agentId: null },
    );
    
    await this.userRepository.remove(user);
  }

  async getAgentsByCategory(categoryId: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.agentCategories', 'ac')
      .where('user.role = :role', { role: UserRole.AGENT })
      .andWhere('ac.categoryId = :categoryId', { categoryId })
      .andWhere('ac.isActive = :isActive', { isActive: true })
      .andWhere('user.isActive = :userActive', { userActive: true })
      .getMany();
  }
}

