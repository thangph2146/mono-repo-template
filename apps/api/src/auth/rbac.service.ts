import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { User } from '../entities/user.entity';

@Injectable()
export class RbacService {
  constructor(private readonly orm: MikroORM) {}

  /**
   * Hợp quyền từ mọi role của user (union). Role `super_admin` thêm mã `*`.
   */
  async getEffectivePermissionCodes(userId: number): Promise<Set<string>> {
    const em = this.orm.em.fork();
    const user = await em.findOne(
      User,
      { id: userId, isActive: true },
      {
        populate: [
          'userRoleLinks.role',
          'userRoleLinks.role.permissionLinks',
          'userRoleLinks.role.permissionLinks.permission',
        ],
      },
    );
    if (!user) {
      return new Set();
    }
    const codes = new Set<string>();
    for (const link of user.userRoleLinks) {
      const role = link.role;
      if (!role) continue;
      const roleCode = role.code?.trim().toLowerCase();
      if (roleCode === 'super_admin') {
        codes.add('*');
      }
      for (const pl of role.permissionLinks) {
        const p = pl.permission;
        if (p?.code) {
          codes.add(p.code);
        }
      }
    }
    return codes;
  }

  async userHasAll(userId: number, required: string[]): Promise<boolean> {
    if (required.length === 0) return true;
    const granted = await this.getEffectivePermissionCodes(userId);
    if (granted.has('*')) return true;
    return required.every((c) => granted.has(c));
  }
}
