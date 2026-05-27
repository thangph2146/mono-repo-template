import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let em: Partial<EntityManager>;

  beforeEach(async () => {
    em = {
      count: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      getConnection: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getStats', () => {
    it('should return dashboard stats', async () => {
      (em.count as jest.Mock).mockResolvedValue(0);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.overview).toBeDefined();
      expect(result.monthlyData).toBeDefined();
      expect(result.categoryData).toBeDefined();
      expect(result.topPosts).toBeDefined();
      expect(result.monthlyData).toHaveLength(12);
    });

    it('should return overview with totals', async () => {
      (em.count as jest.Mock).mockResolvedValue(10);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.overview.totalUsers).toBe(10);
      expect(result.overview.totalPosts).toBe(10);
      expect(result.overview.totalComments).toBe(10);
      expect(result.overview.totalCategories).toBe(10);
      expect(result.overview.totalTags).toBe(10);
    });

    it('should return monthly data for 12 months', async () => {
      (em.count as jest.Mock).mockResolvedValue(5);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getStats();

      expect(result.monthlyData).toHaveLength(12);
      expect(result.monthlyData[0]).toHaveProperty('month');
      expect(result.monthlyData[0]).toHaveProperty('users');
      expect(result.monthlyData[0]).toHaveProperty('posts');
    });

    it('should return category data', async () => {
      (em.count as jest.Mock).mockResolvedValue(0);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getStats();

      expect(Array.isArray(result.categoryData)).toBe(true);
    });

    it('should return top posts', async () => {
      (em.count as jest.Mock).mockResolvedValue(0);
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getStats();

      expect(Array.isArray(result.topPosts)).toBe(true);
    });
  });
});
