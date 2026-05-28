import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'departments' })
export class Department extends BaseEntity {
  @Property()
  name!: string;

  @Property({ unique: true })
  code!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
