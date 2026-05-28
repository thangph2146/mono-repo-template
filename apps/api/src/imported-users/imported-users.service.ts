import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { ImportedUser } from '../entities/imported-user.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface ImportedUserRowDto {
  id: number;
  accountId: string | null;
  lastName: string | null;
  middleName: string | null;
  firstName: string | null;
  accountType: string | null;
  fullName: string | null;
  mobilePhone: string | null;
  email: string | null;
  homePhone1: string | null;
  password: string | null;
  homePhone: string | null;
  avatar: string | null;
  canUploadAvatar: number;
  typeId: number | null;
  departmentId: number | null;
  status: number;
  refreshToken: string | null;
  refreshTokenExp: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ListImportedUsersParams {
  page: number;
  limit: number;
  search?: string;
}

export interface ListImportedUsersResult {
  data: ImportedUserRowDto[];
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

function mapRow(r: ImportedUser): ImportedUserRowDto {
  return {
    id: r.id,
    accountId: r.accountId ?? null,
    lastName: r.lastName ?? null,
    middleName: r.middleName ?? null,
    firstName: r.firstName ?? null,
    accountType: r.accountType ?? null,
    fullName: r.fullName ?? null,
    mobilePhone: r.mobilePhone ?? null,
    email: r.email ?? null,
    homePhone1: r.homePhone1 ?? null,
    password: r.password ?? null,
    homePhone: r.homePhone ?? null,
    avatar: r.avatar ?? null,
    canUploadAvatar: r.canUploadAvatar,
    typeId: r.typeId ?? null,
    departmentId: r.departmentId ?? null,
    status: r.status,
    refreshToken: r.refreshToken ?? null,
    refreshTokenExp: toIsoString(r.refreshTokenExp),
    createdAt: toIsoString(r.createdAt),
    updatedAt: toIsoString(r.updatedAt),
    deletedAt: toIsoString(r.deletedAt),
  };
}

@Injectable()
export class ImportedUsersService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListImportedUsersParams,
  ): Promise<ListImportedUsersResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = { deletedAt: null };

    if (params.search?.trim()) {
      const q = `%${params.search.trim()}%`;
      where.$or = [
        { fullName: { $like: q } },
        { email: { $like: q } },
        { mobilePhone: { $like: q } },
      ];
    }

    const whereQuery = where as FilterQuery<ImportedUser>;
    const [rows, total] = await Promise.all([
      this.em.find(ImportedUser, whereQuery, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(ImportedUser, whereQuery),
    ]);

    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getById(id: number): Promise<ImportedUserRowDto | null> {
    const r = await this.em.findOne(ImportedUser, { id });
    return r ? mapRow(r) : null;
  }

  async create(data: {
    accountId?: string | null;
    lastName?: string | null;
    middleName?: string | null;
    firstName?: string | null;
    accountType?: string | null;
    fullName?: string | null;
    mobilePhone?: string | null;
    email?: string | null;
    homePhone1?: string | null;
    password?: string | null;
    homePhone?: string | null;
    avatar?: string | null;
    canUploadAvatar?: number;
    typeId?: number | null;
    academicYearId?: number | null;
    trainingLevelId?: number | null;
    trainingSystemId?: number | null;
    majorId?: number | null;
    departmentId?: number | null;
    status?: number;
    refreshToken?: string | null;
    refreshTokenExp?: Date | null;
  }): Promise<ImportedUserRowDto> {
    const created = new ImportedUser();
    if (data.accountId != null) created.accountId = data.accountId;
    if (data.lastName != null) created.lastName = data.lastName;
    if (data.middleName != null) created.middleName = data.middleName;
    if (data.firstName != null) created.firstName = data.firstName;
    if (data.accountType != null) created.accountType = data.accountType;
    if (data.fullName != null) created.fullName = data.fullName;
    if (data.mobilePhone != null) created.mobilePhone = data.mobilePhone;
    if (data.email != null) created.email = data.email;
    if (data.homePhone1 != null) created.homePhone1 = data.homePhone1;
    if (data.password != null) created.password = data.password;
    if (data.homePhone != null) created.homePhone = data.homePhone;
    if (data.avatar != null) created.avatar = data.avatar;
    if (data.canUploadAvatar != null)
      created.canUploadAvatar = data.canUploadAvatar;
    if (data.typeId != null) created.typeId = data.typeId;
    created.academicYear = data.academicYearId
      ? ({ id: data.academicYearId } as any)
      : null;
    created.trainingLevel = data.trainingLevelId
      ? ({ id: data.trainingLevelId } as any)
      : null;
    created.trainingSystem = data.trainingSystemId
      ? ({ id: data.trainingSystemId } as any)
      : null;
    created.major = data.majorId ? ({ id: data.majorId } as any) : null;
    if (data.departmentId != null) created.departmentId = data.departmentId;
    if (data.status != null) created.status = data.status;
    if (data.refreshToken != null) created.refreshToken = data.refreshToken;
    if (data.refreshTokenExp != null)
      created.refreshTokenExp = data.refreshTokenExp;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: number,
    data: {
      accountId?: string | null;
      lastName?: string | null;
      middleName?: string | null;
      firstName?: string | null;
      accountType?: string | null;
      fullName?: string | null;
      mobilePhone?: string | null;
      email?: string | null;
      homePhone1?: string | null;
      password?: string | null;
      homePhone?: string | null;
      avatar?: string | null;
      canUploadAvatar?: number;
      typeId?: number | null;
      academicYearId?: number | null;
      trainingLevelId?: number | null;
      trainingSystemId?: number | null;
      majorId?: number | null;
      departmentId?: number | null;
      status?: number;
      refreshToken?: string | null;
      refreshTokenExp?: Date | null;
    },
  ): Promise<ImportedUserRowDto | null> {
    const existing = await this.em.findOne(ImportedUser, { id });
    if (!existing) return null;

    if (data.accountId !== undefined) existing.accountId = data.accountId;
    if (data.lastName !== undefined) existing.lastName = data.lastName;
    if (data.middleName !== undefined) existing.middleName = data.middleName;
    if (data.firstName !== undefined) existing.firstName = data.firstName;
    if (data.accountType !== undefined) existing.accountType = data.accountType;
    if (data.fullName !== undefined) existing.fullName = data.fullName;
    if (data.mobilePhone !== undefined) existing.mobilePhone = data.mobilePhone;
    if (data.email !== undefined) existing.email = data.email;
    if (data.homePhone1 !== undefined) existing.homePhone1 = data.homePhone1;
    if (data.password !== undefined) existing.password = data.password;
    if (data.homePhone !== undefined) existing.homePhone = data.homePhone;
    if (data.avatar !== undefined) existing.avatar = data.avatar;
    if (data.canUploadAvatar !== undefined)
      existing.canUploadAvatar = data.canUploadAvatar;
    if (data.typeId !== undefined) existing.typeId = data.typeId;
    if (data.academicYearId !== undefined) {
      existing.academicYear = data.academicYearId
        ? ({ id: data.academicYearId } as any)
        : null;
    }
    if (data.trainingLevelId !== undefined) {
      existing.trainingLevel = data.trainingLevelId
        ? ({ id: data.trainingLevelId } as any)
        : null;
    }
    if (data.trainingSystemId !== undefined) {
      existing.trainingSystem = data.trainingSystemId
        ? ({ id: data.trainingSystemId } as any)
        : null;
    }
    if (data.majorId !== undefined) {
      existing.major = data.majorId ? ({ id: data.majorId } as any) : null;
    }
    if (data.departmentId !== undefined)
      existing.departmentId = data.departmentId;
    if (data.status !== undefined) existing.status = data.status;
    if (data.refreshToken !== undefined)
      existing.refreshToken = data.refreshToken;
    if (data.refreshTokenExp !== undefined)
      existing.refreshTokenExp = data.refreshTokenExp;
    await this.em.persistAndFlush(existing);
    return mapRow(existing);
  }

  async softDelete(id: number): Promise<boolean> {
    const r = await this.em.findOne(ImportedUser, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: number): Promise<boolean> {
    const r = await this.em.findOne(ImportedUser, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const r = await this.em.findOne(ImportedUser, { id });
    if (!r) return false;
    await this.em.removeAndFlush(r);
    return true;
  }
}
