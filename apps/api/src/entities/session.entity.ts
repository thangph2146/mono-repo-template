import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity({ tableName: 'sessions' })
export class Session extends BaseEntity {
  @Property({ unique: true })
  accessToken!: string;

  @Property({ unique: true })
  refreshToken!: string;

  @Property({ nullable: true })
  userAgent?: string | null;

  @Property({ nullable: true })
  ipAddress?: string | null;

  @Property({ default: true })
  isActive: boolean = true;

  @Property()
  expiresAt!: Date;

  @Property({ defaultRaw: 'current_timestamp' })
  lastActivity!: Date;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'userId',
  })
  user!: User;
}
