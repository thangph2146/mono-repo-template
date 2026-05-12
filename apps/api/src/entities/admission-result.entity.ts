import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'admission_results' })
export class AdmissionResult extends BaseEntity {
  @Property({ nullable: true, unique: true })
  cccd?: string | null;

  @Property({ nullable: true, unique: true })
  soBaoDanh?: string | null;

  @Property()
  hoTen!: string;

  @Property()
  nganhDangKy!: string;

  @Property({ nullable: true })
  diemMon1?: string | null;

  @Property({ nullable: true })
  diemMon2?: string | null;

  @Property({ nullable: true })
  diemMon3?: string | null;

  @Property({ nullable: true })
  diemTong?: string | null;

  @Property({ nullable: true })
  diemUuTienKhuVuc?: string | null;

  @Property({ nullable: true })
  diemUuTienDoiTuong?: string | null;

  @Property({ type: 'text', nullable: true })
  ghiChu?: string | null;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
