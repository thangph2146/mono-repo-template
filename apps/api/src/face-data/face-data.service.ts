import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { FaceData } from '../entities/face-data.entity';
import { User } from '../entities/user.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface FaceDataRowDto {
  id: string;
  userId: string | null;
  imagePath: string;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListFaceDataParams {
  page: number;
  limit: number;
  userId?: string;
}

export interface ListFaceDataResult {
  data: FaceDataRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function toIsoString(
  value: Date | string | number | undefined | null,
): string | null {
  if (value == null) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === 'number')
    return Number.isNaN(value) ? null : new Date(value).toISOString();
  if (typeof value === 'string' && value.trim()) {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }
  return null;
}

function mapRow(r: FaceData): FaceDataRowDto {
  return {
    id: r.id,
    userId: r.user?.id ?? null,
    imagePath: r.imagePath,
    status: r.status,
    createdAt: toIsoString(r.createdAt),
    updatedAt: toIsoString(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

@Injectable()
export class FaceDataService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListFaceDataParams): Promise<ListFaceDataResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {};
    where.deletedAt = null;
    if (params.userId) {
      where.user = params.userId;
    }
    const whereQuery = where as FilterQuery<FaceData>;
    const [rows, total] = await Promise.all([
      this.em.find(FaceData, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(FaceData, whereQuery),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<FaceDataRowDto | null> {
    const r = await this.em.findOne(FaceData, { id });
    if (!r) return null;
    return mapRow(r);
  }

  async create(data: {
    imagePath: string;
    userId?: string | null;
    status?: number;
  }): Promise<FaceDataRowDto> {
    const created = new FaceData();
    created.imagePath = data.imagePath;
    if (data.userId !== undefined && data.userId !== null) {
      created.user = this.em.getReference(User, data.userId);
    }
    if (data.status !== undefined) created.status = data.status;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: {
      imagePath?: string;
      status?: number;
    },
  ): Promise<FaceDataRowDto | null> {
    const existing = await this.em.findOne(FaceData, { id });
    if (!existing) return null;
    if (data.imagePath !== undefined) existing.imagePath = data.imagePath;
    if (data.status !== undefined) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(FaceData, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(FaceData, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(FaceData, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
