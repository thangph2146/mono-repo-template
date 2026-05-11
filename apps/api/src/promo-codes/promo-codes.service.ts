import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { EntityManager, FilterQuery } from '@mikro-orm/core';
import { EntityRepository } from '@mikro-orm/core';
import type { PromoRulePublic } from '@workspace/promo-codes';
import { PromoCode } from '../entities/promo-code.entity';
import type { CreatePromoCodeDto, UpdatePromoCodeDto } from './promo-codes.dto';

function parseOptionalDate(
  raw: string | null | undefined,
): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || String(raw).trim() === '') return null;
  const d = new Date(String(raw).trim());
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Ngày không hợp lệ: ${raw}`);
  }
  return d;
}

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoRepository: EntityRepository<PromoCode>,
  ) {}

  toRulePublic(row: PromoCode): PromoRulePublic {
    return {
      code: row.code.trim().toUpperCase(),
      label: row.label,
      discountKind: row.discountKind,
      discountFixed: Math.max(0, Math.floor(row.discountFixed ?? 0)),
      discountPercent: Math.max(
        0,
        Math.min(100, Math.floor(row.discountPercent ?? 0)),
      ),
      discountCapVnd:
        row.discountCapVnd == null || !Number.isFinite(row.discountCapVnd)
          ? null
          : Math.max(0, Math.floor(row.discountCapVnd)),
      minOrderSubtotal: Math.max(0, Math.floor(row.minOrderSubtotal ?? 0)),
    };
  }

  private isEligibleAt(row: PromoCode, now: Date): boolean {
    if (!row.isActive) return false;
    if (row.validFrom && row.validFrom > now) return false;
    if (row.validUntil && row.validUntil < now) return false;
    const limit = row.usageLimit;
    if (limit != null && Number.isFinite(limit) && limit >= 0) {
      if (row.usageCount >= limit) return false;
    }
    return true;
  }

  /** Rule đang hiệu lực — dùng khi checkout + GET public cho storefront. */
  async getActiveRulesForCheckout(
    now = new Date(),
  ): Promise<PromoRulePublic[]> {
    const rows = await this.promoRepository.find({ isActive: true });
    return rows
      .filter((r) => this.isEligibleAt(r, now))
      .map((r) => this.toRulePublic(r));
  }

  async findAdminPage(opts: {
    q?: string;
    page: number;
    limit: number;
  }): Promise<{ items: PromoCode[]; total: number }> {
    const page = Math.max(1, opts.page);
    const limit = Math.min(200, Math.max(1, opts.limit));
    const offset = (page - 1) * limit;
    const where: FilterQuery<PromoCode> = {};
    const q = opts.q?.trim();
    if (q) {
      const like = `%${q}%`;
      where.$or = [{ code: { $like: like } }, { label: { $like: like } }];
    }
    const [items, total] = await this.promoRepository.findAndCount(where, {
      orderBy: { code: 'asc' },
      limit,
      offset,
    });
    return { items, total };
  }

  async findOne(id: number): Promise<PromoCode> {
    const row = await this.promoRepository.findOne({ id });
    if (!row) throw new NotFoundException(`Promo code id ${id} not found`);
    return row;
  }

  async create(dto: CreatePromoCodeDto): Promise<PromoCode> {
    const code = dto.code.trim().toUpperCase();
    if (dto.discountKind === 'fixed' && dto.discountFixed <= 0) {
      throw new BadRequestException('Mã fixed cần discountFixed > 0');
    }
    if (dto.discountKind === 'percent' && dto.discountPercent <= 0) {
      throw new BadRequestException('Mã % cần discountPercent > 0');
    }
    const exists = await this.promoRepository.findOne({ code });
    if (exists) {
      throw new ConflictException(`Mã ${code} đã tồn tại`);
    }
    const vf = parseOptionalDate(dto.validFrom);
    const vu = parseOptionalDate(dto.validUntil);
    const row = this.promoRepository.create(
      {
        code,
        label: dto.label.trim(),
        discountKind: dto.discountKind,
        discountFixed: Math.max(0, Math.floor(dto.discountFixed)),
        discountPercent: Math.max(
          0,
          Math.min(100, Math.floor(dto.discountPercent)),
        ),
        discountCapVnd:
          dto.discountCapVnd === undefined
            ? null
            : dto.discountCapVnd === null
              ? null
              : Math.max(0, Math.floor(dto.discountCapVnd)),
        minOrderSubtotal: Math.max(0, Math.floor(dto.minOrderSubtotal)),
        isActive: dto.isActive ?? true,
        validFrom: vf === undefined ? null : vf,
        validUntil: vu === undefined ? null : vu,
        usageLimit:
          dto.usageLimit === undefined
            ? null
            : dto.usageLimit === null
              ? null
              : Math.floor(dto.usageLimit),
        usageCount: 0,
      },
      { partial: true },
    );
    await this.promoRepository.getEntityManager().persistAndFlush(row);
    return row;
  }

  async update(id: number, dto: UpdatePromoCodeDto): Promise<PromoCode> {
    const row = await this.findOne(id);
    if (dto.label !== undefined) row.label = dto.label.trim();
    if (dto.discountKind !== undefined) row.discountKind = dto.discountKind;
    if (dto.discountFixed !== undefined) {
      row.discountFixed = Math.max(0, Math.floor(dto.discountFixed));
    }
    if (dto.discountPercent !== undefined) {
      row.discountPercent = Math.max(
        0,
        Math.min(100, Math.floor(dto.discountPercent)),
      );
    }
    if (dto.discountCapVnd !== undefined) {
      row.discountCapVnd =
        dto.discountCapVnd === null
          ? null
          : Math.max(0, Math.floor(dto.discountCapVnd));
    }
    if (dto.minOrderSubtotal !== undefined) {
      row.minOrderSubtotal = Math.max(0, Math.floor(dto.minOrderSubtotal));
    }
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    if (dto.validFrom !== undefined) {
      const v = parseOptionalDate(dto.validFrom);
      row.validFrom = v === undefined ? null : v;
    }
    if (dto.validUntil !== undefined) {
      const v = parseOptionalDate(dto.validUntil);
      row.validUntil = v === undefined ? null : v;
    }
    if (dto.usageLimit !== undefined) {
      row.usageLimit =
        dto.usageLimit === null
          ? null
          : Math.max(1, Math.floor(dto.usageLimit));
    }
    await this.promoRepository.getEntityManager().flush();
    return row;
  }

  async remove(id: number): Promise<void> {
    const row = await this.findOne(id);
    await this.promoRepository.getEntityManager().removeAndFlush(row);
  }

  /** Tăng usage sau khi đơn đã persist (chỉ khi mã khớp bản ghi DB). */
  async incrementUsageIfTracked(
    em: EntityManager,
    normalizedCode: string,
  ): Promise<void> {
    const code = normalizedCode.trim().toUpperCase();
    const row = await em.findOne(PromoCode, { code });
    if (!row) return;
    row.usageCount = Math.max(0, Math.floor(row.usageCount)) + 1;
  }
}
