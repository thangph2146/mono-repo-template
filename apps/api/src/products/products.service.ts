import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  type FilterQuery,
  type RequiredEntityData,
} from '@mikro-orm/core';
import { Product } from '../entities';

export type ProductListStockBand = 'ok' | 'low' | 'out';

export interface ProductListOptions {
  activeOnly?: boolean;
  category?: string;
  brand?: string;
  brandEmpty?: boolean;
  isActive?: boolean;
  q?: string;
  stock?: number;
  retailPrice?: number;
  stockBand?: ProductListStockBand;
  /** Khớp `unitTypes[].type` hoặc cột `unit`. */
  unitType?: string;
  /** `si`: có giá khuyến mãi (wholesale); `le`: chỉ giá ban đầu (wholesale null). */
  purchaseMode?: 'si' | 'le';
}

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

  private unitsForFilter(p: Product): NonNullable<Product['unitTypes']> {
    const ut = p.unitTypes;
    if (ut && ut.length > 0) return ut;
    return [
      {
        type: p.unit,
        label: p.unit,
        wholesalePrice: p.wholesalePrice,
        retailPrice: p.retailPrice,
        minWholesaleQty: 0,
        qtyPerUnit: 1,
      },
    ];
  }

  /** Lọc đơn vị / kiểu mua (JSON) sau truy vấn DB. */
  private passesCatalogPostFilters(
    p: Product,
    options?: ProductListOptions,
  ): boolean {
    if (!options?.unitType && !options?.purchaseMode) return true;
    const units = this.unitsForFilter(p);
    if (options.unitType) {
      const ut = options.unitType.trim();
      if (!units.some((u) => u.type === ut) && p.unit !== ut) {
        return false;
      }
    }
    if (options.purchaseMode === 'si') {
      const hasWholesale = units.some((u) => u.wholesalePrice !== null);
      if (!hasWholesale) return false;
    }
    if (options.purchaseMode === 'le') {
      const hasRetail = units.some((u) => u.wholesalePrice === null);
      if (!hasRetail) return false;
    }
    return true;
  }

  private notDeleted(): FilterQuery<Product> {
    return { deletedAt: null };
  }

  private mergeWhere(
    a: FilterQuery<Product>,
    b: FilterQuery<Product>,
  ): FilterQuery<Product> {
    const empty = (x: FilterQuery<Product>) =>
      x == null ||
      (typeof x === 'object' &&
        !Array.isArray(x) &&
        Object.keys(x as object).length === 0);
    if (empty(a)) return b;
    if (empty(b)) return a;
    return { $and: [a, b] };
  }

  private buildListWhere(options?: ProductListOptions): FilterQuery<Product> {
    const parts: FilterQuery<Product>[] = [];

    if (options?.isActive !== undefined) {
      parts.push({ isActive: options.isActive });
    } else if (options?.activeOnly) {
      parts.push({ isActive: true });
    }

    if (options?.category) {
      parts.push({ category: options.category });
    }

    if (options?.brandEmpty) {
      parts.push({ $or: [{ brand: null }, { brand: '' }] });
    } else if (options?.brand) {
      parts.push({ brand: options.brand });
    }

    if (options?.stock !== undefined && Number.isFinite(options.stock)) {
      parts.push({ stock: options.stock });
    }

    if (
      options?.retailPrice !== undefined &&
      Number.isFinite(options.retailPrice)
    ) {
      parts.push({ retailPrice: options.retailPrice });
    }

    if (options?.stockBand === 'out') {
      parts.push({ stock: { $lte: 0 } });
    } else if (options?.stockBand === 'low') {
      parts.push({ stock: { $gt: 0, $lt: 50 } });
    } else if (options?.stockBand === 'ok') {
      parts.push({ stock: { $gte: 50 } });
    }

    const q = options?.q?.trim();
    if (q) {
      const like = `%${q}%`;
      parts.push({
        $or: [
          { sku: { $like: like } },
          { name: { $like: like } },
          { category: { $like: like } },
          { brand: { $like: like } },
          { description: { $like: like } },
        ],
      });
    }

    return parts.length === 0
      ? {}
      : parts.length === 1
        ? parts[0]
        : { $and: parts };
  }

  async findAll(options?: ProductListOptions): Promise<Product[]> {
    const where = this.mergeWhere(
      this.buildListWhere(options),
      this.notDeleted(),
    );
    const rows = await this.productRepository.find(where, {
      orderBy: { id: 'asc' },
    });
    const hydrated = this.hydrateAll(rows);
    return hydrated.filter((p) => this.passesCatalogPostFilters(p, options));
  }

  async findPage(
    options: ProductListOptions & { page: number; limit: number },
  ): Promise<{ items: Product[]; total: number }> {
    const where = this.mergeWhere(
      this.buildListWhere(options),
      this.notDeleted(),
    );
    const page = Math.max(1, Math.floor(options.page));
    const limit = Math.min(200, Math.max(1, Math.floor(options.limit)));
    const rows = await this.productRepository.find(where, {
      orderBy: { id: 'asc' },
    });
    const hydrated = this.hydrateAll(rows);
    const filtered = hydrated.filter((p) =>
      this.passesCatalogPostFilters(p, options),
    );
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const items = filtered.slice(offset, offset + limit);
    return { items, total };
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      id,
      deletedAt: null,
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return this.hydrateJsonColumns(product);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const product = await this.productRepository.findOne({
      sku,
      deletedAt: null,
    });
    return product ? this.hydrateJsonColumns(product) : null;
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.hydrateAll(
      await this.productRepository.find({ category, deletedAt: null }),
    );
  }

  async create(productData: Partial<Product>): Promise<Product> {
    if (productData.sku) {
      const existing = await this.productRepository.findOne({
        sku: productData.sku,
      });
      if (existing) {
        if (existing.deletedAt) {
          throw new ConflictException(
            `SKU "${productData.sku}" đang trong thùng rác (id ${existing.id}). Khôi phục sản phẩm hoặc đổi mã SKU.`,
          );
        }
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
    const incoming = { ...productData } as Record<string, unknown>;
    delete incoming.id;
    delete incoming.createdAt;
    delete incoming.updatedAt;
    this.productRepository.assign(
      product,
      incoming as Partial<Product>,
    );
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
    product.deletedAt = new Date();
    await this.productRepository.getEntityManager().flush();
  }

  async listTrashed(options?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: Product[]; total: number }> {
    const where: FilterQuery<Product> = { deletedAt: { $ne: null } };
    const rows = await this.productRepository.find(where, {
      orderBy: { deletedAt: 'DESC', id: 'DESC' },
    });
    let hydrated = this.hydrateAll(rows);
    const q = options?.q?.trim().toLowerCase();
    if (q) {
      hydrated = hydrated.filter((p) => {
        const sku = String(p.sku ?? '').toLowerCase();
        const name = String(p.name ?? '').toLowerCase();
        const cat = String(p.category ?? '').toLowerCase();
        return sku.includes(q) || name.includes(q) || cat.includes(q);
      });
    }
    const total = hydrated.length;
    const page = Math.max(1, Math.floor(options?.page ?? 1));
    const limit = Math.min(200, Math.max(1, Math.floor(options?.limit ?? 100)));
    const offset = (page - 1) * limit;
    const items = hydrated.slice(offset, offset + limit);
    return { items, total };
  }

  async restore(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      id,
      deletedAt: { $ne: null },
    });
    if (!product) {
      throw new NotFoundException(
        `Không có sản phẩm id ${id} trong thùng rác hoặc đã được khôi phục`,
      );
    }
    product.deletedAt = null;
    await this.productRepository.getEntityManager().flush();
    return this.hydrateJsonColumns(product);
  }

  /** Xóa hẳn bản ghi đang ở thùng rác (không thể hoàn tác). */
  async purgeTrashed(id: number): Promise<void> {
    const product = await this.productRepository.findOne({
      id,
      deletedAt: { $ne: null },
    });
    if (!product) {
      throw new NotFoundException(
        `Không có sản phẩm id ${id} trong thùng rác — chỉ xóa vĩnh viễn bản đã xóa tạm.`,
      );
    }
    await this.productRepository.getEntityManager().removeAndFlush(product);
  }
}
