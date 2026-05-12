import {
  EntityManager,
  type EntityName,
  type FilterQuery,
} from '@mikro-orm/core';
import { AdmissionResult } from '../entities/admission-result.entity';
import { Category } from '../entities/category.entity';
import { ContactRequest } from '../entities/contact-request.entity';
import { Group } from '../entities/group.entity';
import { Message } from '../entities/message.entity';
import { Notification } from '../entities/notification.entity';
import { Post } from '../entities/post.entity';
import { Role } from '../entities/role.entity';
import { Session } from '../entities/session.entity';
import { Setting } from '../entities/setting.entity';
import { Student } from '../entities/student.entity';
import { Tag } from '../entities/tag.entity';
import { User } from '../entities/user.entity';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const entityByModelName = {
  admissionResult: AdmissionResult,
  category: Category,
  contactRequest: ContactRequest,
  group: Group,
  message: Message,
  notification: Notification,
  post: Post,
  role: Role,
  session: Session,
  setting: Setting,
  student: Student,
  tag: Tag,
  user: User,
} as const;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value.trim());
}

export interface RelationFilterConfig {
  model: string;
  nameField: string;
  softDelete?: boolean;
}

export type RelationFiltersConfig = Record<string, RelationFilterConfig>;

async function findByEntity(
  em: EntityManager,
  rel: RelationFilterConfig,
  value: string,
  field: string,
): Promise<{ id: string } | null> {
  const entity = entityByModelName[rel.model as keyof typeof entityByModelName];
  if (!entity) return null;

  const repo = em.getRepository(entity as EntityName<object>);
  const where = { [field]: value } as FilterQuery<object>;
  if (rel.softDelete) {
    (where as Record<string, unknown>).deletedAt = null;
  }

  const result = (await repo.findOne(where)) as { id?: unknown } | null;
  return result && typeof result.id === 'string' ? { id: result.id } : null;
}

export async function resolveRelationFilters(
  em: EntityManager,
  filters: Record<string, string> | undefined,
  config: RelationFiltersConfig,
): Promise<Record<string, string> | undefined> {
  if (!filters) return undefined;
  let output = { ...filters };

  for (const [key, rel] of Object.entries(config)) {
    const raw = output[key];
    if (!raw?.trim()) continue;

    const value = raw.trim();
    const byId = await findByEntity(em, rel, value, 'id');
    if (byId) {
      output = { ...output, [key]: byId.id };
      continue;
    }

    if (isUuid(value)) {
      delete (output as Record<string, unknown>)[key];
      continue;
    }

    const byName = await findByEntity(em, rel, value, rel.nameField);
    if (byName) {
      output = { ...output, [key]: byName.id };
    } else {
      delete (output as Record<string, unknown>)[key];
    }
  }

  return output;
}
