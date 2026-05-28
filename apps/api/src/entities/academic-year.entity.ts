import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'namhoc' })
export class AcademicYear {
  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'ten_nam_hoc' })
  name!: string;

  @Property({ fieldName: 'ngay_bat_dau', type: 'date', nullable: true })
  startDate?: string | null;

  @Property({ fieldName: 'ngay_ket_thuc', type: 'date', nullable: true })
  endDate?: string | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ fieldName: 'created_at', nullable: true })
  createdAt?: Date;

  @Property({ fieldName: 'updated_at', nullable: true })
  updatedAt?: Date;

  @Property({ fieldName: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
