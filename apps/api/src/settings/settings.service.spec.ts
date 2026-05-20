import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { SettingsService } from './settings.service';
import { Setting } from '../entities/setting.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  let em: Partial<EntityManager>;

  const mockSetting = {
    id: 'setting-1',
    key: 'site_name',
    value: 'Test Site',
    group: 'general',
  } as unknown as Setting;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persistAndFlush: jest.fn(),
      removeAndFlush: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('list', () => {
    it('should return all settings', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockSetting]);

      const result = await service.list();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].key).toBe('site_name');
    });

    it('should filter by group', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockSetting]);

      const result = await service.list({ group: 'general' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);

      const result = await service.list({ search: 'site' });

      expect(result.data).toHaveLength(0);
    });
  });

  describe('getByKey', () => {
    it('should return setting by key', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockSetting);

      const result = await service.getByKey('site_name');

      expect(result).not.toBeNull();
      expect(result?.key).toBe('site_name');
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getByKey('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update existing setting', async () => {
      const existing = { ...mockSetting, value: 'Old Value' };
      (em.findOne as jest.Mock).mockResolvedValue(existing);

      const result = await service.update('site_name', 'New Value');

      expect(result.value).toBe('New Value');
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should create setting if not exists', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('new_setting', 'New Value');

      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(result.key).toBe('new_setting');
      expect(result.value).toBe('New Value');
      expect(result.group).toBe('general');
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple settings', async () => {
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(mockSetting)
        .mockResolvedValueOnce(null);

      const result = await service.bulkUpdate({
        site_name: 'Updated Site',
        new_setting: 'New Value',
      });

      expect(result).toHaveLength(2);
      expect(em.persistAndFlush).toHaveBeenCalledTimes(2);
    });

    it('should handle empty object', async () => {
      const result = await service.bulkUpdate({});

      expect(result).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete setting', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockSetting);

      const result = await service.delete('setting-1');

      expect(result).not.toBeNull();
      expect(em.removeAndFlush).toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.delete('nonexistent');

      expect(result).toBeNull();
    });
  });
});
