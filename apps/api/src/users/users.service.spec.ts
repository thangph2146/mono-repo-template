import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';

describe('UsersService', () => {
  let service: UsersService;
  let em: Partial<EntityManager>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    bio: null,
    avatar: null,
    emailVerified: null,
    phone: null,
    address: null,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    userRoles: [],
  } as User;

  const mockRole = {
    id: 'role-1',
    name: 'admin',
    displayName: 'Admin',
    isActive: true,
    deletedAt: null,
  } as unknown as Role;

  const mockUserRole = {
    id: 'ur-1',
    user: mockUser,
    role: mockRole,
  } as unknown as UserRole;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      count: jest.fn(),
      getReference: jest.fn().mockReturnValue({ id: 'role-1' }),
      nativeDelete: jest.fn(),
      nativeUpdate: jest.fn(),
      remove: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('list', () => {
    it('should return paginated users with roles', async () => {
      const userWithRoles = { ...mockUser, userRoles: [mockUserRole] };
      (em.find as jest.Mock).mockResolvedValue([userWithRoles]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('test@example.com');
      expect(result.data[0].roles).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, search: 'test' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should filter by deleted status', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, status: 'deleted' });

      expect(em.find).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return user with roles', async () => {
      const userWithRoles = { ...mockUser, userRoles: [mockUserRole] };
      (em.findOne as jest.Mock).mockResolvedValue(userWithRoles);

      const result = await service.getById('user-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-1');
      expect(result?.roles).toHaveLength(1);
    });

    it('should return null when user not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user with default role', async () => {
      const defaultRole = { id: 'role-user', name: 'user' } as unknown as Role;
      const createdUser = {
        ...mockUser,
        id: 'new-user',
        email: 'new@example.com',
      };

      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(defaultRole)
        .mockResolvedValueOnce({ ...createdUser, userRoles: [] });

      const result = await service.create({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result.email).toBe('new@example.com');
    });

    it('should create user with specified roles', async () => {
      const createdUser = {
        ...mockUser,
        id: 'new-user',
        email: 'new@example.com',
      };
      (em.findOne as jest.Mock).mockResolvedValue({
        ...createdUser,
        userRoles: [mockUserRole],
      });

      const result = await service.create({
        email: 'new@example.com',
        password: 'password123',
        roleIds: ['role-1'],
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const existingUser = { ...mockUser };
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingUser);
      (em.findOne as jest.Mock).mockResolvedValueOnce({
        ...existingUser,
        email: 'updated@example.com',
        userRoles: [mockUserRole],
      });

      const result = await service.update('user-1', {
        email: 'updated@example.com',
      });

      expect(result).not.toBeNull();
      expect(result?.email).toBe('updated@example.com');
    });

    it('should return null when user not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', {
        email: 'new@test.com',
      });

      expect(result).toBeNull();
    });

    it('should hash password when provided', async () => {
      const existingUser = { ...mockUser };
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingUser);
      (em.findOne as jest.Mock).mockResolvedValueOnce({
        ...existingUser,
        userRoles: [mockUserRole],
      });

      await service.update('user-1', { password: 'newpassword' });

      expect(em.persist).toHaveBeenCalled();
    });

    it('should update roles when roleIds provided', async () => {
      const existingUser = { ...mockUser };
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingUser);
      (em.findOne as jest.Mock).mockResolvedValueOnce({
        ...existingUser,
        userRoles: [mockUserRole],
      });
      (em.nativeDelete as jest.Mock).mockResolvedValue(1);

      await service.update('user-1', { roleIds: ['role-1', 'role-2'] });

      expect(em.nativeDelete).toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should soft delete user', async () => {
      const user = { ...mockUser, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.softDelete('user-1');

      expect(result).toBe(true);
      expect(user.deletedAt).not.toBeNull();
    });

    it('should return false when user not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when user already deleted', async () => {
      const user = { ...mockUser, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.softDelete('user-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted user', async () => {
      const user = { ...mockUser, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.restore('user-1');

      expect(result).toBe(true);
      expect(user.deletedAt).toBeNull();
    });

    it('should return false when user not deleted', async () => {
      const user = { ...mockUser, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.restore('user-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete user', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.hardDelete('user-1');

      expect(result).toBe(true);
      expect(em.remove).toHaveBeenCalled();
    });

    it('should return false when user not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('bulk', () => {
    it('should bulk delete users', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('delete', ['user-1', 'user-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 người dùng');
    });

    it('should bulk restore users', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('restore', [
        'user-1',
        'user-2',
        'user-3',
      ]);

      expect(result.affected).toBe(3);
      expect(result.message).toContain('3 người dùng');
    });

    it('should bulk activate users', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('active', ['user-1', 'user-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 người dùng');
    });

    it('should bulk deactivate users (excluding super_admin)', async () => {
      const superAdminUserRole = {
        user: { id: 'super-admin' },
        role: { name: 'super_admin' },
      } as unknown as UserRole;
      (em.find as jest.Mock).mockResolvedValue([superAdminUserRole]);
      (em.nativeUpdate as jest.Mock).mockResolvedValue(1);

      const result = await service.bulk('unactive', ['user-1', 'super-admin']);

      expect(result.affected).toBe(1);
      expect(result.message).toContain('1 người dùng');
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affected).toBe(0);
      expect(result.message).toContain('Không có bản ghi');
    });

    it('should bulk hard delete users', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.bulk('hard-delete', ['user-1']);

      expect(result.affected).toBe(1);
      expect(result.message).toContain('1 người dùng');
    });
  });

  describe('getOptions', () => {
    it('should return user options', async () => {
      const mockRepo = {
        find: jest
          .fn()
          .mockResolvedValue([
            { id: 'user-1', email: 'test@example.com', name: 'Test User' },
          ]),
      };
      jest.spyOn(em, 'getRepository').mockReturnValue(mockRepo as any);

      const result = await service.getOptions('email', 'test', 10);

      expect(result).toHaveLength(1);
    });
  });

  describe('listDevelopmentLoginOptions', () => {
    it('should return development login options', async () => {
      const userWithRoles = {
        ...mockUser,
        userRoles: [mockUserRole],
      };
      (em.find as jest.Mock).mockResolvedValue([userWithRoles]);

      const result = await service.listDevelopmentLoginOptions();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('test@example.com');
      expect(result[0].roleNames).toContain('admin');
    });

    it('should filter out users without email', async () => {
      const userWithoutEmail = { ...mockUser, email: '', userRoles: [] };
      (em.find as jest.Mock).mockResolvedValue([userWithoutEmail]);

      const result = await service.listDevelopmentLoginOptions();

      expect(result).toHaveLength(0);
    });
  });
});
