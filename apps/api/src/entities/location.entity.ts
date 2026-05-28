import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'diadiem' })
export class Location {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'text', nullable: true })
  name?: string | null;

  @Property({ type: 'text', nullable: true })
  address?: string | null;

  @Property({ fieldName: 'url_bando' })
  mapUrl!: string;

  @Property({ nullable: true })
  status?: number | null;

  @Property({ fieldName: 'created_at', nullable: true })
  createdAt?: Date;

  @Property({ fieldName: 'updated_at', nullable: true })
  updatedAt?: Date;

  @Property({ fieldName: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
