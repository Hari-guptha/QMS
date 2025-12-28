import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '../common/enums';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private encryptionService: EncryptionService,
    private realtimeService: RealtimeService,
  ) { }

  private encryptUser(data: any) {
    if (data.phone) data.phone = this.encryptionService.encrypt(data.phone);
    if (data.firstName) data.firstName = this.encryptionService.encrypt(data.firstName);
    if (data.lastName) data.lastName = this.encryptionService.encrypt(data.lastName);
    return data;
  }

  private decryptUser(user: any) {
    if (!user) return user;
    if (user.phone) user.phone = this.encryptionService.decrypt(user.phone);
    if (user.firstName) user.firstName = this.encryptionService.decrypt(user.firstName);
    if (user.lastName) user.lastName = this.encryptionService.decrypt(user.lastName);
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingEmail) {
      throw new BadRequestException('User with this email already exists');
    }

    if (createUserDto.username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: createUserDto.username },
      });
      if (existingUsername) {
        throw new BadRequestException('User with this username already exists');
      }
    }

    // Generate unique ID if not provided
    if (!createUserDto.employeeId) {
      let isUnique = false;
      let newId = '';
      while (!isUnique) {
        newId = `QMS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const existing = await this.prisma.user.findFirst({
          where: { employeeId: newId },
        });
        if (!existing) isUnique = true;
      }
      createUserDto.employeeId = newId;
    }

    const hashedPassword = await this.authService.hashPassword(
      createUserDto.password,
    );

    const data = this.encryptUser({
      ...createUserDto,
      password: hashedPassword,
    });

    const user = await this.prisma.user.create({ data });
    return this.decryptUser(user);
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return this.decryptUser(user);
  }

  async findAll(role?: UserRole) {
    const where: any = {};
    if (role) {
      where.role = role;
    }
    const users = await this.prisma.user.findMany({
      where,
      include: {
        agentCategories: {
          include: {
            category: true,
          },
        },
      },
    });
    return users.map((u) => this.decryptUser(u));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        agentCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.decryptUser(user);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return this.decryptUser(user);
  }

  async update(id: string, updateData: any) {
    await this.findOne(id);

    const data = { ...updateData };
    if (data.password) {
      data.password = await this.authService.hashPassword(data.password);
    }

    this.encryptUser(data);

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    const decrypted = this.decryptUser(user);
    if (decrypted.role === UserRole.AGENT) {
      this.realtimeService.emitAgentStatusUpdate(decrypted.id);
    }

    return decrypted;
  }

  async remove(id: string, confirm?: boolean): Promise<void> {
    await this.findOne(id);

    if (confirm) {
      // Delete all tickets associated with this agent
      await this.prisma.ticket.deleteMany({
        where: { agentId: id },
      });
    } else {
      // Just unassign tickets (old behavior - might not be reached if frontend always confirms)
      await this.prisma.ticket.updateMany({
        where: { agentId: id },
        data: { agentId: null },
      });
    }

    // Delete agent category associations first (Prisma handles relations, but let's be safe)
    await this.prisma.agentCategory.deleteMany({
      where: { agentId: id }
    });

    await this.prisma.user.delete({ where: { id } });
  }

  async getAgentsByCategory(categoryId: string) {
    const agents = await this.prisma.user.findMany({
      where: {
        role: UserRole.AGENT,
        isActive: true,
        agentCategories: {
          some: {
            categoryId,
            isActive: true,
          },
        },
      },
    });
    return agents.map((a) => this.decryptUser(a));
  }
}

