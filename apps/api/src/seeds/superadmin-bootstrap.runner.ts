import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import type { EntityManager } from '@mikro-orm/core';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { PageContent } from '../entities/page-content.entity';
import {
  SUPERADMIN_ROLES_DATA,
  SUPERADMIN_USERS_DATA,
  SUPERADMIN_USER_ROLES_DATA,
} from './superadmin-bootstrap.data';

/**
 * Đảm bảo các cặp (userId, roleId) trong seed tồn tại trong user_roles nếu user + role đã có.
 * Tránh mất quyền giữa chừng khi import user không kèm userRole hoặc export thiếu dòng.
 */
export async function ensureSeedUserRoleLinks(
  em: EntityManager,
): Promise<void> {
  for (const link of SUPERADMIN_USER_ROLES_DATA) {
    const exists = await em.findOne(UserRole, {
      user: link.userId,
      role: link.roleId,
    });
    if (exists) continue;
    const user = await em.findOne(User, { id: link.userId });
    const role = await em.findOne(Role, { id: link.roleId });
    if (!user || !role) continue;
    const ur = new UserRole();
    ur.user = em.getReference(User, link.userId);
    ur.role = em.getReference(Role, link.roleId);
    em.persist(ur);
  }
  await em.flush();
}

export type SuperadminBootstrapResult = {
  rolesInserted: number;
  rolesUpdated: number;
  rolesSkipped: number;
  usersInserted: number;
  usersUpdated: number;
  usersSkipped: number;
  userRolesInserted: number;
  userRolesSkipped: number;
  pageContentsInserted: number;
  pageContentsSkipped: number;
};

type PageContentSeedRow = {
  id?: string;
  pageKey?: string;
  sectionKey?: string;
  title?: string;
  content?: string;
  type?: string;
  order?: number;
  imageUrl?: string | null;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
};

function loadOptionalPageContent(): PageContentSeedRow[] {
  const candidates = [
    path.join(process.cwd(), 'src/export-pageContent-2026-04-28.json'),
    path.join(
      process.cwd(),
      'apps/tuyen-sinh-api/src/export-pageContent-2026-04-28.json',
    ),
    path.join(__dirname, '..', 'export-pageContent-2026-04-28.json'),
  ];
  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as {
        pageContent?: unknown;
      };
      return Array.isArray(parsed.pageContent)
        ? (parsed.pageContent as PageContentSeedRow[])
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Idempotent: giống `pnpm run seed:superadmin` (roles, users, user_roles, page_contents tùy file JSON).
 */
export async function runSuperadminBootstrap(
  em: EntityManager,
  log?: (message: string) => void,
): Promise<SuperadminBootstrapResult> {
  const out: SuperadminBootstrapResult = {
    rolesInserted: 0,
    rolesUpdated: 0,
    rolesSkipped: 0,
    usersInserted: 0,
    usersUpdated: 0,
    usersSkipped: 0,
    userRolesInserted: 0,
    userRolesSkipped: 0,
    pageContentsInserted: 0,
    pageContentsSkipped: 0,
  };

  const L = log ?? (() => undefined);

  L('Seeding roles...');
  for (const roleData of SUPERADMIN_ROLES_DATA) {
    const existing = await em.findOne(Role, { id: roleData.id });
    if (!existing) {
      const role = new Role();
      role.id = roleData.id;
      role.name = roleData.name;
      role.displayName = roleData.displayName;
      role.description = roleData.description;
      role.permissions = roleData.permissions;
      role.isActive = roleData.isActive;
      em.persist(role);
      out.rolesInserted++;
      L(`Created role: ${roleData.name}`);
    } else {
      existing.name = roleData.name;
      existing.displayName = roleData.displayName;
      existing.description = roleData.description;
      existing.permissions = roleData.permissions;
      existing.isActive = roleData.isActive;
      em.persist(existing);
      out.rolesUpdated++;
      L(`Updated role: ${roleData.name}`);
    }
  }

  L('Seeding users...');
  for (const userData of SUPERADMIN_USERS_DATA) {
    const existing = await em.findOne(User, { id: userData.id });
    if (!existing) {
      const user = new User();
      user.id = userData.id;
      user.email = userData.email;
      user.name = userData.name;
      user.password = userData.password;
      user.bio = userData.bio;
      user.avatar = userData.avatar;
      user.emailVerified = userData.emailVerified;
      user.phone = userData.phone;
      user.address = userData.address;
      user.isActive = userData.isActive;
      em.persist(user);
      out.usersInserted++;
      L(`Created user: ${userData.email}`);
    } else {
      existing.email = userData.email;
      existing.name = userData.name;
      existing.password = userData.password;
      existing.bio = userData.bio;
      existing.avatar = userData.avatar;
      existing.emailVerified = userData.emailVerified;
      existing.phone = userData.phone;
      existing.address = userData.address;
      existing.isActive = userData.isActive;
      em.persist(existing);
      out.usersUpdated++;
      L(`Updated user: ${userData.email}`);
    }
  }

  L('Seeding user roles...');
  for (const userRoleData of SUPERADMIN_USER_ROLES_DATA) {
    const existingPair = await em.findOne(UserRole, {
      user: userRoleData.userId,
      role: userRoleData.roleId,
    });
    if (existingPair) {
      out.userRolesSkipped++;
      L(
        `User role already exists (user+role): ${userRoleData.userId} -> ${userRoleData.roleId}`,
      );
      continue;
    }
    const ur = new UserRole();
    ur.id = userRoleData.id;
    ur.user = em.getReference(User, userRoleData.userId);
    ur.role = em.getReference(Role, userRoleData.roleId);
    em.persist(ur);
    out.userRolesInserted++;
    L(`Created user role: ${userRoleData.userId} -> ${userRoleData.roleId}`);
  }

  const pageContentData = loadOptionalPageContent();
  L('Seeding page contents...');
  for (const pc of pageContentData) {
    if (!pc.pageKey || !pc.sectionKey) continue;
    let existing = pc.id ? await em.findOne(PageContent, { id: pc.id }) : null;
    if (!existing) {
      existing = await em.findOne(PageContent, {
        pageKey: pc.pageKey,
        sectionKey: pc.sectionKey,
      });
    }
    if (!existing) {
      const pageContent = new PageContent();
      pageContent.id = pc.id ?? randomUUID();
      pageContent.pageKey = pc.pageKey;
      pageContent.sectionKey = pc.sectionKey;
      pageContent.content =
        pc.metadata ??
        (typeof pc.content === 'string' && pc.content.trim()
          ? { value: pc.content }
          : {});
      pageContent.isVisible = pc.isActive ?? true;
      em.persist(pageContent);
      out.pageContentsInserted++;
      L(`Created page content: ${pc.pageKey}/${pc.sectionKey}`);
    } else {
      out.pageContentsSkipped++;
      L(`Page content already exists: ${pc.pageKey}/${pc.sectionKey}`);
    }
  }

  await em.flush();
  L('Bootstrap seed completed.');
  return out;
}
