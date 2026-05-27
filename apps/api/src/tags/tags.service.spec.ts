import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { TagsService } from './tags.service';
import { Tag } from '../entities/tag.entity';

describe('TagsService', () => {
  let service: TagsService;
  let em: Partial<EntityManager>;

  const mockTag = {
    id: 'tag-1',
    name: 'Test Tag',
    slug: 'test-tag',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  } as Tag;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persist: jest.fn(),
      persistAndFlush: jest.fn().mockImplementation((entity) => {
        if (entity) {
          entity.createdAt = entity.createdAt || new Date('2024-01-01');
          entity.updatedAt = entity.updatedAt || new Date('2024-01-01');
        }
      }),
      flush: jest.fn(),
      count: jest.fn(),
      getReference: jest.fn(),
      nativeDelete: jest.fn(),
      nativeUpdate: jest.fn(),
      remove: jest.fn(),
      removeAndFlush: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  describe('list', () => {
    it('should return paginated tags', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockTag]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Tag');
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
    it('should return tag with post count', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockTag);
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getById('tag-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Tag');
      expect(result?.postCount).toBe(5);
      expect(result?.posts).toBeDefined();
    });

    it('should return null when tag not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create tag successfully', async () => {
      const result = await service.create({
        name: 'New Tag',
        slug: 'new-tag',
      });

      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(result.name).toBe('New Tag');
      expect(result.slug).toBe('new-tag');
    });
  });

  describe('update', () => {
    it('should update tag fields', async () => {
      const existingTag = { ...mockTag };
      (em.findOne as jest.Mock).mockResolvedValue(existingTag);

      const result = await service.update('tag-1', {
        name: 'Updated Tag',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Tag');
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should return null when tag not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', { name: 'New' });

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete tag', async () => {
      const tag = { ...mockTag, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(tag);

      const result = await service.softDelete('tag-1');

      expect(result).toBe(true);
      expect(tag.deletedAt).not.toBeNull();
    });

    it('should return false when tag not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      const tag = { ...mockTag, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(tag);

      const result = await service.softDelete('tag-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted tag', async () => {
      const tag = { ...mockTag, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(tag);

      const result = await service.restore('tag-1');

      expect(result).toBe(true);
      expect(tag.deletedAt).toBeNull();
    });

    it('should return false when tag not deleted', async () => {
      const tag = { ...mockTag, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(tag);

      const result = await service.restore('tag-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete tag', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockTag);

      const result = await service.hardDelete('tag-1');

      expect(result).toBe(true);
      expect(em.removeAndFlush).toHaveBeenCalled();
    });

    it('should return false when tag not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('bulk', () => {
    it('should bulk delete tags', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('delete', ['tag-1', 'tag-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 thẻ');
    });

    it('should bulk restore tags', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('restore', ['tag-1', 'tag-2', 'tag-3']);

      expect(result.affected).toBe(3);
      expect(result.message).toContain('3 thẻ');
    });

    it('should bulk hard delete tags', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockTag]);

      const result = await service.bulk('hard-delete', ['tag-1']);

      expect(result.affected).toBe(1);
      expect(result.message).toContain('1 thẻ');
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affected).toBe(0);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should filter out empty ids', async () => {
      const result = await service.bulk('delete', ['', '  ']);

      expect(result.affected).toBe(0);
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  describe('getOptions', () => {
    it('should return tag options', async () => {
      const mockRepo = {
        find: jest
          .fn()
          .mockResolvedValue([{ id: 'tag-1', name: 'Tag 1', slug: 'tag-1' }]),
      };
      jest
        .spyOn(em, 'getRepository')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .mockReturnValue(mockRepo as any);

      const result = await service.getOptions('name', 'Tag', 10);

      expect(result).toHaveLength(1);
    });
  });
});
