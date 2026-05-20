import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { CategoriesService } from './categories.service';
import { Category } from '../entities/category.entity';
import { PostCategory } from '../entities/post-category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let em: Partial<EntityManager>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test description',
    parent: null,
    children: [],
    childrenCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  } as Category;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn().mockImplementation(() => {
        // Mock flush to set dates if needed
      }),
      count: jest.fn(),
      getReference: jest.fn().mockImplementation((entity, id) => ({ id })),
      nativeDelete: jest.fn(),
      nativeUpdate: jest.fn(),
      remove: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('list', () => {
    it('should return paginated categories', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockCategory]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Category');
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

    it('should handle empty result', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return category with details', async () => {
      const categoryWithChildren = {
        ...mockCategory,
        children: [],
      };
      (em.findOne as jest.Mock).mockResolvedValue(categoryWithChildren);
      (em.count as jest.Mock).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      (em.find as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.getById('cat-1');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Category');
      expect(result?.children).toBeDefined();
      expect(result?.posts).toBeDefined();
    });

    it('should return null when category not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create category successfully', async () => {
      const createdCategory = {
        ...mockCategory,
        id: 'new-cat',
        name: 'New Category',
      };
      (em.findOne as jest.Mock).mockResolvedValue(createdCategory);
      (em.count as jest.Mock).mockResolvedValue(0);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.create({
        name: 'New Category',
        slug: 'new-category',
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result.name).toBe('New Category');
    });

    it('should create category with parent', async () => {
      const createdCategory = {
        ...mockCategory,
        id: 'new-cat',
        name: 'Child Category',
      };
      (em.findOne as jest.Mock).mockResolvedValue(createdCategory);
      (em.count as jest.Mock).mockResolvedValue(0);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.create({
        name: 'Child Category',
        slug: 'child-category',
        parentId: 'parent-id',
      });

      expect(em.getReference).toHaveBeenCalledWith(Category, 'parent-id');
      expect(result.name).toBe('Child Category');
    });
  });

  describe('update', () => {
    it('should update category fields', async () => {
      const existingCategory = { ...mockCategory };
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingCategory);
      (em.findOne as jest.Mock).mockResolvedValueOnce({
        ...existingCategory,
        name: 'Updated Name',
      });
      (em.count as jest.Mock).mockResolvedValue(0);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.update('cat-1', {
        name: 'Updated Name',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
    });

    it('should return null when category not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', { name: 'New' });

      expect(result).toBeNull();
    });

    it('should update parent', async () => {
      const existingCategory = { ...mockCategory };
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingCategory);
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingCategory);
      (em.count as jest.Mock).mockResolvedValue(0);
      (em.find as jest.Mock).mockResolvedValue([]);

      await service.update('cat-1', { parentId: 'new-parent' });

      expect(em.getReference).toHaveBeenCalledWith(Category, 'new-parent');
    });

    it('should remove parent when parentId is null', async () => {
      const existingCategory = { ...mockCategory };
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingCategory);
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingCategory);
      (em.count as jest.Mock).mockResolvedValue(0);
      (em.find as jest.Mock).mockResolvedValue([]);

      await service.update('cat-1', { parentId: null });

      expect(existingCategory.parent).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete category', async () => {
      const category = { ...mockCategory, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(category);

      const result = await service.softDelete('cat-1');

      expect(result).toBe(true);
      expect(category.deletedAt).not.toBeNull();
    });

    it('should return false when category not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      const category = { ...mockCategory, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(category);

      const result = await service.softDelete('cat-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted category', async () => {
      const category = { ...mockCategory, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(category);

      const result = await service.restore('cat-1');

      expect(result).toBe(true);
      expect(category.deletedAt).toBeNull();
    });

    it('should return false when category not deleted', async () => {
      const category = { ...mockCategory, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(category);

      const result = await service.restore('cat-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete category', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockCategory);

      const result = await service.hardDelete('cat-1');

      expect(result).toBe(true);
      expect(em.remove).toHaveBeenCalled();
    });

    it('should return false when category not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('bulk', () => {
    it('should bulk delete categories', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('delete', ['cat-1', 'cat-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 danh mục');
    });

    it('should bulk restore categories', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('restore', ['cat-1', 'cat-2', 'cat-3']);

      expect(result.affected).toBe(3);
      expect(result.message).toContain('3 danh mục');
    });

    it('should bulk hard delete categories', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockCategory]);

      const result = await service.bulk('hard-delete', ['cat-1']);

      expect(result.affected).toBe(1);
      expect(result.message).toContain('1 danh mục');
    });

    it('should bulk set parent', async () => {
      (em.find as jest.Mock)
        .mockResolvedValueOnce([{ id: 'parent-id', deletedAt: null }])
        .mockResolvedValueOnce([]);
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk(
        'set-parent',
        ['cat-1', 'cat-2'],
        'parent-id',
      );

      expect(result.affected).toBeGreaterThanOrEqual(0);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affected).toBe(0);
      expect(result.message).toContain('Không có bản ghi');
    });

    it('should prevent setting parent to itself', async () => {
      const result = await service.bulk('set-parent', ['cat-1'], 'cat-1');

      expect(result.affected).toBe(0);
      expect(result.message).toContain('không được nằm trong danh sách');
    });

    it('should prevent circular parent reference', async () => {
      (em.find as jest.Mock)
        .mockResolvedValueOnce([{ id: 'parent-id', deletedAt: null }])
        .mockResolvedValueOnce(['parent-id']);

      const result = await service.bulk(
        'set-parent',
        ['parent-id'],
        'child-id',
      );

      expect(result.affected).toBe(0);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should return error when parent not found', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.bulk('set-parent', ['cat-1'], 'nonexistent');

      expect(result.affected).toBe(0);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should set parent to null (root level)', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('set-parent', ['cat-1', 'cat-2'], null);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('cấp gốc');
    });
  });

  describe('getOptions', () => {
    it('should return category options', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Category 1' },
        { id: 'cat-2', name: 'Category 2' },
      ]);

      const result = await service.getOptions('name', 'Category', 10);

      expect(result).toHaveLength(2);
    });

    it('should filter by search term', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Test Category' },
      ]);

      const result = await service.getOptions('name', 'Test', 10);

      expect(result).toHaveLength(1);
    });

    it('should return unique options', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Same' },
        { id: 'cat-2', name: 'Same' },
      ]);

      const result = await service.getOptions('name', '', 10);

      expect(result).toHaveLength(1);
    });
  });
});
