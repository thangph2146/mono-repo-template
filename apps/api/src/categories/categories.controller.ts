import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Category } from '../entities';
import { CategoriesService, type CategoryUsage } from './categories.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Public, Permissions } from '../auth/decorators/public.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';

@ApiTags('categories')
@Controller('categories')
@UseGuards(PermissionsGuard)
@ApiHeader({ name: 'X-User-Id', required: false })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List categories' })
  @ApiResponse({ status: 200, description: 'Return all categories' })
  async findAll(@Query('active') active?: string): Promise<Category[]> {
    if (active === 'true') return this.categoriesService.findActive();
    return this.categoriesService.findAll();
  }

  @Get('usage')
  @Public()
  @ApiOperation({ summary: 'Get product count per category slug' })
  async usage(): Promise<CategoryUsage[]> {
    return this.categoriesService.usageStats();
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get category by slug' })
  async findBySlug(@Param('slug') slug: string): Promise<Category> {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get category by id' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Permissions(PERMISSIONS.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Create category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async create(@Body() data: Partial<Category>): Promise<Category> {
    return this.categoriesService.create(data);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Update category' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Category>,
  ): Promise<Category> {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Delete category' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoriesService.delete(id);
  }
}
