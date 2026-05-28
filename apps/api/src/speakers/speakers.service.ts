import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Speaker } from '../entities/speaker.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface SpeakerRowDto {
  id: number;
  name: string;
  title: string | null;
  organization: string | null;
  bio: string | null;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  status: number;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListSpeakersParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface ListSpeakersResult {
  data: SpeakerRowDto[];
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

function mapRow(r: Speaker): SpeakerRowDto {
  return {
    id: r.id,
    name: r.name,
    title: r.title ?? null,
    organization: r.organization ?? null,
    bio: r.bio ?? null,
    avatar: r.avatar ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    status: r.status,
    createdAt: toIsoString(r.createdAt),
    updatedAt: toIsoString(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

@Injectable()
export class SpeakersService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListSpeakersParams): Promise<ListSpeakersResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {};
    const status = params.status ?? 'active';
    if (status === 'deleted') where.deletedAt = { $ne: null };
    else if (status === 'active') where.deletedAt = null;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.$or = [
        { name: { $like: `%${q}%` } },
        { email: { $like: `%${q}%` } },
        { organization: { $like: `%${q}%` } },
      ];
    }
    const whereQuery = where as FilterQuery<Speaker>;
    const [rows, total] = await Promise.all([
      this.em.find(Speaker, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Speaker, whereQuery),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<SpeakerRowDto | null> {
    const r = await this.em.findOne(Speaker, { id });
    if (!r) return null;
    return mapRow(r);
  }

  async create(data: {
    name: string;
    title?: string | null;
    organization?: string | null;
    bio?: string | null;
    avatar?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: number;
  }): Promise<SpeakerRowDto> {
    const created = new Speaker();
    created.name = data.name;
    if (data.title !== undefined) created.title = data.title;
    if (data.organization !== undefined)
      created.organization = data.organization;
    if (data.bio !== undefined) created.bio = data.bio;
    if (data.avatar !== undefined) created.avatar = data.avatar;
    if (data.email !== undefined) created.email = data.email;
    if (data.phone !== undefined) created.phone = data.phone;
    if (data.status !== undefined) created.status = data.status;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: number,
    data: {
      name?: string;
      title?: string | null;
      organization?: string | null;
      bio?: string | null;
      avatar?: string | null;
      email?: string | null;
      phone?: string | null;
      status?: number;
    },
  ): Promise<SpeakerRowDto | null> {
    const existing = await this.em.findOne(Speaker, { id });
    if (!existing) return null;
    if (data.name !== undefined) existing.name = data.name;
    if (data.title !== undefined) existing.title = data.title;
    if (data.organization !== undefined)
      existing.organization = data.organization;
    if (data.bio !== undefined) existing.bio = data.bio;
    if (data.avatar !== undefined) existing.avatar = data.avatar;
    if (data.email !== undefined) existing.email = data.email;
    if (data.phone !== undefined) existing.phone = data.phone;
    if (data.status !== undefined) existing.status = data.status;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: number): Promise<boolean> {
    const r = await this.em.findOne(Speaker, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    const r = await this.em.findOne(Speaker, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const r = await this.em.findOne(Speaker, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
