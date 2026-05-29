import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { hash } from 'bcryptjs';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import {
  getOptionsFromModel,
  type GetOptionsConfig,
} from '../common/get-options';
import { safeIsoString, safeIsoStringNow } from '../common/date-utils';
import { Role } from '../entities/role.entity';
import { Setting } from '../entities/setting.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';

export interface UserRowDto {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  emailVerified: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  roles: Array<{ id: string; name: string; displayName: string }>;
}

export interface DevLoginOptionDto {
  id: string;
  email: string;
  name: string | null;
  roleNames: string[];
  roleLabels: string[];
  description: string;
}

export interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
}

export interface ListUsersResult {
  data: UserRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mapRow(user: User): UserRowDto {
  const roles =
    user.userRoles?.map((userRole) => ({
      id: userRole.role.id,
      name: userRole.role.name,
      displayName: userRole.role.displayName,
    })) ?? [];

  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? null,
    bio: user.bio ?? null,
    avatar: user.avatar ?? null,
    emailVerified: safeIsoString(user.emailVerified),
    phone: user.phone ?? null,
    address: user.address ?? null,
    isActive: user.isActive,
    createdAt: safeIsoStringNow(user.createdAt),
    updatedAt: safeIsoStringNow(user.updatedAt),
    deletedAt: safeIsoString(user.deletedAt),
    roles,
  };
}

function buildWhere(params: ListUsersParams): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const status = params.status ?? 'active';

  if (status === 'deleted') {
    where.deletedAt = { $ne: null };
  } else if (status === 'active') {
    where.deletedAt = null;
  }

  if (params.search?.trim()) {
    const search = `%${params.search.trim()}%`;
    where.$or = [
      { email: { $like: search } },
      { name: { $like: search } },
      { phone: { $like: search } },
    ];
  }

  if (params.filters) {
    for (const [key, raw] of Object.entries(params.filters)) {
      const value = (
        Array.isArray(raw)
          ? raw.length
            ? String(raw[0])
            : ''
          : raw != null
            ? String(raw)
            : ''
      ).trim();

      if (!value) continue;

      if (key === 'email') {
        where.email = { $like: `%${value}%` };
      } else if (key === 'name') {
        where.name = { $like: `%${value}%` };
      } else if (key === 'phone') {
        where.phone = { $like: `%${value}%` };
      } else if (key === 'isActive') {
        where.isActive = value === 'true';
      }
    }
  }

  return where;
}

const USER_OPTIONS_CONFIG: GetOptionsConfig = {
  id: { valueField: 'id', labelField: 'email', searchField: 'name' },
  name: { valueField: 'name', searchField: 'name' },
  email: { valueField: 'email', searchField: 'email' },
  '*': { valueField: 'email', searchField: 'email' },
};

@Injectable()
export class UsersService {
  constructor(private readonly em: EntityManager) {}

  private async getUserWithRoles(id: string): Promise<User | null> {
    return this.em.findOne(
      User,
      { id },
      {
        populate: ['userRoles', 'userRoles.role'],
        orderBy: { userRoles: { role: { name: 'ASC' } } },
      },
    );
  }

  async list(params: ListUsersParams): Promise<ListUsersResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );

    const where = buildWhere(params) as FilterQuery<User>;

    const [rows, total] = await Promise.all([
      this.em.find(User, where, {
        populate: ['userRoles', 'userRoles.role'],
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(User, where),
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
      this.em.getRepository(User),
      { deletedAt: null },
      column,
      USER_OPTIONS_CONFIG,
      search,
      limit,
    );
  }

  async listDevelopmentLoginOptions(): Promise<DevLoginOptionDto[]> {
    const rows = await this.em.find(
      User,
      { deletedAt: null },
      {
        populate: ['userRoles', 'userRoles.role'],
        orderBy: [{ name: 'ASC' }, { email: 'ASC' }],
      },
    );

    return rows
      .map((user) => {
        const roles = (user.userRoles ?? [])
          .map((userRole) => userRole.role)
          .filter((role): role is Role =>
            Boolean(role && role.deletedAt == null),
          );
        const roleNames = [...new Set(roles.map((role) => role.name.trim()))];
        const roleLabels = [
          ...new Set(
            roles
              .map((role) => role.displayName?.trim() || role.name.trim())
              .filter(Boolean),
          ),
        ];
        const statusLabel = user.isActive
          ? 'Đang hoạt động'
          : 'Ngừng hoạt động';
        const roleDescription =
          roleLabels.length > 0 ? roleLabels.join(', ') : 'Chưa gán vai trò';

        return {
          id: user.id,
          email: user.email ?? '',
          name: user.name ?? null,
          roleNames,
          roleLabels,
          description: `${statusLabel} | ${roleDescription}`,
        } satisfies DevLoginOptionDto;
      })
      .filter((user) => user.email.trim() !== '');
  }

  async getById(id: string): Promise<UserRowDto | null> {
    const user = await this.getUserWithRoles(id);
    return user ? mapRow(user) : null;
  }

  async create(data: {
    email: string;
    name?: string | null;
    password: string;
    bio?: string | null;
    avatar?: string | null;
    phone?: string | null;
    address?: string | null;
    isActive?: boolean;
    roleIds?: string[];
  }): Promise<UserRowDto> {
    const email = data.email.trim().toLowerCase();
    const passwordHash = await hash(data.password, 10);

    const created = new User();
    created.email = email;
    created.name = data.name?.trim() ?? null;
    created.password = passwordHash;
    created.bio = data.bio?.trim() ?? null;
    created.avatar = data.avatar?.trim() ?? null;
    created.phone = data.phone?.trim() ?? null;
    created.address = data.address?.trim() ?? null;
    created.isActive = data.isActive ?? true;
    this.em.persist(created);
    await this.em.flush();

    if (data.roleIds?.length) {
      for (const roleId of data.roleIds) {
        const userRole = new UserRole();
        userRole.user = created as any;
        userRole.role = roleId as any;
        this.em.persist(userRole);
      }
      await this.em.flush();
    } else {
      const setting = await this.em.findOne(Setting, {
        key: 'default_new_user_role',
      });
      const defaultRoleName =
        setting?.value && typeof setting.value === 'string'
          ? setting.value.trim().toLowerCase() || 'user'
          : 'user';
      const defaultRole = await this.em.findOne(Role, {
        name: defaultRoleName,
      });

      if (defaultRole) {
        const userRole = new UserRole();
        userRole.user = created as any;
        userRole.role = defaultRole as any;
        this.em.persist(userRole);
        await this.em.flush();
      }
    }

    const user = await this.getUserWithRoles(created.id);
    if (!user) {
      throw new Error(`Failed to refetch user ${created.id}`);
    }

    return mapRow(user);
  }

  async update(
    id: string,
    data: {
      email?: string;
      name?: string | null;
      password?: string;
      bio?: string | null;
      avatar?: string | null;
      phone?: string | null;
      address?: string | null;
      isActive?: boolean;
      roleIds?: string[];
    },
  ): Promise<UserRowDto | null> {
    const existing = await this.em.findOne(User, { id });
    if (!existing) return null;

    if (data.email != null) existing.email = data.email.trim().toLowerCase();
    if (data.name !== undefined) existing.name = data.name?.trim() ?? null;
    if (data.password != null && data.password !== '') {
      existing.password = await hash(data.password, 10);
    }
    if (data.bio !== undefined) existing.bio = data.bio?.trim() ?? null;
    if (data.avatar !== undefined)
      existing.avatar = data.avatar?.trim() ?? null;
    if (data.phone !== undefined) existing.phone = data.phone?.trim() ?? null;
    if (data.address !== undefined) {
      existing.address = data.address?.trim() ?? null;
    }
    if (data.isActive !== undefined) existing.isActive = data.isActive;

    this.em.persist(existing);
    await this.em.flush();

    if (data.roleIds !== undefined) {
      const roleIds = Array.isArray(data.roleIds)
        ? data.roleIds.filter((roleId) => String(roleId ?? '').trim() !== '')
        : [];

      await this.em.nativeDelete(UserRole, { user: id });

      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          const userRole = new UserRole();
          userRole.user = existing as any;
          userRole.role = roleId as any;
          this.em.persist(userRole);
        }
        await this.em.flush();
      }
    }

    const user = await this.getUserWithRoles(id);
    return user ? mapRow(user) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const user = await this.em.findOne(User, { id });
    if (!user || user.deletedAt) return false;
    user.deletedAt = new Date();
    this.em.persist(user);
    await this.em.flush();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const user = await this.em.findOne(User, { id });
    if (!user || !user.deletedAt) return false;
    user.deletedAt = null;
    this.em.persist(user);
    await this.em.flush();
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const user = await this.em.findOne(User, { id });
    if (!user) return false;
    this.em.remove(user);
    await this.em.flush();
    return true;
  }

  async bulk(
    action: 'delete' | 'restore' | 'hard-delete' | 'active' | 'unactive',
    ids: string[],
  ): Promise<{
    affected: number;
    message: string;
    affectedUserIds?: string[];
  }> {
    if (!ids.length) {
      return { affected: 0, message: 'Không có bản ghi nào' };
    }

    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        User,
        { id: { $in: ids }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affected: result ?? 0,
        message: `Đã xóa ${result ?? 0} người dùng`,
      };
    }

    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        User,
        { id: { $in: ids }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affected: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} người dùng`,
      };
    }

    if (action === 'hard-delete') {
      const users = await this.em.find(User, { id: { $in: ids } });
      if (users.length > 0) {
        for (const user of users) {
          this.em.remove(user);
        }
        await this.em.flush();
      }
      return {
        affected: users.length,
        message: `Đã xóa vĩnh viễn ${users.length} người dùng`,
      };
    }

    if (action === 'active') {
      const result = await this.em.nativeUpdate(
        User,
        { id: { $in: ids } },
        { isActive: true },
      );
      return {
        affected: result ?? 0,
        message: `Đã kích hoạt ${result ?? 0} người dùng`,
      };
    }

    if (action === 'unactive') {
      const superAdminRows = await this.em.find(
        UserRole,
        { role: { name: 'super_admin' } },
        { populate: ['user', 'role'] },
      );

      const superAdminIds = new Set(
        superAdminRows.map((userRole) => userRole.user.id),
      );
      const idsToUnactive = ids.filter((id) => !superAdminIds.has(id));

      if (!idsToUnactive.length) {
        return {
          affected: 0,
          message: 'Không thể hủy kích hoạt tài khoản Super Admin',
          affectedUserIds: [],
        };
      }

      const result = await this.em.nativeUpdate(
        User,
        { id: { $in: idsToUnactive } },
        { isActive: false },
      );

      return {
        affected: result ?? 0,
        message: `Đã hủy kích hoạt ${result ?? 0} người dùng`,
        affectedUserIds: idsToUnactive,
      };
    }

    return { affected: 0, message: 'Action không hợp lệ' };
  }
}
