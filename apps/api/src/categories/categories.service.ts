import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
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

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.findAll({
      orderBy: { sortOrder: 'asc', name: 'asc' },
    });
  }

  async findActive(): Promise<Category[]> {
    return this.categoryRepository.find(
      { isActive: true },
      { orderBy: { sortOrder: 'asc', name: 'asc' } },
    );
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ id });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ slug });
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
    try {
      const category = this.categoryRepository.create(
        payload as RequiredEntityData<Category>,
      );
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
    const category = await this.findOne(id);
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
    const category = await this.findOne(id);
    const inUse = await this.productRepository.count({
      category: category.slug,
    });
    if (inUse > 0) {
      throw new ConflictException(
        `Cannot delete category "${category.slug}" because ${inUse} product(s) still reference it`,
      );
    }
    await this.categoryRepository.getEntityManager().removeAndFlush(category);
  }

  async usageStats(): Promise<CategoryUsage[]> {
    const categories = await this.categoryRepository.findAll();
    const usage = await Promise.all(
      categories.map(async (c) => ({
        slug: c.slug,
        productCount: await this.productRepository.count({ category: c.slug }),
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
