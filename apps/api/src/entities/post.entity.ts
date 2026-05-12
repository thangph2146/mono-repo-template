import { Entity, ManyToOne, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Comment } from './comment.entity';
import { PostCategory } from './post-category.entity';
import { PostTag } from './post-tag.entity';
import { User } from './user.entity';

@Entity({ tableName: 'posts' })
export class Post extends BaseEntity {
  @Property()
  title!: string;

  @Property({ type: 'json' })
  content: unknown;

  @Property({ type: 'text', nullable: true })
  excerpt?: string | null;

  @Property({ unique: true })
  slug!: string;

  @Property({ nullable: true })
  image?: string | null;

  @Property({ default: false })
  published: boolean = false;

  @Property({ nullable: true })
  publishedAt?: Date | null;

  @Property({ nullable: true })
  eventStartAt?: Date | null;

  @Property({ nullable: true })
  eventEndAt?: Date | null;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'authorId',
  })
  author!: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];

  @OneToMany(() => PostCategory, (postCategory) => postCategory.post)
  categories!: PostCategory[];

  @OneToMany(() => PostTag, (postTag) => postTag.post)
  tags!: PostTag[];
}
