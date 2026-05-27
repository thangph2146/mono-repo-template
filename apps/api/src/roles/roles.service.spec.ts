import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { RolesService } from './roles.service';
import { Role } from '../entities/role.entity';

describe('RolesService', () => {
  let service: RolesService;
  let em: Partial<EntityManager>;

  const mockRole = {
    id: 'role-1',
    name: 'admin',
    displayName: 'Admin',
    description: 'Administrator role',
    permissions: ['read', 'write'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as Role;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persistAndFlush: jest.fn(),
      count: jest.fn(),
      nativeUpdate: jest.fn(),
      removeAndFlush: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('list', () => {
    it('should return paginated roles', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockRole]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('admin');
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, search: 'admin' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should filter by deleted status', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, status: 'deleted' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should filter by isActive', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({
        page: 1,
        limit: 10,
        filters: { isActive: 'true' },
      });

      expect(em.find).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return role', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.getById('role-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('admin');
      expect(result?.permissions).toEqual(['read', 'write']);
    });

    it('should return null when role not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create role successfully', async () => {
      const result = await service.create({
        name: 'editor',
        displayName: 'Editor',
        description: 'Editor role',
        permissions: ['read'],
      });

      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(result.name).toBe('editor');
      expect(result.isActive).toBe(true);
    });

    it('should create role with isActive false', async () => {
      const result = await service.create({
        name: 'inactive-role',
        displayName: 'Inactive',
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });
  });

  describe('update', () => {
    it('should update role fields', async () => {
      const existingRole = { ...mockRole };
      (em.findOne as jest.Mock).mockResolvedValue(existingRole);

      const result = await service.update('role-1', {
        name: 'super-admin',
        displayName: 'Super Admin',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('super-admin');
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should return null when role not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', { name: 'new' });

      expect(result).toBeNull();
    });

    it('should update permissions', async () => {
      const existingRole = { ...mockRole };
      (em.findOne as jest.Mock).mockResolvedValue(existingRole);

      await service.update('role-1', {
        permissions: ['read', 'write', 'delete'],
      });

      expect(existingRole.permissions).toEqual(['read', 'write', 'delete']);
    });

    it('should update isActive', async () => {
      const existingRole = { ...mockRole };
      (em.findOne as jest.Mock).mockResolvedValue(existingRole);

      await service.update('role-1', { isActive: false });

      expect(existingRole.isActive).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete role', async () => {
      const role = { ...mockRole, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(role);

      const result = await service.softDelete('role-1');

      expect(result).toBe(true);
      expect(role.deletedAt).not.toBeNull();
    });

    it('should return false when role not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      const role = { ...mockRole, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(role);

      const result = await service.softDelete('role-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted role', async () => {
      const role = { ...mockRole, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(role);

      const result = await service.restore('role-1');

      expect(result).toBe(true);
      expect(role.deletedAt).toBeNull();
    });

    it('should return false when role not deleted', async () => {
      const role = { ...mockRole, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(role);

      const result = await service.restore('role-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete role', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockRole);

      const result = await service.hardDelete('role-1');

      expect(result).toBe(true);
      expect(em.removeAndFlush).toHaveBeenCalled();
    });

    it('should return false when role not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('bulk', () => {
    it('should bulk delete roles', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('delete', ['role-1', 'role-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 vai trò');
    });

    it('should bulk restore roles', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('restore', [
        'role-1',
        'role-2',
        'role-3',
      ]);

      expect(result.affected).toBe(3);
      expect(result.message).toContain('3 vai trò');
    });

    it('should bulk hard delete roles', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockRole]);

      const result = await service.bulk('hard-delete', ['role-1']);

      expect(result.affected).toBe(1);
      expect(result.message).toContain('1 vai trò');
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affected).toBe(0);
      expect(result.message).toContain('Không có bản ghi');
    });
  });

  describe('getOptions', () => {
    it('should return role options', async () => {
      const mockRepo = {
        find: jest
          .fn()
          .mockResolvedValue([
            { id: 'role-1', name: 'Admin', displayName: 'Administrator' },
          ]),
      };
      (em.getRepository as jest.Mock).mockReturnValue(mockRepo);

      const result = await service.getOptions('name', 'Admin', 10);

      expect(result).toHaveLength(1);
    });
  });
});
