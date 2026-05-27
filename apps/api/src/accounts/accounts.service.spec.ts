import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { AccountsService } from './accounts.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';
import { Role } from '../entities/role.entity';

describe('AccountsService', () => {
  let service: AccountsService;
  let em: Partial<EntityManager>;

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    avatar: null,
    bio: 'Test bio',
    phone: '0123456789',
    address: 'Test Address',
    emailVerified: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    password: 'hashedpassword',
  } as unknown as User;

  const mockUserRole = {
    id: 'ur-1',
    user: mockUser,
    role: {
      id: 'role-1',
      name: 'user',
      displayName: 'User',
    } as unknown as Role,
  } as unknown as UserRole;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persistAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockUser);
      (em.find as jest.Mock).mockResolvedValue([mockUserRole]);

      const result = await service.getProfile('user-1');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('user@example.com');
      expect(result?.name).toBe('Test User');
      expect(result?.roles).toHaveLength(1);
    });

    it('should return null when user not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getProfile('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when user is deleted', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(deletedUser);

      const result = await service.getProfile('user-1');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (em.findOne as jest.Mock).mockResolvedValue(inactiveUser);

      const result = await service.getProfile('user-1');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile fields', async () => {
      const existing = { ...mockUser };
      (em.findOne as jest.Mock).mockResolvedValue(existing);
      (em.find as jest.Mock).mockResolvedValue([mockUserRole]);

      const result = await service.updateProfile('user-1', {
        name: 'Updated Name',
        bio: 'Updated bio',
        phone: '0987654321',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should return null when user not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.updateProfile('nonexistent', {
        name: 'New',
      });

      expect(result).toBeNull();
    });

    it('should return null when user is deleted', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(deletedUser);

      const result = await service.updateProfile('user-1', { name: 'New' });

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      (em.findOne as jest.Mock).mockResolvedValue(inactiveUser);

      const result = await service.updateProfile('user-1', { name: 'New' });

      expect(result).toBeNull();
    });

    it('should trim name field', async () => {
      const existing = { ...mockUser };
      (em.findOne as jest.Mock).mockResolvedValue(existing);
      (em.find as jest.Mock).mockResolvedValue([mockUserRole]);

      await service.updateProfile('user-1', { name: '  Trimmed Name  ' });

      expect(existing.name).toBe('Trimmed Name');
    });

    it('should update password when provided', async () => {
      const existing = { ...mockUser };
      (em.findOne as jest.Mock).mockResolvedValue(existing);
      (em.find as jest.Mock).mockResolvedValue([mockUserRole]);

      await service.updateProfile('user-1', { password: 'newpassword123' });

      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(existing.password).not.toBe('hashedpassword');
    });

    it('should not update password when empty', async () => {
      const existing = { ...mockUser, password: 'originalhash' };
      (em.findOne as jest.Mock).mockResolvedValue(existing);
      (em.find as jest.Mock).mockResolvedValue([mockUserRole]);

      await service.updateProfile('user-1', { password: '   ' });

      expect(existing.password).toBe('originalhash');
    });

    it('should handle null avatar', async () => {
      const existing = { ...mockUser, avatar: 'old-avatar.jpg' };
      (em.findOne as jest.Mock).mockResolvedValue(existing);
      (em.find as jest.Mock).mockResolvedValue([mockUserRole]);

      await service.updateProfile('user-1', { avatar: null });

      expect(existing.avatar).toBeNull();
    });
  });
});
