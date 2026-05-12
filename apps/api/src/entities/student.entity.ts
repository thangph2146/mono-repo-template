import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity({ tableName: 'students' })
export class Student extends BaseEntity {
  @Property({ nullable: true })
  name?: string | null;

  @Property({ nullable: true })
  email?: string | null;

  @Property({ unique: true })
  studentCode!: string;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => User, {
    nullable: true,
    fieldName: 'userId',
  })
  user?: User | null;
}
