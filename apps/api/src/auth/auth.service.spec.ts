import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { hash } from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let em: Partial<EntityManager>;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatar: null,
    password: '',
    isActive: true,
    deletedAt: null,
    userRoles: [],
  } as unknown as User;

  const mockRole = {
    id: 'role-1',
    name: 'admin',
    displayName: 'Admin',
    permissions: ['read', 'write'],
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
      persist: jest.fn(),
      flush: jest.fn(),
      getReference: jest.fn().mockReturnValue({ id: 'role-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return null when email is empty', async () => {
      const result = await service.login({ email: '', password: 'pass' });
      expect(result).toBeNull();
    });

    it('should return null when password is empty', async () => {
      const result = await service.login({
        email: 'test@test.com',
        password: '',
      });
      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.login({
        email: 'nonexistent@test.com',
        password: 'pass',
      });

      expect(result).toBeNull();
      expect(em.findOne).toHaveBeenCalledWith(
        User,
        { email: 'nonexistent@test.com' },
        { populate: ['userRoles', 'userRoles.role'] },
      );
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (em.findOne as jest.Mock).mockResolvedValue(inactiveUser);

      const result = await service.login({
        email: 'test@test.com',
        password: 'pass',
      });

      expect(result).toBeNull();
    });

    it('should return null when user is soft deleted', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(deletedUser);

      const result = await service.login({
        email: 'test@test.com',
        password: 'pass',
      });

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const userWithWrongPass = {
        ...mockUser,
        password: await hash('correct-password', 10),
      };
      (em.findOne as jest.Mock).mockResolvedValue(userWithWrongPass);

      const result = await service.login({
        email: 'test@test.com',
        password: 'wrong-password',
      });

      expect(result).toBeNull();
    });

    it('should return null when user has no roles', async () => {
      const userNoRoles = {
        ...mockUser,
        password: await hash('password', 10),
        userRoles: [],
      };
      (em.findOne as jest.Mock).mockResolvedValue(userNoRoles);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result).toBeNull();
    });

    it('should return user payload when login is successful', async () => {
      const userWithRoles = {
        ...mockUser,
        password: await hash('password', 10),
        userRoles: [mockUserRole],
      };
      (em.findOne as jest.Mock).mockResolvedValue(userWithRoles);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password',
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('user-1');
      expect(result?.email).toBe('test@example.com');
      expect(result?.roles).toHaveLength(1);
      expect(result?.permissions).toContain('read');
      expect(result?.permissions).toContain('write');
    });
  });

  describe('logout', () => {
    it('should return ok true', async () => {
      const result = await service.logout('user-1');
      expect(result).toEqual({ ok: true });
    });
  });

  describe('loginAsDevelopmentUser', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should return null when not in development mode', async () => {
      process.env.NODE_ENV = 'production';
      const result = await service.loginAsDevelopmentUser('user-1');
      expect(result).toBeNull();
    });
  });
});
