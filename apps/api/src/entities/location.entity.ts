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

  @Property({ fieldName: 'created_at', onCreate: () => new Date() })
  createdAt!: Date;

  @Property({
    fieldName: 'updated_at',
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  @Property({ fieldName: 'deleted_at', nullable: true })
  deletedAt?: Date | null;
}
