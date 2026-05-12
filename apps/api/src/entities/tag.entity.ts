import { Entity, OneToMany, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { PostTag } from './post-tag.entity';

@Entity({ tableName: 'tags' })
export class Tag extends BaseEntity {
  @Property({ unique: true })
  name!: string;

  @Property({ unique: true })
  slug!: string;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;

  @OneToMany(() => PostTag, (postTag) => postTag.tag)
  posts!: PostTag[];
}
