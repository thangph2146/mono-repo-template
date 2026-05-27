import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { PostsService } from './posts.service';
import { Post } from '../entities/post.entity';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';
import { User } from '../entities/user.entity';

describe('PostsService', () => {
  let service: PostsService;
  let em: Partial<EntityManager>;

  const mockPost = {
    id: 'post-1',
    title: 'Test Post',
    slug: 'test-post',
    content: { type: 'doc', content: [] },
    excerpt: 'Test excerpt',
    image: null,
    published: false,
    publishedAt: null,
    eventStartAt: null,
    eventEndAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    author: { id: 'user-1', name: 'Author', email: 'author@test.com' },
    categories: [],
    tags: [],
    comments: [],
  } as unknown as Post;

  const mockCategory = {
    id: 'cat-1',
    name: 'Test Category',
    slug: 'test-category',
    deletedAt: null,
  } as unknown as Category;

  const mockTag = {
    id: 'tag-1',
    name: 'Test Tag',
    slug: 'test-tag',
    deletedAt: null,
  } as unknown as Tag;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persist: jest.fn(),
      flush: jest.fn(),
      count: jest.fn(),
      getReference: jest.fn().mockImplementation((entity, id) => ({ id })),
      nativeDelete: jest.fn(),
      nativeUpdate: jest.fn(),
      remove: jest.fn(),
      getRepository: jest.fn(),
      transactional: jest.fn().mockImplementation((cb) => {
        const mockTx = {
          findOne: em.findOne,
          find: em.find,
          persist: em.persist,
          flush: em.flush,
          nativeDelete: em.nativeDelete,
          getReference: em.getReference,
        };
        return cb(mockTx as unknown as EntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  describe('list', () => {
    it('should return paginated posts', async () => {
      (em.find as jest.Mock)
        .mockResolvedValueOnce([{ id: 'post-1' }])
        .mockResolvedValueOnce([mockPost]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, search: 'test' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should filter by deleted status', async () => {
      (em.find as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, status: 'deleted' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should handle empty result', async () => {
      (em.find as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return post with relations', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockPost);

      const result = await service.getById('post-1');

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Post');
      expect(result?.content).toEqual({ type: 'doc', content: [] });
    });

    it('should return null when post not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create post successfully', async () => {
      const createdPost = { ...mockPost, id: 'new-post', title: 'New Post' };
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.findOne as jest.Mock).mockResolvedValue(createdPost);

      const result = await service.create('user-1', {
        title: 'New Post',
        slug: 'new-post',
        content: {},
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result.title).toBe('New Post');
    });

    it('should create post with categories and tags', async () => {
      const createdPost = { ...mockPost, id: 'new-post', title: 'New Post' };
      (em.find as jest.Mock)
        .mockResolvedValueOnce([mockCategory])
        .mockResolvedValueOnce([mockTag]);
      (em.findOne as jest.Mock).mockResolvedValue(createdPost);

      const result = await service.create('user-1', {
        title: 'New Post',
        slug: 'new-post',
        content: {},
        categoryIds: ['cat-1'],
        tagIds: ['tag-1'],
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw when category does not exist', async () => {
      (em.find as jest.Mock).mockResolvedValueOnce([]);

      await expect(
        service.create('user-1', {
          title: 'New Post',
          slug: 'new-post',
          content: {},
          categoryIds: ['nonexistent'],
        }),
      ).rejects.toThrow('Category ID không tồn tại');
    });

    it('should throw when tag does not exist', async () => {
      (em.find as jest.Mock)
        .mockResolvedValueOnce([mockCategory])
        .mockResolvedValueOnce([]);

      await expect(
        service.create('user-1', {
          title: 'New Post',
          slug: 'new-post',
          content: {},
          categoryIds: ['cat-1'],
          tagIds: ['nonexistent'],
        }),
      ).rejects.toThrow('Tag ID không tồn tại');
    });

    it('should truncate long excerpt', async () => {
      const createdPost = { ...mockPost, id: 'new-post' };
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.findOne as jest.Mock).mockResolvedValue(createdPost);

      const longExcerpt = 'a'.repeat(250);
      await service.create('user-1', {
        title: 'New Post',
        slug: 'new-post',
        content: {},
        excerpt: longExcerpt,
      });

      expect(em.persist).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update post fields', async () => {
      const existingPost = { ...mockPost };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingPost)
        .mockResolvedValueOnce({ ...existingPost, title: 'Updated Title' });

      const result = await service.update('post-1', {
        title: 'Updated Title',
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Updated Title');
    });

    it('should return null when post not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', { title: 'New' });

      expect(result).toBeNull();
    });

    it('should update categories', async () => {
      const existingPost = { ...mockPost };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingPost)
        .mockResolvedValueOnce(existingPost);
      (em.find as jest.Mock).mockResolvedValue([mockCategory]);
      (em.nativeDelete as jest.Mock).mockResolvedValue(1);

      await service.update('post-1', { categoryIds: ['cat-1'] });

      expect(em.nativeDelete).toHaveBeenCalled();
    });

    it('should update tags', async () => {
      const existingPost = { ...mockPost };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingPost)
        .mockResolvedValueOnce(existingPost);
      (em.find as jest.Mock).mockResolvedValue([mockTag]);
      (em.nativeDelete as jest.Mock).mockResolvedValue(1);

      await service.update('post-1', { tagIds: ['tag-1'] });

      expect(em.nativeDelete).toHaveBeenCalled();
    });

    it('should update author', async () => {
      const existingPost = { ...mockPost };
      const author = { id: 'user-2', name: 'New Author' } as unknown as User;
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingPost)
        .mockResolvedValueOnce(author)
        .mockResolvedValueOnce(existingPost);

      await service.update('post-1', { authorId: 'user-2' });

      expect(em.findOne).toHaveBeenCalledWith(User, { id: 'user-2' });
    });

    it('should throw when author not found', async () => {
      const existingPost = { ...mockPost };
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingPost)
        .mockResolvedValueOnce(null);

      await expect(
        service.update('post-1', { authorId: 'nonexistent' }),
      ).rejects.toThrow('Tác giả không tồn tại');
    });

    it('should throw on invalid date', async () => {
      const existingPost = { ...mockPost };
      (em.findOne as jest.Mock).mockResolvedValueOnce(existingPost);

      await expect(
        service.update('post-1', { publishedAt: 'invalid-date' }),
      ).rejects.toThrow('Giá trị publishedAt không hợp lệ');
    });
  });

  describe('softDelete', () => {
    it('should soft delete post', async () => {
      const post = { ...mockPost, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(post);

      const result = await service.softDelete('post-1');

      expect(result).toBe(true);
      expect(post.deletedAt).not.toBeNull();
    });

    it('should return false when post not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      const post = { ...mockPost, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(post);

      const result = await service.softDelete('post-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted post', async () => {
      const post = { ...mockPost, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(post);

      const result = await service.restore('post-1');

      expect(result).toBe(true);
      expect(post.deletedAt).toBeNull();
    });

    it('should return false when post not deleted', async () => {
      const post = { ...mockPost, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(post);

      const result = await service.restore('post-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete post', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockPost);

      const result = await service.hardDelete('post-1');

      expect(result).toBe(true);
      expect(em.remove).toHaveBeenCalled();
    });

    it('should return false when post not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('bulk', () => {
    it('should bulk delete posts', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('delete', ['post-1', 'post-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 bài viết');
    });

    it('should bulk restore posts', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('restore', [
        'post-1',
        'post-2',
        'post-3',
      ]);

      expect(result.affected).toBe(3);
      expect(result.message).toContain('3 bài viết');
    });

    it('should bulk hard delete posts', async () => {
      (em.nativeDelete as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('hard-delete', ['post-1', 'post-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 bài viết');
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affected).toBe(0);
      expect(result.message).toContain('Không có bản ghi');
    });
  });

  describe('bulkSetCategories', () => {
    it('should replace categories for posts', async () => {
      const post = { id: 'post-1' } as unknown as Post;
      (em.find as jest.Mock).mockResolvedValue([mockCategory]);
      (em.findOne as jest.Mock).mockResolvedValue(post);

      const result = await service.bulkSetCategories(
        ['post-1'],
        ['cat-1'],
        'replace',
      );

      expect(result.affected).toBe(1);
      expect(result.message).toContain('1 bài viết');
    });

    it('should add categories to posts', async () => {
      const post = { id: 'post-1' } as unknown as Post;
      (em.find as jest.Mock)
        .mockResolvedValueOnce([mockCategory])
        .mockResolvedValueOnce([]);
      (em.findOne as jest.Mock).mockResolvedValue(post);

      const result = await service.bulkSetCategories(
        ['post-1'],
        ['cat-1'],
        'add',
      );

      expect(result.affected).toBe(1);
    });

    it('should return 0 when no post ids', async () => {
      const result = await service.bulkSetCategories([], ['cat-1']);

      expect(result.affected).toBe(0);
      expect(result.message).toContain('Không có bài viết');
    });
  });

  describe('bulkClearImages', () => {
    it('should clear images for posts', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulkClearImages(['post-1', 'post-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 bài viết');
    });

    it('should return 0 when no post ids', async () => {
      const result = await service.bulkClearImages([]);

      expect(result.affected).toBe(0);
      expect(result.message).toContain('Không có bài viết');
    });
  });

  describe('getOptions', () => {
    it('should return post options', async () => {
      const mockRepo = {
        find: jest
          .fn()
          .mockResolvedValue([
            { id: 'post-1', title: 'Test Post', slug: 'test-post' },
          ]),
      };
      jest
        .spyOn(em, 'getRepository')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .mockReturnValue(mockRepo as any);

      const result = await service.getOptions('title', 'test', 10);

      expect(result).toHaveLength(1);
    });
  });

  describe('getDatesWithPosts', () => {
    it('should return sorted dates', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        {
          publishedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
        },
        {
          publishedAt: new Date('2024-01-02'),
          createdAt: new Date('2024-01-02'),
        },
      ]);

      const result = await service.getDatesWithPosts();

      expect(result).toHaveLength(2);
      expect(result).toEqual(['2024-01-01', '2024-01-02']);
    });

    it('should handle empty result', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getDatesWithPosts();

      expect(result).toHaveLength(0);
    });
  });
});
