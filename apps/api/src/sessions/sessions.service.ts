import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';
import {
  resolveRelationFilters,
  type RelationFiltersConfig,
} from '../common/resolve-relation-filters';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import { AUTH_ROLE_NAMES } from '../config/constants';

export interface SessionRowDto {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  accessToken: string;
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  isActive: boolean;
  expiresAt: string;
  lastActivity: string;
  createdAt: string;
  deletedAt: null;
}

export interface ListSessionsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
}

export interface ListSessionsResult {
  data: SessionRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AccountWithSessionStatusDto {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  deletedAt: string | null;
  hasActiveSession: boolean;
  isSuperAdmin?: boolean;
}

export interface ListAccountsWithSessionStatusParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface ListAccountsWithSessionStatusResult {
  data: AccountWithSessionStatusDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SessionWithUser = Session & {
  user?: Pick<User, 'id' | 'name' | 'email'> | string | null;
};

function relationId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof (value as { id?: unknown }).id === 'string'
  ) {
    const id = (value as { id: string }).id.trim();
    return id || null;
  }
  return null;
}

function mapRow(s: SessionWithUser): SessionRowDto {
  const userId = relationId(s.user);
  const userName =
    s.user && typeof s.user === 'object' && 'name' in s.user
      ? ((s.user as { name?: string | null }).name ?? null)
      : null;
  const userEmail =
    s.user && typeof s.user === 'object' && 'email' in s.user
      ? ((s.user as { email?: string | null }).email ?? '')
      : '';
  return {
    id: s.id,
    userId: userId ?? '',
    userName,
    userEmail,
    accessToken: s.accessToken,
    refreshToken: s.refreshToken,
    userAgent: s.userAgent ?? null,
    ipAddress: s.ipAddress ?? null,
    isActive: s.isActive,
    expiresAt: s.expiresAt.toISOString(),
    lastActivity: s.lastActivity.toISOString(),
    createdAt: s.createdAt.toISOString(),
    deletedAt: null,
  };
}

function buildWhere(params: ListSessionsParams): FilterQuery<Session> {
  const where: Record<string, unknown> = {};
  const status = params.status ?? 'active';
  if (status === 'active') where.isActive = true;
  else if (status === 'deleted') where.isActive = false;

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (!value?.trim()) continue;
      const v = value.trim();
      if (key === 'userAgent') where.userAgent = { $like: `%${v}%` };
      else if (key === 'ipAddress') where.ipAddress = { $like: `%${v}%` };
      else if (key === 'userId') where.user = v;
      else if (key === 'isActive') where.isActive = value === 'true';
    }
  }

  if (params.search?.trim()) {
    const q = { $like: `%${params.search.trim()}%` };
    return [
      { ...where, accessToken: q },
      { ...where, refreshToken: q },
      { ...where, userAgent: q },
      { ...where, ipAddress: q },
      { ...where, user: { name: q } },
      { ...where, user: { email: q } },
    ] as FilterQuery<Session>;
  }

  return where as FilterQuery<Session>;
}

const SESSION_RELATION_FILTERS: RelationFiltersConfig = {
  userId: { model: 'user', nameField: 'email', softDelete: true },
};

@Injectable()
export class SessionsService {
  constructor(private readonly em: EntityManager) {}

  private readonly optionColumns = new Set<keyof Session>([
    'accessToken',
    'refreshToken',
    'userAgent',
    'ipAddress',
  ]);

  private async getOrCreateRole(
    name: string,
    displayName: string,
  ): Promise<{ id: string }> {
    let role = await this.em.findOne(Role, { name });
    if (!role) {
      role = new Role();
      role.name = name;
      role.displayName = displayName;
      role.isActive = true;
      this.em.persist(role);
      await this.em.flush();
    }
    return { id: role.id };
  }

  async list(params: ListSessionsParams): Promise<ListSessionsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const filters = await resolveRelationFilters(
      this.em,
      params.filters,
      SESSION_RELATION_FILTERS,
    );
    const where = buildWhere({ ...params, filters });

    const [rows, total] = await Promise.all([
      this.em.find(Session, where, {
        populate: ['user'],
        orderBy: { createdAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Session, where),
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
    if (!this.optionColumns.has(column as keyof Session)) {
      return [];
    }
    const optionColumn = column as keyof Session;
    const where: Record<string, unknown> = { isActive: true };
    if (search?.trim()) {
      where[optionColumn] = { $like: `%${search.trim()}%` };
    }
    const rows = await this.em.find(Session, where as FilterQuery<Session>, {
      fields: [optionColumn],
      limit,
    });
    const seen = new Set<string>();
    return rows
      .map((r) => r[optionColumn])
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
      .filter((v) => {
        if (seen.has(v)) return false;
        seen.add(v);
        return true;
      })
      .map((value) => ({ label: value, value }));
  }

  async create(data: {
    userId: string;
    email?: string | null;
    name?: string | null;
    avatar?: string | null;
    userAgent?: string | null;
    ipAddress?: string | null;
  }): Promise<SessionRowDto | null> {
    let user = await this.em.findOne(User, { id: data.userId });

    if (!user && data.email) {
      const userRole = await this.getOrCreateRole(AUTH_ROLE_NAMES.USER, 'User');
      const adminRole = await this.getOrCreateRole(
        AUTH_ROLE_NAMES.ADMIN,
        'Admin',
      );
      user = new User();
      user.id = data.userId;
      user.email = data.email;
      user.name = data.name ?? null;
      user.avatar = data.avatar ?? null;
      user.password = `oauth_${randomBytes(16).toString('hex')}`;
      user.isActive = true;
      this.em.persist(user);
      await this.em.flush();

      const ur1 = new UserRole();
      ur1.user = user;
      ur1.role = this.em.getReference(Role, userRole.id);
      this.em.persist(ur1);

      const ur2 = new UserRole();
      ur2.user = user;
      ur2.role = this.em.getReference(Role, adminRole.id);
      this.em.persist(ur2);
      await this.em.flush();
    }

    if (!user) return null;

    const accessToken = `at_${randomBytes(32).toString('hex')}`;
    const refreshToken = `rt_${randomBytes(32).toString('hex')}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const sessionObj = new Session();
    sessionObj.user = this.em.getReference(User, data.userId);
    sessionObj.accessToken = accessToken;
    sessionObj.refreshToken = refreshToken;
    sessionObj.userAgent = data.userAgent?.trim() ?? null;
    sessionObj.ipAddress = data.ipAddress?.trim() ?? null;
    sessionObj.isActive = true;
    sessionObj.expiresAt = expiresAt;
    sessionObj.lastActivity = new Date();
    this.em.persist(sessionObj);
    await this.em.flush();

    const savedSession = await this.em.findOne(
      Session,
      { id: sessionObj.id },
      { populate: ['user'] },
    );

    return savedSession ? mapRow(savedSession as SessionWithUser) : null;
  }

  async getById(id: string): Promise<SessionRowDto | null> {
    const s = await this.em.findOne(Session, { id }, { populate: ['user'] });
    return s ? mapRow(s as SessionWithUser) : null;
  }

  async update(
    id: string,
    data: {
      isActive?: boolean;
      userAgent?: string | null;
      ipAddress?: string | null;
    },
  ): Promise<SessionRowDto | null> {
    const existing = await this.em.findOne(Session, { id });
    if (!existing) return null;

    if (data.isActive !== undefined) existing.isActive = data.isActive;
    if (data.userAgent !== undefined)
      existing.userAgent = data.userAgent?.trim() ?? null;
    if (data.ipAddress !== undefined)
      existing.ipAddress = data.ipAddress?.trim() ?? null;

    this.em.persist(existing);
    await this.em.flush();
    return this.getById(id);
  }

  async softDelete(id: string): Promise<boolean> {
    const s = await this.em.findOne(Session, { id });
    if (!s || !s.isActive) return false;
    s.isActive = false;
    this.em.persist(s);
    await this.em.flush();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const s = await this.em.findOne(Session, { id });
    if (!s || s.isActive) return false;
    s.isActive = true;
    this.em.persist(s);
    await this.em.flush();
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const s = await this.em.findOne(Session, { id });
    if (!s) return false;
    this.em.remove(s);
    await this.em.flush();
    return true;
  }

  async bulk(
    action: 'delete' | 'restore' | 'hard-delete',
    ids: string[],
  ): Promise<{ success: boolean; message: string; affectedCount?: number }> {
    if (!ids.length) {
      return {
        success: true,
        message: 'Không có session nào',
        affectedCount: 0,
      };
    }

    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        Session,
        { id: { $in: ids }, isActive: true },
        { isActive: false },
      );
      return {
        success: true,
        message: `Đã xóa ${result ?? 0} session`,
        affectedCount: result ?? 0,
      };
    }

    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        Session,
        { id: { $in: ids }, isActive: false },
        { isActive: true },
      );
      return {
        success: true,
        message: `Đã khôi phục ${result ?? 0} session`,
        affectedCount: result ?? 0,
      };
    }

    if (action === 'hard-delete') {
      const result = await this.em.nativeDelete(Session, { id: { $in: ids } });
      return {
        success: true,
        message: `Đã xóa vĩnh viễn ${result ?? 0} session`,
        affectedCount: result ?? 0,
      };
    }

    return { success: false, message: 'Action không hợp lệ' };
  }

  async getActiveSessionUserIds(): Promise<string[]> {
    const rows = await this.em.find(
      Session,
      { isActive: true },
      { fields: ['user'] },
    );
    return [
      ...new Set(
        rows
          .map((r) => relationId(r.user))
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];
  }

  async getSuperAdminUserIds(): Promise<string[]> {
    const rows = await this.em.find(
      UserRole,
      { role: { name: 'super_admin' } },
      { populate: ['role', 'user'], fields: ['user'] },
    );
    return [
      ...new Set(
        rows
          .map((r) => relationId(r.user))
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];
  }

  async listAccountsWithSessionStatus(
    params: ListAccountsWithSessionStatusParams,
  ): Promise<ListAccountsWithSessionStatusResult> {
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
      const q = `%${params.search.trim()}%`;
      where.$or = [{ email: { $like: q } }, { name: { $like: q } }];
    }
    const whereQuery = where as FilterQuery<User>;
    const [users, total, activeUserIds, superAdminUserIds] = await Promise.all([
      this.em.find(User, whereQuery, {
        orderBy: { email: 'ASC' },
        offset: skip,
        limit,
      }),
      this.em.count(User, whereQuery),
      this.getActiveSessionUserIds(),
      this.getSuperAdminUserIds(),
    ]);

    const activeSet = new Set(activeUserIds);
    const superAdminSet = new Set(superAdminUserIds);
    const data: AccountWithSessionStatusDto[] = users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      name: u.name ?? null,
      isActive: u.isActive,
      deletedAt: u.deletedAt?.toISOString() ?? null,
      hasActiveSession: activeSet.has(u.id),
      isSuperAdmin: superAdminSet.has(u.id),
    }));

    return {
      data,
      pagination: paginationMeta(page, limit, total),
    };
  }

  async revokeAllSessionsByUserId(
    userId: string,
  ): Promise<{ count: number; sessionIds: string[] }> {
    const sessions = await this.em.find(
      Session,
      { user: userId, isActive: true },
      { fields: ['id'] },
    );
    if (!sessions.length) return { count: 0, sessionIds: [] };
    const ids = sessions.map((s) => s.id);
    await this.em.nativeUpdate(
      Session,
      { id: { $in: ids } },
      { isActive: false },
    );
    return { count: ids.length, sessionIds: ids };
  }

  async userHasSuperAdminRole(userId: string): Promise<boolean> {
    const count = await this.em.count(UserRole, {
      user: userId,
      role: { name: 'super_admin' },
    });
    return count > 0;
  }
}
