import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'verification_tokens' })
export class VerificationToken {
  @PrimaryKey()
  identifier!: string;

  @PrimaryKey()
  token!: string;

  @Property()
  expires!: Date;
}
