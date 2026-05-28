import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'sukien_loai' })
export class EventType {
  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'ten_loai_su_kien' })
  name!: string;

  @Property({ nullable: true })
  slug?: string | null;

  @Property({ fieldName: 'mo_ta', type: 'text', nullable: true })
  description?: string | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ fieldName: 'created_at', nullable: true })
  createdAt?: Date;

  @Property({ fieldName: 'updated_at', nullable: true })
  updatedAt?: Date;

  @Property({ fieldName: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
