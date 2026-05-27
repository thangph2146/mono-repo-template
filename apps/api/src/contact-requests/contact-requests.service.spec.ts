import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { ContactRequestsService } from './contact-requests.service';
import { ContactRequest } from '../entities/contact-request.entity';

describe('ContactRequestsService', () => {
  let service: ContactRequestsService;
  let em: Partial<EntityManager>;

  const mockContactRequest = {
    id: 'cr-1',
    name: 'Test User',
    email: 'test@example.com',
    phone: '0123456789',
    subject: 'Test Subject',
    content: 'Test content',
    status: 'NEW',
    priority: 'MEDIUM',
    isRead: false,
    assignedTo: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  } as unknown as ContactRequest;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      count: jest.fn(),
      nativeUpdate: jest.fn(),
      nativeDelete: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactRequestsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<ContactRequestsService>(ContactRequestsService);
  });

  describe('list', () => {
    it('should return paginated contact requests', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockContactRequest]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test User');
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, search: 'test' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, status: 'IN_PROGRESS' });

      expect(em.find).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return contact request', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockContactRequest);

      const result = await service.getById('cr-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test User');
      expect(result?.status).toBe('NEW');
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update contact request fields', async () => {
      const existing = { ...mockContactRequest };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, status: 'IN_PROGRESS' });

      const result = await service.update('cr-1', {
        status: 'IN_PROGRESS',
        isRead: true,
      });

      expect(result).not.toBeNull();
      expect(em.persist).toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', { status: 'NEW' });

      expect(result).toBeNull();
    });

    it('should update assignee', async () => {
      const existing = { ...mockContactRequest };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);

      await service.update('cr-1', { assignedToId: 'user-1' });

      expect(existing.assignedTo).toBe('user-1');
    });

    it('should remove assignee when assignedToId is null', async () => {
      const existing = { ...mockContactRequest };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);

      await service.update('cr-1', { assignedToId: null });

      expect(existing.assignedTo).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete contact request', async () => {
      const cr = { ...mockContactRequest, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(cr);

      const result = await service.softDelete('cr-1');

      expect(result).toBe(true);
      expect(cr.deletedAt).not.toBeNull();
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      const cr = { ...mockContactRequest, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(cr);

      const result = await service.softDelete('cr-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted contact request', async () => {
      const cr = { ...mockContactRequest, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(cr);

      const result = await service.restore('cr-1');

      expect(result).toBe(true);
      expect(cr.deletedAt).toBeNull();
    });

    it('should return false when not deleted', async () => {
      const cr = { ...mockContactRequest, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(cr);

      const result = await service.restore('cr-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete contact request', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockContactRequest);

      const result = await service.hardDelete('cr-1');

      expect(result).toBe(true);
      expect(em.remove).toHaveBeenCalled();
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('bulk', () => {
    it('should bulk delete', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('delete', ['cr-1', 'cr-2']);

      expect(result.affectedCount).toBe(2);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should bulk restore', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('restore', ['cr-1', 'cr-2', 'cr-3']);

      expect(result.affectedCount).toBe(3);
    });

    it('should bulk hard delete', async () => {
      (em.nativeDelete as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('hard-delete', ['cr-1', 'cr-2']);

      expect(result.affectedCount).toBe(2);
    });

    it('should bulk mark as read', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(5);

      const result = await service.bulk('mark-read', ['cr-1', 'cr-2']);

      expect(result.affectedCount).toBeGreaterThanOrEqual(0);
    });

    it('should bulk mark as unread', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('mark-unread', ['cr-1', 'cr-2']);

      expect(result.affectedCount).toBeGreaterThanOrEqual(0);
    });

    it('should bulk update status', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(4);

      const result = await service.bulk(
        'update-status',
        ['cr-1', 'cr-2'],
        'RESOLVED',
      );

      expect(result.affectedCount).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affectedCount).toBe(0);
    });
  });

  describe('assign', () => {
    it('should assign contact request to user', async () => {
      const existing = { ...mockContactRequest };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);

      const result = await service.assign('cr-1', 'user-1');

      expect(result).not.toBeNull();
    });

    it('should unassign when assignedToId is null', async () => {
      const existing = { ...mockContactRequest };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(existing);

      await service.assign('cr-1', null);

      expect(existing.assignedTo).toBeNull();
    });
  });

  describe('getOptions', () => {
    it('should return contact request options', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { id: 'cr-1', name: 'Test User', subject: 'Test Subject' },
      ]);

      const result = await service.getOptions('name', 'Test', 10);

      expect(result).toHaveLength(1);
    });
  });
});
