import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'bachoc' })
export class TrainingLevel {
  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'ten_bachoc' })
  name!: string;

  @Property({ fieldName: 'ma_bachoc', nullable: true })
  code?: string | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ fieldName: 'created_at', nullable: true })
  createdAt?: Date;

  @Property({ fieldName: 'updated_at', nullable: true })
  updatedAt?: Date;

  @Property({ fieldName: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
