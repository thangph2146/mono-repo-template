import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';

@Entity({ tableName: 'seo_meta' })
export class SeoMeta extends BaseEntity {
  @Property({ unique: true })
  page!: string;

  @Property({ nullable: true })
  title?: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ nullable: true })
  keywords?: string;

  @Property({ nullable: true })
  ogTitle?: string;

  @Property({ type: 'text', nullable: true })
  ogDescription?: string;

  @Property({ nullable: true })
  ogImage?: string;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ nullable: true })
  createdAt?: Date;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
