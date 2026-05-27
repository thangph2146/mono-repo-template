import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { ParentStudent } from '../entities/parent-student.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';

export interface ParentStudentRowDto {
  id: string;
  parentId: string;
  studentCode: string;
  studentName: string | null;
  note: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function toIso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

function mapRow(r: ParentStudent): ParentStudentRowDto {
  const parent = r.parent as unknown;
  return {
    id: r.id,
    parentId:
      parent != null && typeof parent === 'object' && 'id' in parent
        ? String((parent as { id: unknown }).id)
        : String(r.parent),
    studentCode: r.studentCode,
    studentName: r.studentName ?? null,
    note: r.note ?? null,
    status: r.status,
    reviewedBy: r.reviewedBy ?? null,
    reviewedAt: toIso(r.reviewedAt),
    createdAt: toIso(r.createdAt) ?? '',
    updatedAt: toIso(r.updatedAt) ?? '',
  };
}

@Injectable()
export class ParentStudentsService {
  constructor(private readonly em: EntityManager) {}

  async listByParent(parentId: string): Promise<ParentStudentRowDto[]> {
    const rows = await this.em.find(
      ParentStudent,
      { parent: parentId },
      { orderBy: { createdAt: 'DESC' } },
    );
    return rows.map(mapRow);
  }

  async listPending(params: { page: number; limit: number }): Promise<{
    data: ParentStudentRowDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const [rows, total] = await Promise.all([
      this.em.find(
        ParentStudent,
        { status: 'pending' },
        {
          populate: ['parent'],
          orderBy: { createdAt: 'ASC' },
          offset: skip,
          limit,
        },
      ),
      this.em.count(ParentStudent, { status: 'pending' }),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async listAll(params: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    createdAt?: string;
  }): Promise<{
    data: ParentStudentRowDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where: Record<string, unknown> = {};
    if (
      params.status &&
      ['pending', 'approved', 'rejected'].includes(params.status)
    ) {
      where.status = params.status;
    }
    if (params.search?.trim()) {
      const q = params.search.trim();
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      where.$or = [
        { studentCode: { $re: `(?i)${escaped}` } },
        { studentName: { $re: `(?i)${escaped}` } },
        { parentId: { $re: `(?i)${escaped}` } },
      ];
    }
    if (params.createdAt?.trim()) {
      const [fromStr, toStr] = params.createdAt.split(',');
      const dateRange: Record<string, Date> = {};
      if (fromStr?.trim()) {
        const fromDate = new Date(fromStr.trim());
        if (!isNaN(fromDate.getTime())) {
          dateRange.$gte = fromDate;
        }
      }
      if (toStr?.trim()) {
        const toDate = new Date(toStr.trim());
        toDate.setHours(23, 59, 59, 999);
        if (!isNaN(toDate.getTime())) {
          dateRange.$lte = toDate;
        }
      }
      if (Object.keys(dateRange).length > 0) {
        where.createdAt = dateRange;
      }
    }
    const [rows, total] = await Promise.all([
      this.em.find(ParentStudent, where, {
        populate: ['parent'],
        orderBy: { createdAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(ParentStudent, where),
    ]);
    return {
      data: rows.map(mapRow),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async addStudentRequest(data: {
    parentId: string;
    studentCode: string;
    studentName?: string;
    note?: string;
  }): Promise<ParentStudentRowDto> {
    const existing = await this.em.findOne(ParentStudent, {
      parent: data.parentId,
      studentCode: data.studentCode.trim(),
    });
    if (existing) {
      throw new Error('Bạn đã gửi yêu cầu liên kết với mã sinh viên này rồi.');
    }

    const ps = new ParentStudent();
    ps.parent = data.parentId as any;
    ps.studentCode = data.studentCode.trim();
    ps.studentName = data.studentName?.trim() ?? null;
    ps.note = data.note?.trim() ?? null;
    ps.status = 'pending';
    await this.em.persistAndFlush(ps);
    return mapRow(ps);
  }

  async review(
    id: string,
    action: 'approved' | 'rejected',
    reviewedBy: string,
  ): Promise<ParentStudentRowDto | null> {
    const ps = await this.em.findOne(ParentStudent, { id });
    if (!ps) return null;
    ps.status = action;
    ps.reviewedBy = reviewedBy;
    ps.reviewedAt = new Date();
    await this.em.persistAndFlush(ps);
    return mapRow(ps);
  }

  async remove(id: string, parentId: string): Promise<boolean> {
    const ps = await this.em.findOne(ParentStudent, { id, parent: parentId });
    if (!ps) return false;
    await this.em.removeAndFlush(ps);
    return true;
  }

  async getById(id: string): Promise<ParentStudentRowDto | null> {
    const ps = await this.em.findOne(
      ParentStudent,
      { id },
      { populate: ['parent'] },
    );
    return ps ? mapRow(ps) : null;
  }
}
