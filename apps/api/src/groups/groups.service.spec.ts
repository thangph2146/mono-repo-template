import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { GroupsService } from './groups.service';
import { Group } from '../entities/group.entity';
import { GroupMember, GroupRole } from '../entities/group-member.entity';

describe('GroupsService', () => {
  let service: GroupsService;
  let em: Partial<EntityManager>;

  const mockGroup = {
    id: 'group-1',
    name: 'Test Group',
    description: 'Test description',
    avatar: null,
    creator: { id: 'user-1' },
    members: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  } as unknown as Group;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
      getReference: jest.fn().mockImplementation((entity, id) => ({ id })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  describe('create', () => {
    it('should create group with members', async () => {
      const groupWithMembers = {
        ...mockGroup,
        id: 'new-group',
        name: 'New Group',
        members: [
          {
            id: 'member-1',
            user: { id: 'user-1' },
            role: GroupRole.OWNER,
            joinedAt: new Date(),
            leftAt: null,
            group: { id: 'new-group' },
          },
          {
            id: 'member-2',
            user: { id: 'user-2' },
            role: GroupRole.MEMBER,
            joinedAt: new Date(),
            leftAt: null,
            group: { id: 'new-group' },
          },
        ],
        creator: { id: 'user-1' },
      };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(groupWithMembers);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.create('user-1', {
        name: 'New Group',
        memberIds: ['user-2'],
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw when name is empty', async () => {
      await expect(
        service.create('user-1', { name: '   ', memberIds: [] }),
      ).rejects.toThrow('Tên nhóm là bắt buộc');
    });

    it('should throw when group name already exists', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockGroup);

      await expect(
        service.create('user-1', { name: 'Test Group', memberIds: [] }),
      ).rejects.toThrow('Đã tồn tại nhóm với tên này');
    });
  });

  describe('list', () => {
    it('should return paginated groups', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockGroup]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list('user-1', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Group');
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list('user-1', {
        page: 1,
        limit: 10,
        search: 'test',
      });

      expect(em.find).toHaveBeenCalled();
    });

    it('should include deleted when requested', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list('user-1', {
        page: 1,
        limit: 10,
        includeDeleted: true,
      });

      expect(em.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return group by id', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockGroup);

      const result = await service.findById('group-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Group');
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findById('nonexistent', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update group fields', async () => {
      const existing = { ...mockGroup };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, name: 'Updated Group' });

      const result = await service.update('group-1', 'user-1', {
        name: 'Updated Group',
        description: 'Updated description',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Group');
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', 'user-1', {
        name: 'New',
      });

      expect(result).toBeNull();
    });

    it('should trim name field', async () => {
      const existing = { ...mockGroup };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);

      await service.update('group-1', 'user-1', { name: '  Trimmed  ' });

      expect(existing.name).toBe('Trimmed');
    });
  });

  describe('softDelete', () => {
    it('should soft delete group', async () => {
      const group = { ...mockGroup, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(group);

      const result = await service.softDelete('group-1', 'user-1');

      expect(result).toBe(true);
      expect(group.deletedAt).not.toBeNull();
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent', 'user-1');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('group-1', 'user-1');

      expect(result).toBe(false);
    });

    it('should return false when user is not a member', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('group-1', 'non-member');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted group', async () => {
      const group = { ...mockGroup, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(group);

      const result = await service.restore('group-1', 'user-1');

      expect(result).toBe(true);
      expect(group.deletedAt).toBeNull();
    });

    it('should return false when not deleted', async () => {
      const group = { ...mockGroup, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(group);

      const result = await service.restore('group-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete group', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockGroup);

      const result = await service.hardDelete('group-1', 'user-1');

      expect(result).toBe(true);
      expect(em.remove).toHaveBeenCalled();
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('addMembers', () => {
    it('should add members to group', async () => {
      const group = { ...mockGroup, members: [] };
      (em.findOne as jest.Mock).mockResolvedValue(group);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.addMembers('group-1', 'user-1', [
        'user-2',
        'user-3',
      ]);

      expect(result).toBe(true);
      expect(em.persist).toHaveBeenCalled();
    });

    it('should return false when group not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.addMembers('nonexistent', 'user-1', [
        'user-2',
      ]);

      expect(result).toBe(false);
    });

    it('should skip existing members', async () => {
      const group = { ...mockGroup, members: [] };
      (em.findOne as jest.Mock).mockResolvedValue(group);
      (em.find as jest.Mock).mockResolvedValue([{ user: { id: 'user-2' } }]);

      const result = await service.addMembers('group-1', 'user-1', ['user-2']);

      expect(result).toBe(true);
    });
  });

  describe('removeMember', () => {
    it('should remove member from group', async () => {
      const group = { ...mockGroup, members: [] };
      const member = {
        id: 'member-1',
        leftAt: null,
        user: { id: 'user-2' },
      } as unknown as GroupMember;
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(group)
        .mockResolvedValueOnce(member);

      const result = await service.removeMember('group-1', 'user-1', 'user-2');

      expect(result).toBe(true);
      expect(member.leftAt).not.toBeNull();
    });

    it('should return false when group not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.removeMember(
        'nonexistent',
        'user-1',
        'user-2',
      );

      expect(result).toBe(false);
    });

    it('should return false when member not found', async () => {
      const group = { ...mockGroup, members: [] };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(group)
        .mockResolvedValueOnce(null);

      const result = await service.removeMember('group-1', 'user-1', 'user-2');

      expect(result).toBe(false);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role to ADMIN', async () => {
      const group = {
        ...mockGroup,
        members: [
          {
            id: 'member-1',
            user: { id: 'user-1' },
            role: GroupRole.OWNER,
          },
          {
            id: 'member-2',
            user: { id: 'user-2' },
            role: GroupRole.MEMBER,
          },
        ],
      };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(group)
        .mockResolvedValueOnce({ id: 'member-2', role: GroupRole.MEMBER });

      const result = await service.updateMemberRole(
        'group-1',
        'user-1',
        'user-2',
        'ADMIN',
      );

      expect(result).toBe(true);
    });

    it('should return false when not owner', async () => {
      const group = {
        ...mockGroup,
        members: [
          {
            id: 'member-1',
            user: { id: 'user-1' },
            role: GroupRole.MEMBER,
          },
        ],
      };
      (em.findOne as jest.Mock).mockResolvedValue(group);

      const result = await service.updateMemberRole(
        'group-1',
        'user-1',
        'user-2',
        'ADMIN',
      );

      expect(result).toBe(false);
    });

    it('should return false when group not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.updateMemberRole(
        'nonexistent',
        'user-1',
        'user-2',
        'ADMIN',
      );

      expect(result).toBe(false);
    });
  });

  describe('getMessages', () => {
    it('should return group messages', async () => {
      const group = { ...mockGroup, members: [] };
      (em.findOne as jest.Mock).mockResolvedValue(group);
      (em.find as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getMessages('group-1', 'user-1');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when group not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getMessages('nonexistent', 'user-1');

      expect(result).toEqual([]);
    });
  });

  describe('markRead', () => {
    it('should mark messages as read', async () => {
      const group = { ...mockGroup, members: [] };
      (em.findOne as jest.Mock).mockResolvedValue(group);
      (em.find as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.markRead('group-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false when group not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.markRead('nonexistent', 'user-1');

      expect(result).toBe(false);
    });
  });
});
