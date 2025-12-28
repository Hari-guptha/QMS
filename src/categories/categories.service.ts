import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) { }

  private decryptUser(user: any) {
    if (!user) return user;
    if (user.phone) user.phone = this.encryptionService.decrypt(user.phone);
    if (user.firstName) user.firstName = this.encryptionService.decrypt(user.firstName);
    if (user.lastName) user.lastName = this.encryptionService.decrypt(user.lastName);
    return user;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll(activeOnly = false) {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }
    const categories = await this.prisma.category.findMany({
      where,
      include: {
        agentCategories: {
          include: {
            agent: true,
          },
        },
      },
    });

    return categories.map((cat) => ({
      ...cat,
      agentCategories: cat.agentCategories.map((ac) => ({
        ...ac,
        agent: this.decryptUser(ac.agent),
      })),
    }));
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        agentCategories: {
          include: {
            agent: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...category,
      agentCategories: category.agentCategories.map((ac) => ({
        ...ac,
        agent: this.decryptUser(ac.agent),
      })),
    };
  }

  async update(id: string, updateData: any) {
    // Check if category exists
    await this.findOne(id);

    return this.prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, confirm?: boolean): Promise<{ message: string; deactivated?: boolean }> {
    // Check if category exists
    await this.findOne(id);

    // Check if there are any tickets associated with this category
    const ticketCount = await this.prisma.ticket.count({
      where: { categoryId: id },
    });

    if (ticketCount > 0 && !confirm) {
      // Instead of hard delete, mark as inactive (soft delete) if not confirmed
      await this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        message: `Category cannot be deleted because it has ${ticketCount} associated ticket(s). Category has been deactivated instead.`,
        deactivated: true,
      };
    }

    if (confirm) {
      // Delete all tickets associated with this category
      await this.prisma.ticket.deleteMany({
        where: { categoryId: id },
      });

      // Delete agent-category associations first
      await this.prisma.agentCategory.deleteMany({
        where: { categoryId: id },
      });
    }

    // If no tickets, proceed with deletion
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted successfully' };
  }

  async assignAgentToCategory(agentId: string, categoryId: string) {
    const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Check if category exists
    await this.findOne(categoryId);

    // Check if agent is already assigned to this category
    const existing = await this.prisma.agentCategory.findFirst({
      where: { agentId, categoryId },
    });

    if (existing) {
      return this.prisma.agentCategory.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }

    // Check if agent is assigned to any other active category
    // If so, remove them from the old category (one agent = one service rule)
    const otherAssignments = await this.prisma.agentCategory.findMany({
      where: { agentId, isActive: true },
    });

    // Remove agent from all other categories
    for (const assignment of otherAssignments) {
      if (assignment.categoryId !== categoryId) {
        await this.prisma.agentCategory.update({
          where: { id: assignment.id },
          data: { isActive: false },
        });
      }
    }

    return this.prisma.agentCategory.create({
      data: {
        agentId,
        categoryId,
      },
    });
  }

  async removeAgentFromCategory(agentId: string, categoryId: string): Promise<void> {
    const agentCategory = await this.prisma.agentCategory.findFirst({
      where: { agentId, categoryId },
    });

    if (agentCategory) {
      await this.prisma.agentCategory.update({
        where: { id: agentCategory.id },
        data: { isActive: false },
      });
    }
  }

  async getAgentsByCategory(categoryId: string) {
    const agentCategories = await this.prisma.agentCategory.findMany({
      where: { categoryId, isActive: true },
      include: { agent: true },
    });

    return agentCategories.map((ac) => this.decryptUser(ac.agent));
  }
}
