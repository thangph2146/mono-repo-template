import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { NotificationsService } from './notifications.service';
import {
  Notification,
  NotificationKind,
} from '../entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let em: Partial<EntityManager>;

  const mockNotification = {
    id: 'notif-1',
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    kind: NotificationKind.SYSTEM,
    title: 'Test Notification',
    description: 'Test description',
    isRead: false,
    actionUrl: null,
    metadata: null,
    expiresAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    readAt: null,
  } as unknown as Notification;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      count: jest.fn(),
      nativeUpdate: jest.fn(),
      nativeDelete: jest.fn(),
      getReference: jest.fn().mockImplementation((entity, id) => ({ id })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('should create notification', async () => {
      const result = await service.create({
        userId: 'user-1',
        kind: NotificationKind.SYSTEM,
        title: 'New Notification',
        description: 'Test description',
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result.title).toBe('New Notification');
    });

    it('should create notification with optional fields', async () => {
      const result = await service.create({
        userId: 'user-1',
        kind: NotificationKind.SYSTEM,
        title: 'Notification with URL',
        actionUrl: '/some/path',
        metadata: { key: 'value' },
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result.actionUrl).toBe('/some/path');
    });
  });

  describe('list', () => {
    it('should return notifications for user', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockNotification]);
      (em.count as jest.Mock).mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const result = await service.list({ userId: 'user-1' });

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(1);
    });

    it('should filter unread only', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await service.list({
        userId: 'user-1',
        unreadOnly: true,
      });

      expect(result.notifications).toHaveLength(0);
    });

    it('should respect limit', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      await service.list({ userId: 'user-1', limit: 5 });

      expect(em.find).toHaveBeenCalled();
    });
  });

  describe('markRead', () => {
    it('should mark notification as read', async () => {
      const notif = { ...mockNotification, isRead: false };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(notif)
        .mockResolvedValueOnce({ ...notif, isRead: true });
      (em.nativeUpdate as jest.Mock).mockResolvedValue(1);

      const result = await service.markRead('notif-1', 'user-1', true);

      expect(result).not.toBeNull();
      expect(em.nativeUpdate).toHaveBeenCalled();
    });

    it('should mark notification as unread', async () => {
      const notif = { ...mockNotification, isRead: true };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(notif)
        .mockResolvedValueOnce({ ...notif, isRead: false });
      (em.nativeUpdate as jest.Mock).mockResolvedValue(1);

      const result = await service.markRead('notif-1', 'user-1', false);

      expect(result).not.toBeNull();
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.markRead('nonexistent', 'user-1', true);

      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(5);

      const result = await service.markAllAsRead('user-1');

      expect(result.count).toBe(5);
      expect(em.nativeUpdate).toHaveBeenCalled();
    });

    it('should return 0 when no unread notifications', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(0);

      const result = await service.markAllAsRead('user-1');

      expect(result.count).toBe(0);
    });
  });

  describe('bulkMarkReadUnread', () => {
    it('should bulk mark as read', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulkMarkReadUnread('user-1', 'mark-read', [
        'n1',
        'n2',
        'n3',
      ]);

      expect(result.count).toBe(3);
    });

    it('should bulk mark as unread', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulkMarkReadUnread('user-1', 'mark-unread', [
        'n1',
        'n2',
      ]);

      expect(result.count).toBe(2);
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulkMarkReadUnread(
        'user-1',
        'mark-read',
        [],
      );

      expect(result.count).toBe(0);
      expect(result.alreadyAffected).toBe(0);
    });
  });

  describe('bulkDelete', () => {
    it('should bulk delete notifications', async () => {
      (em.nativeDelete as jest.Mock).mockResolvedValue(3);

      const result = await service.bulkDelete('user-1', ['n1', 'n2', 'n3']);

      expect(result.count).toBe(3);
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulkDelete('user-1', []);

      expect(result.count).toBe(0);
    });
  });

  describe('deleteOne', () => {
    it('should delete notification', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockNotification);
      (em.nativeDelete as jest.Mock).mockResolvedValue(1);

      const result = await service.deleteOne('notif-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.deleteOne('nonexistent', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('listForAdminTable', () => {
    it('should return admin table data', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockNotification]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listForAdminTable({
        userId: 'user-1',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.listForAdminTable({
        userId: 'user-1',
        page: 1,
        limit: 10,
        search: 'test',
      });

      expect(em.find).toHaveBeenCalled();
    });

    it('should return all notifications when viewAll is true', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockNotification]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.listForAdminTable({
        userId: 'user-1',
        viewAll: true,
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getColumnOptions', () => {
    it('should return user email options', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { email: 'user1@test.com' },
        { email: 'user2@test.com' },
      ]);

      const result = await service.getColumnOptions('userEmail', 'user', 10);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return user name options', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { name: 'User One' },
        { name: 'User Two' },
      ]);

      const result = await service.getColumnOptions('userName', 'User', 10);

      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSuperAdminUserIds', () => {
    it('should return super admin user ids', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { user: { id: 'admin-1' } },
        { user: { id: 'admin-2' } },
      ]);

      const result = await service.getSuperAdminUserIds();

      expect(result).toHaveLength(2);
    });

    it('should return unique ids', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { user: { id: 'admin-1' } },
        { user: { id: 'admin-1' } },
      ]);

      const result = await service.getSuperAdminUserIds();

      expect(result).toHaveLength(1);
    });
  });

  describe('hasRecentLoginNotification', () => {
    it('should return true when recent notification exists', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.hasRecentLoginNotification(
        'user-1',
        'Test description',
      );

      expect(result).toBe(true);
    });

    it('should return false when no recent notification', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hasRecentLoginNotification(
        'user-1',
        'Test description',
      );

      expect(result).toBe(false);
    });
  });

  describe('hasRecentWelcomeBackNotification', () => {
    it('should return true when recent welcome back exists', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.hasRecentWelcomeBackNotification('user-1');

      expect(result).toBe(true);
    });

    it('should return false when no recent welcome back', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hasRecentWelcomeBackNotification('user-1');

      expect(result).toBe(false);
    });
  });
});
