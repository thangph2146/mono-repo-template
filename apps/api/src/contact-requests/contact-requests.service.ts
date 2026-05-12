/**
 * Contact Requests Admin API Service.
 * List, options, getById, update, softDelete, restore, hardDelete, bulk (delete, restore, hard-delete, mark-read, mark-unread, update-status), assign.
 */
import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { ContactRequest } from '../entities/contact-request.entity';
import { User } from '../entities/user.entity';
import { normalizePageLimit, paginationMeta } from '../common/pagination';
import { safeIsoString, safeIsoStringNow } from '../common/date-utils';

type ContactRequestWithAssigned = ContactRequest & {
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null;
};

export type ContactStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ContactPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ContactRequestRowDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  content: string;
  status: ContactStatus;
  priority: ContactPriority;
  isRead: boolean;
  assignedToName: string | null;
  assignedToId: string | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListContactRequestsParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all' | ContactStatus;
  filters?: Record<string, string>;
}

export interface ListContactRequestsResult {
  data: ContactRequestRowDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mapAssigneeFields(
  r: ContactRequestWithAssigned,
): Pick<
  ContactRequestRowDto,
  'assignedTo' | 'assignedToName' | 'assignedToId'
> {
  try {
    const u = r.assignedTo;
    if (
      u &&
      typeof u === 'object' &&
      'id' in u &&
      typeof (u as User).id === 'string'
    ) {
      return {
        assignedToName: (u as User).name ?? null,
        assignedToId: (u as User).id,
        assignedTo: {
          id: (u as User).id,
          name: (u as User).name ?? null,
          email: (u as User).email ?? '',
        },
      };
    }
  } catch {
    // Quan hệ chưa load / FK lỗi — không làm hỏng GET.
  }
  return {
    assignedToName: null,
    assignedToId: null,
    assignedTo: null,
  };
}

function mapRow(r: ContactRequestWithAssigned): ContactRequestRowDto {
  const assign = mapAssigneeFields(r);
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? null,
    subject: r.subject,
    content: r.content,
    status: r.status as ContactStatus,
    priority: r.priority as ContactPriority,
    isRead: r.isRead,
    ...assign,
    createdAt: safeIsoStringNow(r.createdAt),
    updatedAt: safeIsoStringNow(r.updatedAt),
    deletedAt: safeIsoString(r.deletedAt),
  };
}

function buildWhere(
  params: ListContactRequestsParams,
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const status = params.status ?? 'active';

  if (
    status === 'NEW' ||
    status === 'IN_PROGRESS' ||
    status === 'RESOLVED' ||
    status === 'CLOSED'
  ) {
    where.status = status;
    where.deletedAt = null;
  } else if (status === 'deleted') {
    where.deletedAt = { $ne: null };
  } else if (status === 'active') {
    where.deletedAt = null;
  }

  if (params.search?.trim()) {
    const q = params.search.trim();
    where.$or = [
      { name: { $like: `%${q}%` } },
      { email: { $like: `%${q}%` } },
      { phone: { $like: `%${q}%` } },
      { subject: { $like: `%${q}%` } },
      { content: { $like: `%${q}%` } },
    ];
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (!value?.trim()) continue;
      const v = value.trim();
      if (key === 'name') where.name = { $like: `%${v}%` };
      else if (key === 'email') where.email = { $like: `%${v}%` };
      else if (key === 'phone') where.phone = { $like: `%${v}%` };
      else if (key === 'subject') where.subject = { $like: `%${v}%` };
      else if (
        key === 'status' &&
        ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(v)
      )
        where.status = v as ContactStatus;
      else if (
        key === 'priority' &&
        ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(v)
      )
        where.priority = v as ContactPriority;
      else if (key === 'isRead') where.isRead = v === 'true';
      else if (key === 'assignedToId') where.assignedTo = v;
    }
  }

  return where;
}

@Injectable()
export class ContactRequestsService {
  constructor(private readonly em: EntityManager) {}

  async list(
    params: ListContactRequestsParams,
  ): Promise<ListContactRequestsResult> {
    const { page, limit, skip } = normalizePageLimit(
      params.page,
      params.limit,
      100,
    );
    const where = buildWhere(params) as FilterQuery<ContactRequest>;

    const [rows, total] = await Promise.all([
      this.em.find(ContactRequest, where, {
        populate: ['assignedTo'],
        orderBy: { updatedAt: 'DESC' },
        offset: skip,
        limit,
      }),
      this.em.count(ContactRequest, where),
    ]);

    return {
      data: rows.map((r) => mapRow(r as ContactRequestWithAssigned)),
      pagination: paginationMeta(page, limit, total),
    };
  }

  async getOptions(
    column: string,
    search?: string,
    limit: number = 50,
  ): Promise<Array<{ label: string; value: string }>> {
    const where: Record<string, unknown> = { deletedAt: null };
    if (search?.trim()) {
      const q = search.trim();
      if (column === 'name') where.name = { $like: `%${q}%` };
      else if (column === 'email') where.email = { $like: `%${q}%` };
      else if (column === 'phone') where.phone = { $like: `%${q}%` };
      else if (column === 'subject') where.subject = { $like: `%${q}%` };
      else where.name = { $like: `%${q}%` };
    }
    const rows = await this.em.find(
      ContactRequest,
      where as FilterQuery<ContactRequest>,
      {
        fields: [column as any] as any,
        orderBy: { [column]: 'ASC' } as any,
        limit,
      },
    );
    const seen = new Set<string>();
    return rows
      .map((r) => {
        const val = r[column as keyof ContactRequest];
        return typeof val === 'string' || typeof val === 'number'
          ? String(val)
          : null;
      })
      .filter(
        (v): v is string => v !== null && !seen.has(v) && (seen.add(v), true),
      )
      .map((value) => ({ label: value, value }));
  }

  async getById(id: string): Promise<ContactRequestRowDto | null> {
    const row = await this.em.findOne(
      ContactRequest,
      { id },
      { populate: ['assignedTo'] },
    );
    return row ? mapRow(row as ContactRequestWithAssigned) : null;
  }

  async update(
    id: string,
    data: {
      status?: ContactStatus;
      priority?: ContactPriority;
      isRead?: boolean;
      assignedToId?: string | null;
      name?: string;
      email?: string;
      phone?: string | null;
      subject?: string;
      content?: string;
    },
  ): Promise<ContactRequestRowDto | null> {
    const existing = await this.em.findOne(ContactRequest, { id });
    if (!existing) return null;

    if (data.status !== undefined) existing.status = data.status as any;
    if (data.priority !== undefined) existing.priority = data.priority as any;
    if (data.isRead !== undefined) existing.isRead = data.isRead;
    if (data.assignedToId !== undefined) {
      const v = data.assignedToId;
      if (v == null || (typeof v === 'string' && v.trim() === '')) {
        existing.assignedTo = null;
      } else {
        existing.assignedTo = v as any;
      }
    }
    if (data.name !== undefined) existing.name = data.name;
    if (data.email !== undefined) existing.email = data.email;
    if (data.phone !== undefined) existing.phone = data.phone;
    if (data.subject !== undefined) existing.subject = data.subject;
    if (data.content !== undefined) existing.content = data.content;

    this.em.persist(existing);
    await this.em.flush();

    const updated = await this.em.findOne(
      ContactRequest,
      { id },
      { populate: ['assignedTo'] },
    );
    return updated ? mapRow(updated as ContactRequestWithAssigned) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(ContactRequest, { id });
    if (!r || r.deletedAt) return false;
    r.deletedAt = new Date();
    this.em.persist(r);
    await this.em.flush();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const r = await this.em.findOne(ContactRequest, { id });
    if (!r || !r.deletedAt) return false;
    r.deletedAt = null;
    this.em.persist(r);
    await this.em.flush();
    return true;
  }

  async hardDelete(id: string): Promise<boolean> {
    const r = await this.em.findOne(ContactRequest, { id });
    if (!r) return false;
    this.em.remove(r);
    await this.em.flush();
    return true;
  }

  async bulk(
    action:
      | 'delete'
      | 'restore'
      | 'hard-delete'
      | 'mark-read'
      | 'mark-unread'
      | 'update-status',
    ids: string[],
    status?: ContactStatus,
  ): Promise<{ affectedCount: number; message: string }> {
    if (!ids.length)
      return { affectedCount: 0, message: 'Không có bản ghi nào' };

    if (action === 'update-status' && status) {
      const result = await this.em.nativeUpdate(
        ContactRequest,
        { id: { $in: ids }, deletedAt: null },
        { status: status as any },
      );
      return {
        affectedCount: result ?? 0,
        message: `Đã cập nhật trạng thái ${result ?? 0} bản ghi`,
      };
    }

    if (action === 'mark-read') {
      const result = await this.em.nativeUpdate(
        ContactRequest,
        { id: { $in: ids }, deletedAt: null, isRead: false },
        { isRead: true },
      );
      return {
        affectedCount: result ?? 0,
        message: `Đã đánh dấu đã đọc ${result ?? 0} bản ghi`,
      };
    }

    if (action === 'mark-unread') {
      const result = await this.em.nativeUpdate(
        ContactRequest,
        { id: { $in: ids }, deletedAt: null, isRead: true },
        { isRead: false },
      );
      return {
        affectedCount: result ?? 0,
        message: `Đã đánh dấu chưa đọc ${result ?? 0} bản ghi`,
      };
    }

    if (action === 'delete') {
      const result = await this.em.nativeUpdate(
        ContactRequest,
        { id: { $in: ids }, deletedAt: null },
        { deletedAt: new Date() },
      );
      return {
        affectedCount: result ?? 0,
        message: `Đã xóa ${result ?? 0} bản ghi`,
      };
    }

    if (action === 'restore') {
      const result = await this.em.nativeUpdate(
        ContactRequest,
        { id: { $in: ids }, deletedAt: { $ne: null } },
        { deletedAt: null },
      );
      return {
        affectedCount: result ?? 0,
        message: `Đã khôi phục ${result ?? 0} bản ghi`,
      };
    }

    if (action === 'hard-delete') {
      const result = await this.em.nativeDelete(ContactRequest, {
        id: { $in: ids },
      });
      return {
        affectedCount: result ?? 0,
        message: `Đã xóa vĩnh viễn ${result ?? 0} bản ghi`,
      };
    }

    return { affectedCount: 0, message: 'Action không hợp lệ' };
  }

  async assign(
    id: string,
    assignedToId: string | null,
  ): Promise<ContactRequestRowDto | null> {
    return this.update(id, { assignedToId });
  }
}
