import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export type ParentStudentStatus = 'pending' | 'approved' | 'rejected';

/**
 * Liên kết phụ huynh (User có role parent) với học sinh (qua mã sinh viên).
 * Khi phụ huynh thêm con, status = 'pending', quản trị viên duyệt → 'approved'.
 * Dữ liệu điểm được lấy từ API ngoài theo studentCode.
 */
@Entity({ tableName: 'parent_students' })
@Unique({ properties: ['parent', 'studentCode'] })
export class ParentStudent extends BaseEntity {
  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'parentId',
  })
  parent!: User;

  @Property()
  studentCode!: string;

  @Property({ nullable: true })
  studentName?: string | null;

  @Property({ nullable: true })
  note?: string | null;

  @Property({ default: 'pending' })
  status: ParentStudentStatus = 'pending';

  @Property({ nullable: true })
  reviewedBy?: string | null;

  @Property({ nullable: true })
  reviewedAt?: Date | null;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;
}
