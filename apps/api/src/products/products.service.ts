import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, type RequiredEntityData } from '@mikro-orm/core';
import { Product } from '../entities';

export interface AdjustStockDto {
  /** Positive = restock / inbound, negative = outbound. */
  delta: number;
  /** Optional reason logged for audit (kept in service log only). */
  reason?: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
  ) {}

  /**
   * Older deployments stored `unitTypes` / `images` / `coupons` as
   * `longtext` with a `json_valid` check constraint instead of native JSON
   * columns. MikroORM marks those as `mappedType: unknown` so values come
   * back as raw JSON strings. We coerce them back to arrays here so the API
   * always responds with the documented shape regardless of legacy schema.
   */
  private hydrateJsonColumns(product: Product): Product {
    const parse = <T>(value: unknown): T | undefined => {
      if (typeof value !== 'string') return value as T | undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      try {
        return JSON.parse(trimmed) as T;
      } catch {
        return undefined;
      }
    };
    if (typeof product.unitTypes === 'string') {
      product.unitTypes = parse<Product['unitTypes']>(product.unitTypes);
    }
    if (typeof product.images === 'string') {
      product.images = parse<Product['images']>(product.images);
    }
    if (typeof product.coupons === 'string') {
      product.coupons = parse<Product['coupons']>(product.coupons);
    }
    // MySQL DECIMAL columns are returned as strings by mysql2 to preserve
    // precision. The frontend treats prices as plain numbers, so coerce here
    // and let downstream callers reason about a single shape.
    const toNumber = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };
    product.basePrice = toNumber(product.basePrice);
    product.wholesalePrice = toNumber(product.wholesalePrice);
    product.retailPrice = toNumber(product.retailPrice);
    product.stock = toNumber(product.stock);
    return product;
  }

  private hydrateAll(products: Product[]): Product[] {
    for (const p of products) this.hydrateJsonColumns(p);
    return products;
  }

  async findAll(options?: { activeOnly?: boolean }): Promise<Product[]> {
    if (options?.activeOnly) {
      return this.hydrateAll(
        await this.productRepository.find({ isActive: true }),
      );
    }
    return this.hydrateAll(await this.productRepository.findAll());
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ id });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return this.hydrateJsonColumns(product);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const product = await this.productRepository.findOne({ sku });
    return product ? this.hydrateJsonColumns(product) : null;
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.hydrateAll(await this.productRepository.find({ category }));
  }

  async create(productData: Partial<Product>): Promise<Product> {
    if (productData.sku) {
      const existing = await this.findBySku(productData.sku);
      if (existing) {
        throw new ConflictException(`SKU "${productData.sku}" already exists`);
      }
    }
    const product = this.productRepository.create(
      productData as RequiredEntityData<Product>,
    );
    await this.productRepository.getEntityManager().persistAndFlush(product);
    return product;
  }

  async update(id: number, productData: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id);
    this.productRepository.assign(product, productData);
    await this.productRepository.getEntityManager().flush();
    return product;
  }

  /**
   * Adjust stock by a positive (inbound) or negative (outbound) delta. Useful
   * for warehouse staff to top up or correct inventory without touching other
   * fields. Refuses to drop below zero so we never desync with on-the-floor
   * counts.
   */
  async adjustStock(id: number, dto: AdjustStockDto): Promise<Product> {
    if (!Number.isFinite(dto.delta)) {
      throw new BadRequestException('delta must be a finite number');
    }
    const product = await this.findOne(id);
    const next = product.stock + dto.delta;
    if (next < 0) {
      throw new ConflictException(
        `Cannot reduce stock of ${product.sku} below 0 (current ${product.stock}, delta ${dto.delta})`,
      );
    }
    product.stock = next;
    await this.productRepository.getEntityManager().flush();
    this.logger.log(
      `Stock adjusted for ${product.sku}: ${dto.delta} → ${next} (${dto.reason ?? 'manual'})`,
    );
    return product;
  }

  async delete(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.getEntityManager().removeAndFlush(product);
  }
}
