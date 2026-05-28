import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'khoahoc' })
export class Course {
  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'ten_khoa_hoc' })
  name!: string;

  @Property({ fieldName: 'nam_bat_dau', nullable: true })
  startYear?: number | null;

  @Property({ fieldName: 'nam_ket_thuc', nullable: true })
  endYear?: number | null;

  @Property({ fieldName: 'phong_khoa_id', nullable: true })
  departmentId?: number | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ fieldName: 'created_at', nullable: true })
  createdAt?: Date;

  @Property({ fieldName: 'updated_at', nullable: true })
  updatedAt?: Date;

  @Property({ fieldName: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
