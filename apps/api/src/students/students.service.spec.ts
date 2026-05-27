import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/core';
import { StudentsService } from './students.service';
import { Student } from '../entities/student.entity';
import { User } from '../entities/user.entity';

describe('StudentsService', () => {
  let service: StudentsService;
  let em: Partial<EntityManager>;

  const mockStudent = {
    id: 'student-1',
    user: null,
    name: 'Test Student',
    email: 'student@test.com',
    studentCode: 'STU001',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as Student;

  beforeEach(async () => {
    em = {
      findOne: jest.fn(),
      find: jest.fn(),
      persistAndFlush: jest.fn().mockImplementation((entity) => {
        if (entity) {
          entity.createdAt = entity.createdAt || new Date('2024-01-01');
          entity.updatedAt = entity.updatedAt || new Date('2024-01-01');
        }
      }),
      count: jest.fn(),
      nativeUpdate: jest.fn(),
      removeAndFlush: jest.fn(),
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        {
          provide: EntityManager,
          useValue: em,
        },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('list', () => {
    it('should return paginated students', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockStudent]);
      (em.count as jest.Mock).mockResolvedValue(1);

      const result = await service.list({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].studentCode).toBe('STU001');
      expect(result.pagination.total).toBe(1);
    });

    it('should apply search filter', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, search: 'student' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should filter by deleted status', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({ page: 1, limit: 10, status: 'deleted' });

      expect(em.find).toHaveBeenCalled();
    });

    it('should filter by isActive', async () => {
      (em.find as jest.Mock).mockResolvedValue([]);
      (em.count as jest.Mock).mockResolvedValue(0);

      await service.list({
        page: 1,
        limit: 10,
        filters: { isActive: 'true' },
      });

      expect(em.find).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return student', async () => {
      const studentMock = { ...mockStudent };
      (em.findOne as jest.Mock).mockResolvedValue(studentMock);

      const result = await service.getById('student-1');

      expect(result).not.toBeNull();
      expect(result?.studentCode).toBe('STU001');
      expect(result?.name).toBe('Test Student');
    });

    it('should return null when student not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create student successfully', async () => {
      const result = await service.create({
        name: 'New Student',
        email: 'new@student.com',
        studentCode: 'STU002',
      });

      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(result.studentCode).toBe('STU002');
      expect(result.isActive).toBe(true);
    });

    it('should create student with user association', async () => {
      const result = await service.create({
        userId: 'user-1',
        studentCode: 'STU003',
      });

      expect(em.persistAndFlush).toHaveBeenCalled();
      expect(result.userId).toBe('user-1');
    });

    it('should create student with isActive false', async () => {
      const result = await service.create({
        studentCode: 'STU004',
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });

    it('should trim studentCode', async () => {
      const result = await service.create({
        studentCode: '  STU005  ',
      });

      expect(result.studentCode).toBe('STU005');
    });
  });

  describe('update', () => {
    it('should update student fields', async () => {
      const existingStudent = { ...mockStudent };
      (em.findOne as jest.Mock).mockResolvedValue(existingStudent);

      const result = await service.update('student-1', {
        name: 'Updated Student',
        email: 'updated@student.com',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Student');
      expect(em.persistAndFlush).toHaveBeenCalled();
    });

    it('should return null when student not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.update('nonexistent', { name: 'New' });

      expect(result).toBeNull();
    });

    it('should update user association', async () => {
      const existingStudent = { ...mockStudent };
      const user = { id: 'user-2' } as unknown as User;
      (em.findOne as jest.Mock)
        .mockResolvedValueOnce(existingStudent)
        .mockResolvedValueOnce(user);

      await service.update('student-1', { userId: 'user-2' });

      expect(em.findOne).toHaveBeenCalledWith(User, { id: 'user-2' });
    });

    it('should remove user association when userId is null', async () => {
      const existingStudent = { ...mockStudent };
      (em.findOne as jest.Mock).mockResolvedValue(existingStudent);

      await service.update('student-1', { userId: null });

      expect(existingStudent.user).toBeNull();
    });

    it('should trim studentCode on update', async () => {
      const existingStudent = { ...mockStudent };
      (em.findOne as jest.Mock).mockResolvedValue(existingStudent);

      await service.update('student-1', { studentCode: '  STU999  ' });

      expect(existingStudent.studentCode).toBe('STU999');
    });
  });

  describe('softDelete', () => {
    it('should soft delete student', async () => {
      const student = { ...mockStudent, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(student);

      const result = await service.softDelete('student-1');

      expect(result).toBe(true);
      expect(student.deletedAt).not.toBeNull();
    });

    it('should return false when student not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.softDelete('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when already deleted', async () => {
      const student = { ...mockStudent, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(student);

      const result = await service.softDelete('student-1');

      expect(result).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore deleted student', async () => {
      const student = { ...mockStudent, deletedAt: new Date() };
      (em.findOne as jest.Mock).mockResolvedValue(student);

      const result = await service.restore('student-1');

      expect(result).toBe(true);
      expect(student.deletedAt).toBeNull();
    });

    it('should return false when student not deleted', async () => {
      const student = { ...mockStudent, deletedAt: null };
      (em.findOne as jest.Mock).mockResolvedValue(student);

      const result = await service.restore('student-1');

      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete student', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(mockStudent);

      const result = await service.hardDelete('student-1');

      expect(result).toBe(true);
      expect(em.removeAndFlush).toHaveBeenCalled();
    });

    it('should return false when student not found', async () => {
      (em.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.hardDelete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('bulk', () => {
    it('should bulk delete students', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(2);

      const result = await service.bulk('delete', ['student-1', 'student-2']);

      expect(result.affected).toBe(2);
      expect(result.message).toContain('2 học viên');
    });

    it('should bulk restore students', async () => {
      (em.nativeUpdate as jest.Mock).mockResolvedValue(3);

      const result = await service.bulk('restore', [
        'student-1',
        'student-2',
        'student-3',
      ]);

      expect(result.affected).toBe(3);
      expect(result.message).toContain('3 học viên');
    });

    it('should bulk hard delete students', async () => {
      (em.find as jest.Mock).mockResolvedValue([mockStudent]);

      const result = await service.bulk('hard-delete', ['student-1']);

      expect(result.affected).toBe(1);
      expect(result.message).toContain('1 học viên');
    });

    it('should return 0 when ids are empty', async () => {
      const result = await service.bulk('delete', []);

      expect(result.affected).toBe(0);
      expect(result.message).toContain('Không có bản ghi');
    });
  });

  describe('getOptions', () => {
    it('should return student options', async () => {
      const mockRepo = {
        find: jest.fn().mockResolvedValue([
          {
            id: 'student-1',
            name: 'Student 1',
            studentCode: 'STU001',
          },
        ]),
      };
      jest
        .spyOn(em, 'getRepository')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        .mockReturnValue(mockRepo as any);

      const result = await service.getOptions('studentCode', 'STU', 10);

      expect(result).toHaveLength(1);
    });
  });
});
