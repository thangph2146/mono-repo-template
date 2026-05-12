import { Entity, ManyToOne } from '@mikro-orm/core';
import { Post } from './post.entity';
import { Category } from './category.entity';

/** Pivot PK = (postId, categoryId). Chỉ dùng @ManyToOne primary — tránh map trùng cột với @PrimaryKey + fieldName. */
@Entity({ tableName: 'post_categories' })
export class PostCategory {
  @ManyToOne(() => Post, {
    primary: true,
    deleteRule: 'cascade',
    fieldName: 'postId',
  })
  post!: Post;

  @ManyToOne(() => Category, {
    primary: true,
    deleteRule: 'cascade',
    fieldName: 'categoryId',
  })
  category!: Category;
}
