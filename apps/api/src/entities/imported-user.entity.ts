import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { AcademicYear } from './academic-year.entity';
import { TrainingLevel } from './training-level.entity';
import { TrainingSystem } from './training-system.entity';
import { Major } from './major.entity';

@Entity({ tableName: 'nguoidung' })
export class ImportedUser {
  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'AccountId', nullable: true })
  accountId?: string | null;

  @Property({ fieldName: 'LastName', nullable: true })
  lastName?: string | null;

  @Property({ fieldName: 'MiddleName', nullable: true })
  middleName?: string | null;

  @Property({ fieldName: 'FirstName', nullable: true })
  firstName?: string | null;

  @Property({ fieldName: 'AccountType', nullable: true })
  accountType?: string | null;

  @Property({ fieldName: 'FullName', nullable: true })
  fullName?: string | null;

  @Property({ fieldName: 'MobilePhone', nullable: true })
  mobilePhone?: string | null;

  @Property({ fieldName: 'Email', nullable: true })
  email?: string | null;

  @Property({ fieldName: 'HomePhone1', nullable: true })
  homePhone1?: string | null;

  @Property({ fieldName: 'PW', nullable: true })
  password?: string | null;

  @Property({ fieldName: 'HomePhone', nullable: true })
  homePhone?: string | null;

  @Property({ fieldName: 'Avatar', nullable: true })
  avatar?: string | null;

  @Property({ fieldName: 'CanUploadAvatar', default: 1 })
  canUploadAvatar: number = 1;

  @Property({ fieldName: 'loai_id', nullable: true })
  typeId?: number | null;

  @ManyToOne(() => AcademicYear, { fieldName: 'nam_hoc_id', nullable: true })
  academicYear?: AcademicYear;

  @ManyToOne(() => TrainingLevel, { fieldName: 'bac_hoc_id', nullable: true })
  trainingLevel?: TrainingLevel;

  @ManyToOne(() => TrainingSystem, {
    fieldName: 'he_dao_tao_id',
    nullable: true,
  })
  trainingSystem?: TrainingSystem;

  @ManyToOne(() => Major, { fieldName: 'nganh_id', nullable: true })
  major?: Major;

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

  @Property({ fieldName: 'refresh_token', type: 'text', nullable: true })
  refreshToken?: string | null;

  @Property({ fieldName: 'refresh_token_exp', nullable: true })
  refreshTokenExp?: Date | null;
}
