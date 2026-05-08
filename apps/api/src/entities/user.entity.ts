import { Entity, PrimaryKey, Property, Enum, Unique } from '@mikro-orm/core';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  CUSTOMER = 'customer',
}

@Entity()
export class User {
  @PrimaryKey({ type: 'integer', autoincrement: true })
  id!: number;

  @Property()
  @Unique()
  email!: string;

  @Property()
  password!: string;

  @Property()
  fullName!: string;

  @Property({ nullable: true })
  phone?: string;

  @Property({ nullable: true, type: 'text' })
  address?: string;

  @Enum({ items: () => UserRole, default: UserRole.CUSTOMER })
  role: UserRole = UserRole.CUSTOMER;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
