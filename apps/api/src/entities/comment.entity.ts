import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity({ tableName: 'comments' })
export class Comment extends BaseEntity {
  @Property({ type: 'text' })
  content!: string;

  @Property({ default: false })
  approved: boolean = false;

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

  @ManyToOne(() => Post, {
    deleteRule: 'cascade',
    fieldName: 'postId',
  })
  post!: Post;
}
