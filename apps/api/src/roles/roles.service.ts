import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import {
  getOptionsFromModel,
  type GetOptionsConfig,
} from '../common/get-options';
import { Role } from '../entities/role.entity';

export interface RoleRowDto {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  permissions: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListRolesParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
}

export interface ListRolesResult {
  data: RoleRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** MikroORM/driver đôi khi hydrate datetime thành chuỗi (nhất là cột nullable). */
function toIsoString(
  value: Date | string | number | undefined | null,
): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : new Date(value).toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }
  return null;
}

function toIsoStringRequired(value: Date | string | number): string {
  return toIsoString(value) ?? new Date(0).toISOString();
}

function mapRow(r: Role): RoleRowDto {
  return {
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    description: r.description ?? null,
    permissions: r.permissions,
    isActive: r.isActive,
    createdAt: toIsoStringRequired(r.createdAt),
    updatedAt: toIsoStringRequired(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

const ROLE_OPTIONS_CONFIG: GetOptionsConfig = {
  name: { valueField: 'name', searchField: 'name' },
  displayName: { valueField: 'displayName', searchField: 'displayName' },
  '*': { valueField: 'name', searchField: 'name' },
};

@Injectable()
export class RolesService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListRolesParams): Promise<ListRolesResult> {
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
        { displayName: { $like: `%${q}%` } },
        { description: { $like: `%${q}%` } },
      ];
    }

    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (!value?.trim()) continue;
        const v = value.trim();
        if (key === 'name') where.name = { $like: `%${v}%` };
        else if (key === 'displayName') where.displayName = { $like: `%${v}%` };
        else if (key === 'isActive') where.isActive = v === 'true';
      }
    }

    const whereQuery = where as FilterQuery<Role>;
    const [rows, total] = await Promise.all([
      this.em.find(Role, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Role, whereQuery),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getOptions(
    column: string,
    search?: string,
    limit = 50,
  ): Promise<Array<{ label: string; value: string }>> {
    return getOptionsFromModel(
      this.em.getRepository(Role),
      { deletedAt: null },
      column,
      ROLE_OPTIONS_CONFIG,
      search,
      limit,
    );
  }

  async getById(id: string): Promise<RoleRowDto | null> {
    const r = await this.em.findOne(Role, { id });
    return r ? mapRow(r) : null;
  }

  async create(data: {
    name: string;
    displayName: string;
    description?: string | null;
    permissions?: unknown;
    isActive?: boolean;
  }): Promise<RoleRowDto> {
    const created = new Role();
    created.name = data.name;
    created.displayName = data.displayName;
    created.description = data.description ?? null;
    created.permissions = data.permissions;
    created.isActive = data.isActive ?? true;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: {
      name?: string;
      displayName?: string;
      description?: string | null;
      permissions?: unknown;
      isActive?: boolean;
    },
  ): Promise<RoleRowDto | null> {
    const existing = await this.em.findOne(Role, { id });
    if (!existing) return null;

    if (data.name != null) existing.name = data.name;
    if (data.displayName != null) existing.displayName = data.displayName;
    if (data.description !== undefined) existing.description = data.description;
    if (data.permissions !== undefined) existing.permissions = data.permissions;
    if (data.isActive !== undefined) existing.isActive = data.isActive;
    await this.em.persistAndFlush(existing);
    const updated = existing;
    return mapRow(updated);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Role, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(Role, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Role, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }

  async bulk(
    action: 'delete' | 'restore' | 'hard-delete',
    ids: string[],
  ): Promise<{ affected: number; message: string }> {
    if (!ids.length) return { affected: 0, message: 'Không có bản ghi nào' };

    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        Role,
        { id: { $in: ids }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affected: result ?? 0,
        message: `Đã xóa ${result ?? 0} vai trò`,
      };
    }

    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        Role,
        { id: { $in: ids }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affected: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} vai trò`,
      };
    }

    if (action === 'hard-delete') {
      const entities = await this.em.find(Role, { id: { $in: ids } });
      await this.em.removeAndFlush(entities);
      const result = entities;
      return {
        affected: result.length,
        message: `Đã xóa vĩnh viễn ${result.length} vai trò`,
      };
    }

    return { affected: 0, message: 'Action không hợp lệ' };
  }
}
