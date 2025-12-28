import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../common/enums';

@ApiTags('admin', 'public')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll(@Query('activeOnly') activeOnly?: string) {
    return this.categoriesService.findAll(activeOnly === 'true');
  }

  @Get('public')
  @Public()
  @ApiTags('public')
  @ApiOperation({ summary: 'Get active categories (Public endpoint)' })
  async findActive() {
    return this.categoriesService.findAll(true);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update category (Admin only)' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.categoriesService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category deleted or deactivated successfully' })
  async remove(
    @Param('id') id: string,
    @Query('confirm') confirm?: string,
  ) {
    return this.categoriesService.remove(id, confirm === 'true');
  }

  @Post(':categoryId/assign-agent/:agentId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign agent to category (Admin only)' })
  async assignAgent(
    @Param('categoryId') categoryId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.categoriesService.assignAgentToCategory(agentId, categoryId);
  }

  @Delete(':categoryId/remove-agent/:agentId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove agent from category (Admin only)' })
  async removeAgent(
    @Param('categoryId') categoryId: string,
    @Param('agentId') agentId: string,
  ) {
    await this.categoriesService.removeAgentFromCategory(agentId, categoryId);
    return { message: 'Agent removed from category successfully' };
  }
}

