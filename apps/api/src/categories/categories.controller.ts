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
  @ApiResponse({ status: 200, description: 'Return all categories or paged' })
  async findAll(
    @Query('active') active?: string,
    @Query('q') q?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<Category[] | { items: Category[]; total: number }> {
    const page =
      pageStr !== undefined && pageStr !== ''
        ? parseInt(pageStr, 10)
        : Number.NaN;
    const limit =
      limitStr !== undefined && limitStr !== ''
        ? parseInt(limitStr, 10)
        : Number.NaN;
    if (
      Number.isFinite(page) &&
      Number.isFinite(limit) &&
      page >= 1 &&
      limit >= 1 &&
      limit <= 200
    ) {
      return this.categoriesService.findPage({
        q: q?.trim() || undefined,
        page,
        limit,
      });
    }
    if (active === 'true') return this.categoriesService.findActive();
    return this.categoriesService.findAll();
  }

  @Get('usage')
  @Public()
  @ApiOperation({ summary: 'Get product count per category slug' })
  async usage(): Promise<CategoryUsage[]> {
    return this.categoriesService.usageStats();
  }

  @Get('trashed')
  @Permissions(PERMISSIONS.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Danh mục đã xóa tạm' })
  async listTrashed(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('q') q?: string,
  ): Promise<{ items: Category[]; total: number }> {
    const page =
      pageStr !== undefined && pageStr !== ''
        ? parseInt(pageStr, 10)
        : undefined;
    const limit =
      limitStr !== undefined && limitStr !== ''
        ? parseInt(limitStr, 10)
        : undefined;
    return this.categoriesService.listTrashed({
      page,
      limit,
      q: q?.trim() || undefined,
    });
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
    return this.categoriesService.findOnePublished(id);
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

  @Post(':id/restore')
  @Permissions(PERMISSIONS.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Khôi phục danh mục từ thùng rác' })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.restore(id);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.CATEGORIES_WRITE)
  @ApiOperation({
    summary: 'Xóa vĩnh viễn danh mục (chỉ khi đang trong thùng rác)',
  })
  async purgeTrashed(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoriesService.purgeTrashed(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.CATEGORIES_WRITE)
  @ApiOperation({ summary: 'Xóa tạm danh mục' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.categoriesService.delete(id);
  }
}
