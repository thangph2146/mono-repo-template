import { randomUUID } from 'node:crypto';
import { PrimaryKey } from '@mikro-orm/core';

export abstract class BaseEntity {
  @PrimaryKey({ type: 'string', length: 36 })
  id: string = randomUUID();
}
