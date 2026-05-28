import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { PostCategory } from './post-category.entity';

export type CategoryType = 'post' | 'event';

@Entity({ tableName: 'categories' })
export class Category extends BaseEntity {
  @Property({ unique: true })
  name!: string;

  @Property({ unique: true })
  slug!: string;

  @Property({ type: 'text', nullable: true })
  description?: string | null;

  @Property({ default: 'post' })
  type!: CategoryType;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;

  /** FK `parentId` — không thêm @Property parentId trùng cột (import insertMany sinh cột `parent` sai). */
  @ManyToOne(() => Category, {
    nullable: true,
    fieldName: 'parentId',
  })
  parent?: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  @OneToMany(() => PostCategory, (postCategory) => postCategory.category)
  posts!: PostCategory[];
}
