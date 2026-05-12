import { Seeder } from '@mikro-orm/seeder';
import type { EntityManager } from '@mikro-orm/core';
import { runSuperadminBootstrap } from '../seeds/superadmin-bootstrap.runner';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await runSuperadminBootstrap(em);
  }
}
