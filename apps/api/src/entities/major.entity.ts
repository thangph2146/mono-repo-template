import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'nganhhoc' })
export class Major {
  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'ten_nganh' })
  name!: string;

  @Property({ fieldName: 'ma_nganh' })
  code!: string;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ fieldName: 'created_at', nullable: true })
  createdAt?: Date;

  @Property({ fieldName: 'updated_at', nullable: true })
  updatedAt?: Date;

  @Property({ fieldName: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
