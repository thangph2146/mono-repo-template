import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(private readonly em: EntityManager) {}

  async list(params: { group?: string; search?: string } = {}) {
    const { group, search } = params;
    const where: Record<string, unknown> = {};
    if (group) where.group = group;
    if (search?.trim()) {
      const q = `%${search.trim()}%`;
      where.$or = [{ key: { $like: q } }, { group: { $like: q } }];
    }
    const data = await this.em.find(Setting, where as FilterQuery<Setting>, {
      orderBy: { key: 'ASC' },
    });

    return { data };
  }

  async getByKey(key: string) {
    return this.em.findOne(Setting, { key });
  }

  async update(key: string, value: any) {
    const existing = await this.em.findOne(Setting, { key });
    if (existing) {
      existing.value = value;
      await this.em.persistAndFlush(existing);
      return existing;
    } else {
      const created = new Setting();
      created.key = key;
      created.value = value;
      created.group = 'general';
      await this.em.persistAndFlush(created);
      return created;
    }
  }

  async bulkUpdate(settings: Record<string, any>) {
    const updates = Object.entries(settings).map(async ([key, value]) => {
      const existing = await this.em.findOne(Setting, { key });
      if (existing) {
        existing.value = value;
        await this.em.persistAndFlush(existing);
        return existing;
      } else {
        const created = new Setting();
        created.key = key;
        created.value = value;
        created.group = 'general';
        await this.em.persistAndFlush(created);
        return created;
      }
    });
    return Promise.all(updates);
  }

  async delete(id: string) {
    const existing = await this.em.findOne(Setting, { id });
    if (!existing) return null;
    await this.em.removeAndFlush(existing);
    return existing;
  }
}
