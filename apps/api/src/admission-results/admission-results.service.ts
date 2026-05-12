import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { AdmissionResult } from '../entities/admission-result.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import { safeIsoString, safeIsoStringNow } from '../common/date-utils';

export interface AdmissionResultRowDto {
  id: string;
  cccd: string | null;
  soBaoDanh: string | null;
  hoTen: string;
  nganhDangKy: string;
  diemMon1: string | null;
  diemMon2: string | null;
  diemMon3: string | null;
  diemTong: string | null;
  diemUuTienKhuVuc: string | null;
  diemUuTienDoiTuong: string | null;
  ghiChu: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListAdmissionResultsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
  filters?: Record<string, string>;
}

export interface ListAdmissionResultsResult {
  data: AdmissionResultRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mapRow(r: AdmissionResult): AdmissionResultRowDto {
  return {
    id: r.id,
    cccd: r.cccd ?? null,
    soBaoDanh: r.soBaoDanh ?? null,
    hoTen: r.hoTen,
    nganhDangKy: r.nganhDangKy,
    diemMon1: r.diemMon1 ?? null,
    diemMon2: r.diemMon2 ?? null,
    diemMon3: r.diemMon3 ?? null,
    diemTong: r.diemTong ?? null,
    diemUuTienKhuVuc: r.diemUuTienKhuVuc ?? null,
    diemUuTienDoiTuong: r.diemUuTienDoiTuong ?? null,
    ghiChu: r.ghiChu ?? null,
    createdAt: safeIsoStringNow(r.createdAt),
    updatedAt: safeIsoStringNow(r.updatedAt),
    deletedAt: safeIsoString(r.deletedAt),
  };
}

function buildWhere(
  params: ListAdmissionResultsParams,
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const status = params.status ?? 'active';
  if (status === 'deleted') where.deletedAt = { $ne: null };
  else if (status === 'active') where.deletedAt = null;
  if (params.search?.trim()) {
    const q = params.search.trim();
    where.$or = [
      { hoTen: { $like: `%${q}%` } },
      { nganhDangKy: { $like: `%${q}%` } },
      { cccd: { $like: `%${q}%` } },
      { soBaoDanh: { $like: `%${q}%` } },
    ];
  }
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (!value?.trim()) continue;
      const v = value.trim();
      if (key === 'hoTen') where.hoTen = { $like: `%${v}%` };
      else if (key === 'nganhDangKy') where.nganhDangKy = { $like: `%${v}%` };
      else if (key === 'cccd') where.cccd = { $like: `%${v}%` };
      else if (key === 'soBaoDanh') where.soBaoDanh = { $like: `%${v}%` };
    }
  }
  return where;
}

@Injectable()
export class AdmissionResultsService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListAdmissionResultsParams,
  ): Promise<ListAdmissionResultsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where = buildWhere(params) as FilterQuery<AdmissionResult>;
    const [rows, total] = await Promise.all([
      this.em.find(AdmissionResult, where, {
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(AdmissionResult, where),
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
    const where: Record<string, unknown> = { deletedAt: null };
    if (search?.trim()) {
      const q = search.trim();
      if (column === 'hoTen') where.hoTen = { $like: `%${q}%` };
      else if (column === 'nganhDangKy')
        where.nganhDangKy = { $like: `%${q}%` };
      else if (column === 'soBaoDanh') where.soBaoDanh = { $like: `%${q}%` };
      else where.hoTen = { $like: `%${q}%` };
    }
    const rows = await this.em.find(
      AdmissionResult,
      where as FilterQuery<AdmissionResult>,
      {
        fields: [column as any] as any,
        orderBy: { [column]: 'ASC' } as any,
        limit,
      },
    );
    const seen = new Set<string>();
    return rows
      .map((r) => String(r[column as keyof AdmissionResult]))
      .filter((v) => v && !seen.has(v) && (seen.add(v), true))
      .map((value) => ({ label: value, value }));
  }

  async getById(id: string): Promise<AdmissionResultRowDto | null> {
    const r = await this.em.findOne(AdmissionResult, { id });
    return r ? mapRow(r) : null;
  }

  async lookup(
    cccd: string,
    soBaoDanh: string,
  ): Promise<AdmissionResultRowDto | null> {
    const r = await this.em.findOne(AdmissionResult, {
      cccd: cccd.trim(),
      soBaoDanh: soBaoDanh.trim(),
      deletedAt: null,
    });
    return r ? mapRow(r) : null;
  }

  async create(data: {
    cccd?: string | null;
    soBaoDanh?: string | null;
    hoTen: string;
    nganhDangKy: string;
    diemMon1?: string | null;
    diemMon2?: string | null;
    diemMon3?: string | null;
    diemTong?: string | null;
    diemUuTienKhuVuc?: string | null;
    diemUuTienDoiTuong?: string | null;
    ghiChu?: string | null;
  }): Promise<AdmissionResultRowDto> {
    const entity = new AdmissionResult();
    entity.cccd = data.cccd?.trim() ?? null;
    entity.soBaoDanh = data.soBaoDanh?.trim() ?? null;
    entity.hoTen = data.hoTen.trim();
    entity.nganhDangKy = data.nganhDangKy.trim();
    entity.diemMon1 = data.diemMon1?.trim() ?? null;
    entity.diemMon2 = data.diemMon2?.trim() ?? null;
    entity.diemMon3 = data.diemMon3?.trim() ?? null;
    entity.diemTong = data.diemTong?.trim() ?? null;
    entity.diemUuTienKhuVuc = data.diemUuTienKhuVuc?.trim() ?? null;
    entity.diemUuTienDoiTuong = data.diemUuTienDoiTuong?.trim() ?? null;
    entity.ghiChu = data.ghiChu?.trim() ?? null;
    this.em.persist(entity);
    await this.em.flush();
    return mapRow(entity);
  }

  async update(
    id: string,
    data: {
      cccd?: string | null;
      soBaoDanh?: string | null;
      hoTen?: string;
      nganhDangKy?: string;
      diemMon1?: string | null;
      diemMon2?: string | null;
      diemMon3?: string | null;
      diemTong?: string | null;
      diemUuTienKhuVuc?: string | null;
      diemUuTienDoiTuong?: string | null;
      ghiChu?: string | null;
    },
  ): Promise<AdmissionResultRowDto | null> {
    const existing = await this.em.findOne(AdmissionResult, { id });
    if (!existing) return null;
    if (data.cccd !== undefined) existing.cccd = data.cccd?.trim() ?? null;
    if (data.soBaoDanh !== undefined)
      existing.soBaoDanh = data.soBaoDanh?.trim() ?? null;
    if (data.hoTen != null) existing.hoTen = data.hoTen.trim();
    if (data.nganhDangKy != null)
      existing.nganhDangKy = data.nganhDangKy.trim();
    if (data.diemMon1 !== undefined)
      existing.diemMon1 = data.diemMon1?.trim() ?? null;
    if (data.diemMon2 !== undefined)
      existing.diemMon2 = data.diemMon2?.trim() ?? null;
    if (data.diemMon3 !== undefined)
      existing.diemMon3 = data.diemMon3?.trim() ?? null;
    if (data.diemTong !== undefined)
      existing.diemTong = data.diemTong?.trim() ?? null;
    if (data.diemUuTienKhuVuc !== undefined)
      existing.diemUuTienKhuVuc = data.diemUuTienKhuVuc?.trim() ?? null;
    if (data.diemUuTienDoiTuong !== undefined)
      existing.diemUuTienDoiTuong = data.diemUuTienDoiTuong?.trim() ?? null;
    if (data.ghiChu !== undefined)
      existing.ghiChu = data.ghiChu?.trim() ?? null;
    this.em.persist(existing);
    await this.em.flush();
    return mapRow(existing);
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(AdmissionResult, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    this.em.persist(r);
    await this.em.flush();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(AdmissionResult, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    this.em.persist(r);
    await this.em.flush();
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(AdmissionResult, { id });
    if (!r) return false;
    this.em.remove(r);
    await this.em.flush();
    return true;
  }

  async bulk(
    action: 'delete' | 'restore' | 'hard-delete',
    ids: string[],
  ): Promise<{ affected: number; message: string }> {
    if (!ids.length) return { affected: 0, message: 'Không có bản ghi nào' };
    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        AdmissionResult,
        { id: { $in: ids }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affected: result ?? 0,
        message: `Đã xóa ${result ?? 0} kết quả`,
      };
    }
    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        AdmissionResult,
        { id: { $in: ids }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affected: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} kết quả`,
      };
    }
    if (action === 'hard-delete') {
      const result = await this.em.nativeDelete(AdmissionResult, {
        id: { $in: ids },
      });
      return {
        affected: result ?? 0,
        message: `Đã xóa vĩnh viễn ${result ?? 0} kết quả`,
      };
    }
    return { affected: 0, message: 'Action không hợp lệ' };
  }
}
