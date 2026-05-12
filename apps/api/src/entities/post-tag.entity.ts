import { Entity, ManyToOne } from '@mikro-orm/core';
import { Post } from './post.entity';
import { Tag } from './tag.entity';

/** Pivot PK = (postId, tagId). Chỉ dùng @ManyToOne primary — tránh map trùng cột. */
@Entity({ tableName: 'post_tags' })
export class PostTag {
  @ManyToOne(() => Post, {
    primary: true,
    deleteRule: 'cascade',
    fieldName: 'postId',
  })
  post!: Post;

  @ManyToOne(() => Tag, {
    primary: true,
    deleteRule: 'cascade',
    fieldName: 'tagId',
  })
  tag!: Tag;
}
