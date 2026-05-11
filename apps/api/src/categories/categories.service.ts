import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  type FilterQuery,
  type RequiredEntityData,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import { Category, Product } from '../entities';

export interface CategoryUsage {
  slug: string;
  productCount: number;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: EntityRepository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
  ) {}

  private static visible(): FilterQuery<Category> {
    return { deletedAt: null };
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find(CategoriesService.visible(), {
      orderBy: { sortOrder: 'asc', name: 'asc' },
    });
  }

  async findActive(): Promise<Category[]> {
    return this.categoryRepository.find(
      { isActive: true, deletedAt: null },
      { orderBy: { sortOrder: 'asc', name: 'asc' } },
    );
  }

  async findPage(opts: {
    q?: string;
    page: number;
    limit: number;
  }): Promise<{ items: Category[]; total: number }> {
    const page = Math.max(1, opts.page);
    const limit = Math.min(200, Math.max(1, opts.limit));
    const offset = (page - 1) * limit;
    const q = opts.q?.trim();
    const where: FilterQuery<Category> = { deletedAt: null };
    if (q) {
      const like = `%${q}%`;
      where.$or = [
        { name: { $like: like } },
        { slug: { $like: like } },
        { description: { $like: like } },
      ];
    }
    const [items, total] = await this.categoryRepository.findAndCount(where, {
      orderBy: { sortOrder: 'asc', name: 'asc' },
      limit,
      offset,
    });
    return { items, total };
  }

  async listTrashed(opts?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: Category[]; total: number }> {
    const page = Math.max(1, opts?.page ?? 1);
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 20));
    const offset = (page - 1) * limit;
    const where: FilterQuery<Category> = { deletedAt: { $ne: null } };
    const q = opts?.q?.trim();
    if (q) {
      const like = `%${q}%`;
      where.$or = [
        { name: { $like: like } },
        { slug: { $like: like } },
        { description: { $like: like } },
      ];
    }
    const [items, total] = await this.categoryRepository.findAndCount(where, {
      orderBy: { updatedAt: 'desc' },
      limit,
      offset,
    });
    return { items, total };
  }

  /** Bản ghi bất kỳ (kể cả thùng rác) — nội bộ cập nhật / khôi phục. */
  async findById(id: number): Promise<Category | null> {
    return this.categoryRepository.findOne({ id });
  }

  async findOnePublished(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      id,
      deletedAt: null,
    });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      slug,
      deletedAt: null,
    });
    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }
    return category;
  }

  async create(data: Partial<Category>): Promise<Category> {
    const payload = this.normalize(data);
    if (!payload.name || !payload.slug) {
      throw new ConflictException('Category name and slug are required');
    }
    const existing = await this.categoryRepository.findOne({
      slug: payload.slug,
    });
    if (existing) {
      if (existing.deletedAt == null) {
        throw new ConflictException(
          `Category with slug "${payload.slug}" already exists`,
        );
      }
      throw new ConflictException(
        `Slug "${payload.slug}" đang ở thùng rác — khôi phục hoặc đổi slug.`,
      );
    }
    try {
      const category = this.categoryRepository.create({
        ...payload,
        deletedAt: null,
      } as RequiredEntityData<Category>);
      await this.categoryRepository
        .getEntityManager()
        .persistAndFlush(category);
      return category;
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          `Category with slug "${payload.slug}" already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: number, data: Partial<Category>): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    const previousSlug = category.slug;
    const payload = this.normalize(data);

    try {
      this.categoryRepository.assign(category, payload);
      await this.categoryRepository.getEntityManager().flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          `Category with slug "${payload.slug ?? ''}" already exists`,
        );
      }
      throw error;
    }

    if (payload.slug && payload.slug !== previousSlug) {
      await this.productRepository
        .getEntityManager()
        .nativeUpdate(
          Product,
          { category: previousSlug },
          { category: payload.slug },
        );
    }
    return category;
  }

  async delete(id: number): Promise<void> {
    const category = await this.findById(id);
    if (!category || category.deletedAt != null) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    const inUse = await this.productRepository.count({
      category: category.slug,
      deletedAt: null,
    });
    if (inUse > 0) {
      throw new ConflictException(
        `Cannot delete category "${category.slug}" because ${inUse} product(s) still reference it`,
      );
    }
    category.deletedAt = new Date();
    await this.categoryRepository.getEntityManager().flush();
  }

  async restore(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      id,
      deletedAt: { $ne: null },
    });
    if (!category) {
      throw new NotFoundException(
        `No trashed category with id ${id} (or already restored)`,
      );
    }
    const clash = await this.categoryRepository.findOne({
      slug: category.slug,
      deletedAt: null,
    });
    if (clash && clash.id !== category.id) {
      throw new ConflictException(
        `Slug "${category.slug}" đã được dùng bởi danh mục khác — đổi slug trước khi khôi phục.`,
      );
    }
    category.deletedAt = null;
    await this.categoryRepository.getEntityManager().flush();
    return category;
  }

  /** Xóa hẳn danh mục đang ở thùng rác (không thể hoàn tác). */
  async purgeTrashed(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      id,
      deletedAt: { $ne: null },
    });
    if (!category) {
      throw new NotFoundException(
        `Không có danh mục id ${id} trong thùng rác — chỉ xóa vĩnh viễn bản đã xóa tạm.`,
      );
    }
    const inUse = await this.productRepository.count({
      category: category.slug,
      deletedAt: null,
    });
    if (inUse > 0) {
      throw new ConflictException(
        `Không xóa vĩnh viễn: còn ${inUse} sản phẩm đang hoạt động dùng slug "${category.slug}".`,
      );
    }
    await this.categoryRepository.getEntityManager().removeAndFlush(category);
  }

  async usageStats(): Promise<CategoryUsage[]> {
    const categories = await this.categoryRepository.find(
      CategoriesService.visible(),
      { orderBy: { sortOrder: 'asc', name: 'asc' } },
    );
    const usage = await Promise.all(
      categories.map(async (c) => ({
        slug: c.slug,
        productCount: await this.productRepository.count({
          category: c.slug,
          deletedAt: null,
        }),
      })),
    );
    return usage;
  }

  private normalize(data: Partial<Category>): Partial<Category> {
    const next: Partial<Category> = { ...data };
    if (typeof next.name === 'string') next.name = next.name.trim();
    if (typeof next.slug === 'string') next.slug = this.slugify(next.slug);
    if (!next.slug && typeof next.name === 'string') {
      next.slug = this.slugify(next.name);
    }
    return next;
  }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }
}
