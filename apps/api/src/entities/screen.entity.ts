import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { Camera } from './camera.entity';
import { Template } from './template.entity';

@Entity({ tableName: 'screens' })
export class Screen extends BaseEntity {
  @Property()
  name!: string;

  @Property({ nullable: true })
  code?: string | null;

  @ManyToOne(() => Camera, {
    nullable: true,
    fieldName: 'cameraId',
  })
  camera?: Camera | null;

  @ManyToOne(() => Template, {
    nullable: true,
    fieldName: 'templateId',
  })
  template?: Template | null;

  @Property({ default: 1 })
  status: number = 1;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ nullable: true })
  deletedAt?: Date | null;
}
