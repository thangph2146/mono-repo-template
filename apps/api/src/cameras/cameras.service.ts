import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Camera } from '../entities/camera.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface CameraRowDto {
  id: string;
  name: string;
  code: string | null;
  ipAddress: string | null;
  port: number | null;
  username: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

function toIso(v: Date | string | number | undefined | null): string | null {
  if (v == null) return null;
  if (v instanceof Date)
    return Number.isNaN(v.getTime()) ? null : v.toISOString();
  return null;
}

function mapRow(r: Camera): CameraRowDto {
  return {
    id: r.id,
    name: r.name,
    code: r.code ?? null,
    ipAddress: r.ipAddress ?? null,
    port: r.port ?? null,
    username: r.username ?? null,
    status: r.status,
    createdAt: toIso(r.createdAt) ?? '',
    updatedAt: toIso(r.updatedAt) ?? '',
    deletedAt: toIso(r.deletedAt),
  };
}

@Injectable()
export class CamerasService {
  constructor(private readonly em: EntityManager) {}

  async list(params: {
    page: number;
    limit: number;
    search?: string;
    status?: 'active' | 'deleted' | 'all';
  }) {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {};
    const s = params.status ?? 'active';
    if (s === 'deleted') where.deletedAt = { $ne: null };
    else if (s === 'active') where.deletedAt = null;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.$or = [
        { name: { $like: `%${q}%` } },
        { ipAddress: { $like: `%${q}%` } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.em.find(Camera, where as FilterQuery<Camera>, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Camera, where as FilterQuery<Camera>),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: string): Promise<CameraRowDto | null> {
    const r = await this.em.findOne(Camera, { id });
    return r ? mapRow(r) : null;
  }

  async create(data: Record<string, unknown>): Promise<CameraRowDto> {
    const created = new Camera();
    const fields = [
      'name',
      'code',
      'ipAddress',
      'port',
      'username',
      'password',
      'status',
    ] as const;
    for (const f of fields) {
      if (data[f] !== undefined)
        (created as unknown as Record<string, unknown>)[f] = data[f];
    }
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: Record<string, unknown>,
  ): Promise<CameraRowDto | null> {
    const existing = await this.em.findOne(Camera, { id });
    if (!existing) return null;
    const fields = [
      'name',
      'code',
      'ipAddress',
      'port',
      'username',
      'password',
      'status',
    ] as const;
    for (const f of fields) {
      if (data[f] !== undefined)
        (existing as unknown as Record<string, unknown>)[f] = data[f];
    }
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Camera, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(Camera, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Camera, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
