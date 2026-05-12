import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'settings' })
export class Setting extends BaseEntity {
  @Property({ unique: true })
  key!: string;

  @Property({ type: 'json' })
  value: unknown;

  @Property({ default: 'general' })
  group: string = 'general';

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;
}
