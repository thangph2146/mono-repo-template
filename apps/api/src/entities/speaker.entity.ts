import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'diengia' })
export class Speaker {
  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'ten_dien_gia' })
  name!: string;

  @Property({ fieldName: 'chuc_danh', nullable: true })
  title?: string | null;

  @Property({ fieldName: 'to_chuc', nullable: true })
  organization?: string | null;

  @Property({ fieldName: 'gioi_thieu', type: 'text', nullable: true })
  bio?: string | null;

  @Property({ nullable: true })
  avatar?: string | null;

  @Property({ nullable: true })
  email?: string | null;

  @Property({ fieldName: 'dien_thoai', nullable: true })
  phone?: string | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({
    fieldName: 'created_at',
    nullable: true,
    onCreate: () => new Date(),
  })
  createdAt?: Date;

  @Property({
    fieldName: 'updated_at',
    nullable: true,
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt?: Date;

  @Property({ fieldName: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
