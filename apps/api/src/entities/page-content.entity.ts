import { Entity, Property, Unique } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'page_contents' })
@Unique({ properties: ['pageKey', 'sectionKey'] })
export class PageContent extends BaseEntity {
  @Property()
  pageKey!: string;

  @Property()
  sectionKey!: string;

  @Property({ type: 'json' })
  content!: Record<string, unknown>;

  @Property({ default: true })
  isVisible!: boolean;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;
}
