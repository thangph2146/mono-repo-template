import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { AdmissionResultsService } from './admission-results.service';
import { AdmissionResult } from '../entities/admission-result.entity';

describe('AdmissionResultsService', () => {
  let service: AdmissionResultsService;
  let em: Partial<EntityManager>;

  const mockAdmissionResult = {
    id: 'ar-1',
    cccd: '012345678901',
    soBaoDanh: 'SBD001',
    hoTen: 'Nguyen Van A',
    nganhDangKy: 'Computer Science',
    diemMon1: '8.5',
    diemMon2: '9.0',
    diemMon3: '7.5',
    diemTong: '25.0',
    diemUuTienKhuVuc: '0.5',
    diemUuTienDoiTuong: '1.0',
    ghiChu: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  } as unknown as AdmissionResult;

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
        AdmissionResultsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<AdmissionResultsService>(AdmissionResultsService);
  });

  describe('list', () => {
    it('should return paginated admission results', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockAdmissionResult]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].hoTen).toBe('Nguyen Van A');
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, search: 'Nguyen' });

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
    it('should return admission result', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockAdmissionResult);

      const result = await service.getById('ar-1');

      expect(result).not.toBeNull();
      expect(result?.hoTen).toBe('Nguyen Van A');
      expect(result?.soBaoDanh).toBe('SBD001');
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('lookup', () => {
    it('should find admission result by cccd and soBaoDanh', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockAdmissionResult);

      const result = await service.lookup('012345678901', 'SBD001');

      expect(result).not.toBeNull();
      expect(result?.hoTen).toBe('Nguyen Van A');
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.lookup('invalid', 'invalid');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create admission result', async () => {
      const result = await service.create({
        hoTen: 'New Student',
        nganhDangKy: 'Mathematics',
        cccd: '012345678902',
        soBaoDanh: 'SBD002',
      });

      expect(em.persist).toHaveBeenCalled();
      expect(result.hoTen).toBe('New Student');
    });

    it('should trim input fields', async () => {
      const result = await service.create({
        hoTen: '  Trimmed Name  ',
        nganhDangKy: '  Physics  ',
      });

      expect(result.hoTen).toBe('Trimmed Name');
      expect(result.nganhDangKy).toBe('Physics');
    });
  });

  describe('update', () => {
    it('should update admission result fields', async () => {
      const existing = { ...mockAdmissionResult };
      (em.findOne as jest.Mock).mockResolvedValue(existing);

      const result = await service.update('ar-1', {
        hoTen: 'Updated Name',
        diemTong: '28.0',
      });

      expect(result).not.toBeNull();
      expect(result?.hoTen).toBe('Updated Name');
      expect(em.persist).toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', { hoTen: 'New' });

      expect(result).toBeNull();
    });

    it('should trim updated fields', async () => {
      const existing = { ...mockAdmissionResult };
      (em.findOne as jest.Mock).mockResolvedValue(existing);

      await service.update('ar-1', {
        hoTen: '  Updated  ',
        nganhDangKy: '  Updated Major  ',
      });

      expect(existing.hoTen).toBe('Updated');
      expect(existing.nganhDangKy).toBe('Updated Major');
    });
  });

  describe('softDelete', () => {
    it('should soft delete admission result', async () => {
      const ar = { ...mockAdmissionResult, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(ar);

      const result = await service.softDelete('ar-1');

      expect(result).toBe(true);
      expect(ar.deletedAt).not.toBeNull();
    });

    it('should return false when not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      const ar = { ...mockAdmissionResult, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(ar);

      const result = await service.softDelete('ar-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted admission result', async () => {
      const ar = { ...mockAdmissionResult, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(ar);

      const result = await service.restore('ar-1');

      expect(result).toBe(true);
      expect(ar.deletedAt).toBeNull();
    });

    it('should return false when not deleted', async () => {
      const ar = { ...mockAdmissionResult, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(ar);

      const result = await service.restore('ar-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete admission result', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockAdmissionResult);

      const result = await service.hardDelete('ar-1');

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

      const result = await service.bulk('delete', ['ar-1', 'ar-2']);

      expect(result.affected).toBe(2);
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should bulk restore', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('restore', ['ar-1', 'ar-2', 'ar-3']);

      expect(result.affected).toBe(3);
    });

    it('should bulk hard delete', async () => {
      (em.nativeDelete as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('hard-delete', ['ar-1', 'ar-2']);

      expect(result.affected).toBe(2);
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affected).toBe(0);
    });
  });

  describe('getOptions', () => {
    it('should return admission result options', async () => {
      (em.find as jest.Mock).mockResolvedValue([
        { id: 'ar-1', hoTen: 'Nguyen Van A', soBaoDanh: 'SBD001' },
      ]);

      const result = await service.getOptions('hoTen', 'Nguyen', 10);

      expect(result).toHaveLength(1);
    });
  });
});
