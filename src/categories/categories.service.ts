import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { AgentCategory } from './entities/agent-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../queue/entities/ticket.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(AgentCategory)
    private agentCategoryRepository: Repository<AgentCategory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this name already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(activeOnly = false): Promise<Category[]> {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }
    return this.categoryRepository.find({
      where,
      relations: ['agentCategories', 'agentCategories.agent'],
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['agentCategories', 'agentCategories.agent'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateData: Partial<Category>): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, updateData);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string; deactivated?: boolean }> {
    const category = await this.findOne(id);

    // Check if there are any tickets associated with this category
    const ticketCount = await this.ticketRepository.count({
      where: { categoryId: id },
    });

    if (ticketCount > 0) {
      // Instead of hard delete, mark as inactive (soft delete)
      category.isActive = false;
      await this.categoryRepository.save(category);
      return {
        message: `Category cannot be deleted because it has ${ticketCount} associated ticket(s). Category has been deactivated instead.`,
        deactivated: true,
      };
    }

    // If no tickets, proceed with deletion
    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }

  async assignAgentToCategory(
    agentId: string,
    categoryId: string,
  ): Promise<AgentCategory> {
    const agent = await this.userRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const category = await this.findOne(categoryId);

    // Check if agent is already assigned to this category
    const existing = await this.agentCategoryRepository.findOne({
      where: { agentId, categoryId },
    });

    if (existing) {
      existing.isActive = true;
      return this.agentCategoryRepository.save(existing);
    }

    // Check if agent is assigned to any other active category
    // If so, remove them from the old category (one agent = one service rule)
    const otherAssignments = await this.agentCategoryRepository.find({
      where: { agentId, isActive: true },
    });

    // Remove agent from all other categories
    for (const assignment of otherAssignments) {
      if (assignment.categoryId !== categoryId) {
        assignment.isActive = false;
        await this.agentCategoryRepository.save(assignment);
      }
    }

    const agentCategory = this.agentCategoryRepository.create({
      agentId,
      categoryId,
    });

    return this.agentCategoryRepository.save(agentCategory);
  }

  async removeAgentFromCategory(
    agentId: string,
    categoryId: string,
  ): Promise<void> {
    const agentCategory = await this.agentCategoryRepository.findOne({
      where: { agentId, categoryId },
    });

    if (agentCategory) {
      agentCategory.isActive = false;
      await this.agentCategoryRepository.save(agentCategory);
    }
  }

  async getAgentsByCategory(categoryId: string): Promise<User[]> {
    const agentCategories = await this.agentCategoryRepository.find({
      where: { categoryId, isActive: true },
      relations: ['agent'],
    });

    return agentCategories.map((ac) => ac.agent);
  }
}

