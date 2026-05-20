import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { CommentsService } from './comments.service';
import { Comment } from '../entities/comment.entity';

describe('CommentsService', () => {
  let service: CommentsService;
  let em: Partial<EntityManager>;

  const mockComment = {
    id: 'comment-1',
    content: 'Test comment content',
    approved: false,
    author: { id: 'user-1', name: 'Author', email: 'author@test.com' },
    post: { id: 'post-1', title: 'Test Post' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  } as unknown as Comment;

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
        CommentsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('list', () => {
    it('should return paginated comments', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockComment]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].content).toBe('Test comment content');
      expect(result.pagination.total).toBe(1);
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
    it('should return comment with author and post', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockComment);

      const result = await service.getById('comment-1');

      expect(result).not.toBeNull();
      expect(result?.content).toBe('Test comment content');
      expect(result?.authorName).toBe('Author');
      expect(result?.postTitle).toBe('Test Post');
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete comment', async () => {
      const comment = { ...mockComment, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(comment);

      const result = await service.softDelete('comment-1');

      expect(result).toBe(true);
      expect(comment.deletedAt).not.toBeNull();
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      const comment = { ...mockComment, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(comment);

      const result = await service.softDelete('comment-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted comment', async () => {
      const comment = { ...mockComment, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(comment);

      const result = await service.restore('comment-1');

      expect(result).toBe(true);
      expect(comment.deletedAt).toBeNull();
    });

    it('should return false when not deleted', async () => {
      const comment = { ...mockComment, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(comment);

      const result = await service.restore('comment-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete comment', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockComment);

      const result = await service.hardDelete('comment-1');

      expect(result).toBe(true);
      expect(em.remove).toHaveBeenCalled();
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('approve', () => {
    it('should approve comment', async () => {
      const comment = { ...mockComment, approved: false, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(comment);

      const result = await service.approve('comment-1');

      expect(result).toBe(true);
      expect(comment.approved).toBe(true);
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.approve('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when deleted', async () => {
      const comment = { ...mockComment, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(comment);

      const result = await service.approve('comment-1');

      expect(result).toBe(false);
    });
  });

  describe('unapprove', () => {
    it('should unapprove comment', async () => {
      const comment = { ...mockComment, approved: true, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(comment);

      const result = await service.unapprove('comment-1');

      expect(result).toBe(true);
      expect(comment.approved).toBe(false);
    });

    it('should return false when deleted', async () => {
      const comment = { ...mockComment, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(comment);

      const result = await service.unapprove('comment-1');

      expect(result).toBe(false);
    });
  });

  describe('bulk', () => {
    it('should bulk approve', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('approve', ['c1', 'c2', 'c3']);

      expect(result.affected).toBe(3);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should bulk unapprove', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('unapprove', ['c1', 'c2']);

      expect(result.affected).toBe(2);
    });

    it('should bulk delete', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(4);

      const result = await service.bulk('delete', ['c1', 'c2', 'c3', 'c4']);

      expect(result.affected).toBe(4);
    });

    it('should bulk restore', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('restore', ['c1', 'c2']);

      expect(result.affected).toBe(2);
    });

    it('should bulk hard delete', async () => {
      (em.nativeDelete as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('hard-delete', ['c1', 'c2', 'c3']);

      expect(result.affected).toBe(3);
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affected).toBe(0);
    });
  });

  describe('getOptions', () => {
    it('should return comment options', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        {
          id: 'c1',
          content: 'Test comment',
          author: { name: 'Author', email: 'author@test.com' },
          post: { title: 'Test Post' },
        },
      ]);

      const result = await service.getOptions('content', 'Test', 10);

      expect(result).toHaveLength(1);
    });
  });
});
