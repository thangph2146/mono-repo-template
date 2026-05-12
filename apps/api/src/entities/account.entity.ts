import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity({ tableName: 'accounts' })
export class Account extends BaseEntity {
  @Property()
  type!: string;

  @Property()
  provider!: string;

  @Property()
  providerAccountId!: string;

  @Property({ type: 'text', nullable: true })
  refresh_token?: string;

  @Property({ type: 'text', nullable: true })
  access_token?: string;

  @Property({ type: 'number', nullable: true })
  expires_at?: number;

  @Property({ nullable: true })
  token_type?: string;

  @Property({ nullable: true })
  scope?: string;

  @Property({ type: 'text', nullable: true })
  id_token?: string;

  @Property({ nullable: true })
  session_state?: string;

  @ManyToOne(() => User, {
    deleteRule: 'cascade',
    fieldName: 'userId',
  })
  user!: User;
}
