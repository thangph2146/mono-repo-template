import { Injectable, Logger } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { EntityManager } from '@mikro-orm/core';
import { AUTH_ROLE_NAMES } from '../config/constants';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';

export interface LoginDto {
  email: string;
  password: string;
}

export interface GoogleProfileDto {
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  permissions: string[];
  roles: Array<{ id: string; name: string; displayName: string }>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly em: EntityManager) {}

  async verifyGoogleToken(credential: string): Promise<{
    email: string;
    name?: string | null;
    image?: string | null;
  } | null> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      this.logger.warn('GOOGLE_CLIENT_ID not configured');
      return null;
    }
    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        this.logger.warn('Google token missing email');
        return null;
      }
      return {
        email: payload.email,
        name: payload.name ?? null,
        image: payload.picture ?? null,
      };
    } catch (err) {
      this.logger.error('Google token verification failed', err);
      return null;
    }
  }

  private async getOrCreateRole(
    name: string,
    displayName: string,
  ): Promise<{ id: string }> {
    let role = await this.em.findOne(Role, { name });
    if (!role) {
      role = new Role();
      role.name = name;
      role.displayName = displayName;
      role.isActive = true;
      this.em.persist(role);
      await this.em.flush();
    }
    return { id: role.id };
  }

  private mapUserToPayload(user: User): AuthUserPayload {
    const activeUserRoles = (user.userRoles || []).filter(
      (ur) => ur.role && ur.role.deletedAt == null,
    );
    const permissions = activeUserRoles.flatMap((ur) => {
      const raw = ur.role.permissions;
      if (raw == null) return [];
      if (Array.isArray(raw))
        return raw.filter((p): p is string => typeof p === 'string');
      if (typeof raw === 'string') return [raw];
      return [];
    });
    const roles = activeUserRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
    }));
    return {
      id: user.id,
      email: user.email ?? '',
      name: user.name ?? null,
      image: user.avatar ?? null,
      permissions,
      roles,
    };
  }

  async login(dto: LoginDto): Promise<AuthUserPayload | null> {
    const email = dto.email?.trim()?.toLowerCase();
    if (!email || !dto.password) {
      return null;
    }

    const user = await this.em.findOne(
      User,
      { email },
      { populate: ['userRoles', 'userRoles.role'] },
    );

    if (!user || !user.isActive || user.deletedAt != null) {
      this.logger.warn(
        `Login failed: user not found, inactive, or deleted for email=${email}`,
      );
      return null;
    }

    const isValid = await compare(dto.password, user.password);

    if (!isValid) {
      this.logger.warn(`Login failed: password mismatch for email=${email}`);
      return null;
    }

    if (!user.userRoles?.length) {
      this.logger.warn(
        `Login failed: user has no roles assigned for email=${email}`,
      );
      return null;
    }

    return this.mapUserToPayload(user);
  }

  async loginAsDevelopmentUser(
    userId: string,
  ): Promise<AuthUserPayload | null> {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const { payload } = await this.tryAuthPayloadByUserId(userId.trim());
    return payload;
  }

  async loginWithGoogle(
    profile: GoogleProfileDto,
  ): Promise<AuthUserPayload | null> {
    const email = profile.email?.trim()?.toLowerCase();
    if (!email) return null;

    let user = await this.em.findOne(
      User,
      { email },
      { populate: ['userRoles', 'userRoles.role'] },
    );

    if (user) {
      if (!user.isActive || user.deletedAt != null) return null;
      if (!user.userRoles?.length) {
        const adminRole = await this.getOrCreateRole(
          AUTH_ROLE_NAMES.ADMIN,
          'Admin',
        );
        const ur = new UserRole();
        ur.user = user;
        ur.role = this.em.getReference(Role, adminRole.id);
        this.em.persist(ur);
        await this.em.flush();
        user = await this.em.findOne(
          User,
          { email },
          { populate: ['userRoles', 'userRoles.role'] },
        );
      }
      if (!user?.userRoles?.length) return null;
      return this.mapUserToPayload(user);
    }

    const userRole = await this.getOrCreateRole(AUTH_ROLE_NAMES.USER, 'User');

    const password = await hash(randomBytes(16).toString('hex'), 10);
    const newUserObj = new User();
    newUserObj.email = email;
    newUserObj.name = profile.name ?? null;
    newUserObj.avatar = profile.image ?? null;
    newUserObj.password = password;
    newUserObj.isActive = true;
    this.em.persist(newUserObj);
    await this.em.flush();

    const ur1 = new UserRole();
    ur1.user = newUserObj;
    ur1.role = this.em.getReference(Role, userRole.id);
    this.em.persist(ur1);
    await this.em.flush();
    const adminRole = await this.getOrCreateRole(
      AUTH_ROLE_NAMES.ADMIN,
      'Admin',
    );
    const ur2 = new UserRole();
    ur2.user = newUserObj;
    ur2.role = this.em.getReference(Role, adminRole.id);
    this.em.persist(ur2);
    await this.em.flush();

    const created = await this.em.findOne(
      User,
      { email },
      { populate: ['userRoles', 'userRoles.role'] },
    );
    return created ? this.mapUserToPayload(created) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout(_userId?: string): Promise<{ ok: boolean }> {
    return Promise.resolve({ ok: true });
  }

  /**
   * Giống getAuthPayloadByUserId nhưng trả `reason` để API /me báo lỗi rõ
   * (vd. sau import user mà chưa có user_roles).
   */
  async tryAuthPayloadByUserId(userId: string): Promise<{
    payload: AuthUserPayload | null;
    reason?: 'not_found' | 'inactive' | 'no_roles';
  }> {
    if (!userId?.trim()) {
      return { payload: null, reason: 'not_found' };
    }

    const user = await this.em.findOne(
      User,
      { id: userId.trim() },
      { populate: ['userRoles', 'userRoles.role'] },
    );

    if (!user) {
      return { payload: null, reason: 'not_found' };
    }

    if (!user.isActive || user.deletedAt != null) {
      return { payload: null, reason: 'inactive' };
    }

    const activeUserRoles = (user.userRoles || []).filter(
      (ur) => ur.role && ur.role.deletedAt == null,
    );
    if (!activeUserRoles.length) {
      this.logger.warn(
        `User ${userId} tồn tại nhưng không có user_roles / role hợp lệ — /auth/admin/me và đăng nhập sẽ thất bại cho đến khi gán role.`,
      );
      return { payload: null, reason: 'no_roles' };
    }

    return { payload: this.mapUserToPayload(user) };
  }

  async getAuthPayloadByUserId(
    userId: string,
  ): Promise<AuthUserPayload | null> {
    const { payload } = await this.tryAuthPayloadByUserId(userId);
    return payload;
  }
}
