import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'templates' })
export class Template extends BaseEntity {
  @Property()
  name!: string;

  @Property({ nullable: true })
  code?: string | null;

  @Property({ type: 'json', nullable: true })
  content?: unknown;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
