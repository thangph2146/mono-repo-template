import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'cameras' })
export class Camera extends BaseEntity {
  @Property()
  name!: string;

  @Property({ nullable: true })
  code?: string | null;

  @Property({ nullable: true })
  ipAddress?: string | null;

  @Property({ nullable: true })
  port?: number | null;

  @Property({ nullable: true })
  username?: string | null;

  @Property({ nullable: true, hidden: true })
  password?: string | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
