import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { User } from '../entities/user.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import {
  getOptionsFromModel,
  type GetOptionsConfig,
} from '../common/get-options';
import { Student } from '../entities/student.entity';

export interface StudentRowDto {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  studentCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListStudentsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
}

export interface ListStudentsResult {
  data: StudentRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mapRow(r: Student): StudentRowDto {
  const userId = (r.user as any)?.id ?? r.user ?? null;
  return {
    id: r.id,
    userId,
    name: r.name ?? null,
    email: r.email ?? null,
    studentCode: r.studentCode,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt?.toISOString() ?? null,
  };
}

const STUDENT_OPTIONS_CONFIG: GetOptionsConfig = {
  name: { valueField: 'name', searchField: 'name' },
  email: { valueField: 'email', searchField: 'email' },
  studentCode: { valueField: 'studentCode', searchField: 'studentCode' },
  '*': { valueField: 'studentCode', searchField: 'studentCode' },
};

@Injectable()
export class StudentsService {
  constructor(private readonly em: EntityManager) {}

  async list(params: ListStudentsParams): Promise<ListStudentsResult> {
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
        { studentCode: { $like: `%${q}%` } },
      ];
    }

    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (!value?.trim()) continue;
        const v = value.trim();
        if (key === 'name') {
          where.name = { $like: `%${v}%` };
        } else if (key === 'email') {
          where.email = { $like: `%${v}%` };
        } else if (key === 'studentCode') {
          where.studentCode = { $like: `%${v}%` };
        } else if (key === 'isActive') {
          where.isActive = v === 'true';
        }
      }
    }

    const whereQuery = where as FilterQuery<Student>;
    const [rows, total] = await Promise.all([
      this.em.find(Student, whereQuery, {
        populate: ['user'],
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(Student, whereQuery),
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
      this.em.getRepository(Student),
      { deletedAt: null },
      column,
      STUDENT_OPTIONS_CONFIG,
      search,
      limit,
    );
  }

  async getById(id: string): Promise<StudentRowDto | null> {
    const r = await this.em.findOne(Student, { id });
    return r ? mapRow(r) : null;
  }

  async create(data: {
    userId?: string | null;
    name?: string | null;
    email?: string | null;
    studentCode: string;
    isActive?: boolean;
  }): Promise<StudentRowDto> {
    const created = new Student();
    created.user = data.userId ? (data.userId as any) : null;
    created.name = data.name ?? null;
    created.email = data.email ?? null;
    created.studentCode = data.studentCode.trim();
    created.isActive = data.isActive ?? true;
    await this.em.persistAndFlush(created);
    return mapRow(created);
  }

  async update(
    id: string,
    data: {
      userId?: string | null;
      name?: string | null;
      email?: string | null;
      studentCode?: string;
      isActive?: boolean;
    },
  ): Promise<StudentRowDto | null> {
    const existing = await this.em.findOne(Student, { id });
    if (!existing) return null;

    if (data.userId !== undefined)
      existing.user = data.userId
        ? ((await this.em.findOne(User, { id: data.userId })) ?? null)
        : null;
    if (data.name !== undefined) existing.name = data.name;
    if (data.email !== undefined) existing.email = data.email;
    if (data.studentCode != null)
      existing.studentCode = data.studentCode.trim();
    if (data.isActive !== undefined) existing.isActive = data.isActive;
    await this.em.persistAndFlush(existing);
    const updated = existing;
    return mapRow(updated);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Student, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    await this.em.persistAndFlush(r);
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(Student, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    await this.em.persistAndFlush(r);
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(Student, { id });
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
        Student,
        { id: { $in: ids }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affected: result ?? 0,
        message: `Đã xóa ${result ?? 0} học viên`,
      };
    }

    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        Student,
        { id: { $in: ids }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affected: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} học viên`,
      };
    }

    if (action === 'hard-delete') {
      const entities = await this.em.find(Student, { id: { $in: ids } });
      await this.em.removeAndFlush(entities);
      const result = entities;
      return {
        affected: result.length,
        message: `Đã xóa vĩnh viễn ${result.length} học viên`,
      };
    }

    return { affected: 0, message: 'Action không hợp lệ' };
  }
}
