import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity({ tableName: 'face_data' })
export class FaceData extends BaseEntity {
  @ManyToOne(() => User, {
    nullable: true,
    deleteRule: 'cascade',
    fieldName: 'userId',
  })
  user?: User | null;

  @Property()
  imagePath!: string;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ nullable: true })
  updatedAt?: Date | null;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
