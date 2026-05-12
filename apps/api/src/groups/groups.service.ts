import { Injectable, Logger } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Group } from '../entities/group.entity';
import { GroupMember, GroupRole } from '../entities/group-member.entity';
import { Message } from '../entities/message.entity';
import { MessageRead } from '../entities/message-read.entity';
import { User } from '../entities/user.entity';

export interface CreateGroupInput {
  name: string;
  description?: string | null;
  avatar?: string | null;
  memberIds: string[];
}

export interface ListGroupsInput {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
}

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

function mapGroupWithMembers(group: Group) {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? null,
    avatar: group.avatar ?? null,
    createdById: relationId(group.creator),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
    deletedAt: group.deletedAt?.toISOString() ?? null,
    members: (group.members || []).map((m: any) => ({
      id: m.id,
      groupId: relationId(m.group),
      userId: relationId(m.user),
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      leftAt: m.leftAt?.toISOString() ?? null,
      user: m.user,
    })),
    memberCount: (group.members || []).length,
  };
}

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(private readonly em: EntityManager) {}

  async create(createdById: string, input: CreateGroupInput) {
    const { name, description, avatar, memberIds } = input;
    const nameTrim = (name ?? '').trim();
    if (!nameTrim) {
      throw new Error('Tên nhóm là bắt buộc');
    }
    const existing = await this.em.findOne(Group, {
      name: nameTrim,
      deletedAt: null,
      members: { user: createdById, leftAt: null },
    });
    if (existing) {
      throw new Error('Đã tồn tại nhóm với tên này. Vui lòng chọn tên khác.');
    }
    const uniqueIds = Array.from(
      new Set([createdById, ...(memberIds ?? []).filter(Boolean)]),
    );

    const group = new Group();
    group.name = nameTrim;
    group.description = description?.trim() || null;
    group.avatar = avatar?.trim() || null;
    group.creator = this.em.getReference(User, createdById);
    this.em.persist(group);
    await this.em.flush();

    for (const userId of uniqueIds) {
      const member = new GroupMember();
      member.group = this.em.getReference(Group, group.id);
      member.user = this.em.getReference(User, userId);
      member.role = userId === createdById ? GroupRole.OWNER : GroupRole.MEMBER;
      member.joinedAt = new Date();
      this.em.persist(member);
    }
    await this.em.flush();

    const groupWithMembers = await this.em.findOne(
      Group,
      { id: group.id },
      { populate: ['members', 'members.user', 'creator'] },
    );

    if (!groupWithMembers) {
      throw new Error('Không tìm thấy nhóm sau khi tạo');
    }

    return mapGroupWithMembers(groupWithMembers);
  }

  async list(userId: string, input: ListGroupsInput) {
    const { page, limit, search, includeDeleted } = input;
    const where: Record<string, unknown> = {
      members: { user: userId, leftAt: null },
    };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (search?.trim()) {
      const term = search.trim();
      where.$or = [
        { name: { $like: `%${term}%` } },
        { description: { $like: `%${term}%` } },
      ];
    }
    const [data, total] = await Promise.all([
      this.em.find(Group, where as FilterQuery<Group>, {
        populate: ['members', 'members.user', 'creator'],
        orderBy: { updatedAt: 'DESC' },
        offset: (page - 1) * limit,
        limit,
      }),
      this.em.count(Group, where as FilterQuery<Group>),
    ]);
    return {
      data: data.map(mapGroupWithMembers),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findById(id: string, userId: string) {
    const group = await this.em.findOne(
      Group,
      {
        id,
        deletedAt: null,
        members: { user: userId, leftAt: null },
      },
      { populate: ['members', 'members.user', 'creator'] },
    );
    if (!group) return null;
    return mapGroupWithMembers(group);
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; description?: string; avatar?: string },
  ) {
    const group = await this.em.findOne(
      Group,
      {
        id,
        deletedAt: null,
        members: { user: userId, leftAt: null },
      },
      { populate: ['members'] },
    );
    if (!group) return null;
    if (data.name != null) group.name = data.name.trim();
    if (data.description !== undefined)
      group.description = data.description?.trim() || null;
    if (data.avatar !== undefined) group.avatar = data.avatar?.trim() || null;
    this.em.persist(group);
    await this.em.flush();
    const updated = await this.em.findOne(
      Group,
      { id },
      { populate: ['members', 'members.user', 'creator'] },
    );
    return updated ? mapGroupWithMembers(updated) : null;
  }

  async softDelete(id: string, userId: string): Promise<boolean> {
    const group = await this.em.findOne(
      Group,
      {
        id,
        deletedAt: null,
        members: { user: userId, leftAt: null },
      },
      { populate: ['members'] },
    );
    if (!group) return false;
    group.deletedAt = new Date();
    this.em.persist(group);
    await this.em.flush();
    return true;
  }

  async restore(id: string, userId: string): Promise<boolean> {
    void userId; // Reserved for future permission check
    const group = await this.em.findOne(Group, { id });
    if (!group || !group.deletedAt) return false;
    group.deletedAt = null;
    this.em.persist(group);
    await this.em.flush();
    return true;
  }

  async hardDelete(id: string, userId: string): Promise<boolean> {
    void userId; // Reserved for future permission check
    const group = await this.em.findOne(Group, { id });
    if (!group) return false;
    this.em.remove(group);
    await this.em.flush();
    return true;
  }

  async addMembers(
    groupId: string,
    userId: string,
    memberIds: string[],
  ): Promise<boolean> {
    const group = await this.em.findOne(
      Group,
      {
        id: groupId,
        deletedAt: null,
        members: { user: userId, leftAt: null },
      },
      { populate: ['members'] },
    );
    if (!group) return false;
    const existing = await this.em.find(
      GroupMember,
      { group: groupId, leftAt: null },
      { fields: ['user'] },
    );
    const existingIds = new Set(
      existing
        .map((m) => relationId(m.user))
        .filter((id): id is string => typeof id === 'string'),
    );
    const toAdd = memberIds.filter(
      (id) => id?.trim() && !existingIds.has(id.trim()),
    );
    if (toAdd.length === 0) return true;
    for (const uid of toAdd) {
      const member = new GroupMember();
      member.group = this.em.getReference(Group, groupId);
      member.user = this.em.getReference(User, uid.trim());
      member.role = GroupRole.MEMBER;
      member.joinedAt = new Date();
      this.em.persist(member);
    }
    await this.em.flush();
    return true;
  }

  async removeMember(
    groupId: string,
    userId: string,
    memberUserId: string,
  ): Promise<boolean> {
    const group = await this.em.findOne(
      Group,
      {
        id: groupId,
        deletedAt: null,
        members: { user: userId, leftAt: null },
      },
      { populate: ['members'] },
    );
    if (!group) return false;
    const member = await this.em.findOne(GroupMember, {
      group: groupId,
      user: memberUserId.trim(),
      leftAt: null,
    });
    if (!member) return false;
    member.leftAt = new Date();
    this.em.persist(member);
    await this.em.flush();
    return true;
  }

  async updateMemberRole(
    groupId: string,
    userId: string,
    memberUserId: string,
    role: 'ADMIN' | 'MEMBER',
  ): Promise<boolean> {
    const group = await this.em.findOne(
      Group,
      {
        id: groupId,
        deletedAt: null,
        members: { user: userId, leftAt: null },
      },
      { populate: ['members'] },
    );
    if (!group) return false;
    const members = group.members || [];
    const currentMember = members.find((m) => relationId(m.user) === userId);
    const targetMember = members.find(
      (m) => relationId(m.user) === memberUserId.trim(),
    );
    if (!currentMember || !targetMember) return false;
    if (currentMember.role !== GroupRole.OWNER) return false;
    if (targetMember.role === GroupRole.OWNER) return false;
    const newRole = role === 'ADMIN' ? GroupRole.ADMIN : GroupRole.MEMBER;
    const member = await this.em.findOne(GroupMember, {
      id: targetMember.id,
    });
    if (!member) return false;
    member.role = newRole;
    this.em.persist(member);
    await this.em.flush();
    return true;
  }

  async markRead(groupId: string, userId: string): Promise<boolean> {
    const group = await this.em.findOne(
      Group,
      {
        id: groupId,
        deletedAt: null,
        members: { user: userId, leftAt: null },
      },
      { populate: ['members'] },
    );
    if (!group) return false;
    const messages = await this.em.find(
      Message,
      { group: groupId, deletedAt: null },
      { fields: ['id'] },
    );
    const messageIds = messages.map((m) => m.id);
    const existing = await this.em.find(
      MessageRead,
      { user: userId, message: { $in: messageIds } },
      { fields: ['message'] },
    );
    const existingIds = new Set(
      existing
        .map((r) => relationId(r.message))
        .filter((id): id is string => typeof id === 'string'),
    );
    const toCreate = messages.filter((m) => !existingIds.has(m.id));
    if (toCreate.length > 0) {
      for (const m of toCreate) {
        const read = new MessageRead();
        read.message = this.em.getReference(Message, m.id);
        read.user = this.em.getReference(User, userId);
        this.em.persist(read);
      }
      await this.em.flush();
    }
    return true;
  }

  async getMessages(
    groupId: string,
    userId: string,
    limit: number = 100,
  ): Promise<
    Array<{
      id: string;
      content: string;
      senderId: string | null;
      receiverId: string | null;
      timestamp: string;
      isRead: boolean;
      replyToId: string | null;
    }>
  > {
    const group = await this.em.findOne(
      Group,
      {
        id: groupId,
        deletedAt: null,
        members: { user: userId, leftAt: null },
      },
      { populate: ['members'] },
    );
    if (!group) return [];
    const messages = await this.em.find(
      Message,
      { group: groupId, deletedAt: null },
      {
        orderBy: { createdAt: 'ASC' },
        limit,
        populate: ['sender', 'receiver', 'parent'],
      },
    );
    const messageIds = messages.map((m) => m.id);
    const reads = await this.em.find(
      MessageRead,
      { user: userId, message: { $in: messageIds } },
      { fields: ['message'] },
    );
    const readSet = new Set(
      reads
        .map((r) => relationId(r.message))
        .filter((id): id is string => typeof id === 'string'),
    );
    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: relationId(m.sender),
      receiverId: relationId(m.receiver),
      timestamp: m.createdAt.toISOString(),
      isRead: readSet.has(m.id),
      replyToId: relationId(m.parent),
    }));
  }
}
