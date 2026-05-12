import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { hash } from 'bcryptjs';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

export interface AccountProfileDto {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
  roles: Array<{ id: string; name: string; displayName: string }>;
}

export interface UpdateAccountDto {
  name?: string;
  bio?: string | null;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
  password?: string;
}

function mapToProfile(user: User, userRoles: UserRole[]): AccountProfileDto {
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? null,
    avatar: user.avatar ?? null,
    bio: user.bio ?? null,
    phone: user.phone ?? null,
    address: user.address ?? null,
    emailVerified: user.emailVerified?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
    })),
  };
}

@Injectable()
export class AccountsService {
  constructor(private readonly em: EntityManager) {}

  async getProfile(userId: string): Promise<AccountProfileDto | null> {
    const user = await this.em.findOne(User, { id: userId });

    if (!user || user.deletedAt || !user.isActive) {
      return null;
    }

    const userRoles = await this.em.find(
      UserRole,
      { user: userId },
      { populate: ['role'] },
    );

    return mapToProfile(user, userRoles);
  }

  async updateProfile(
    userId: string,
    dto: UpdateAccountDto,
  ): Promise<AccountProfileDto | null> {
    const existing = await this.em.findOne(User, { id: userId });

    if (!existing || existing.deletedAt || !existing.isActive) {
      return null;
    }

    if (dto.name !== undefined) existing.name = dto.name.trim();
    if (dto.bio !== undefined) existing.bio = dto.bio?.trim() ?? null;
    if (dto.phone !== undefined) existing.phone = dto.phone?.trim() ?? null;
    if (dto.address !== undefined) {
      existing.address = dto.address?.trim() ?? null;
    }
    if (dto.avatar !== undefined) {
      existing.avatar = dto.avatar === null ? null : dto.avatar.trim() || null;
    }
    if (dto.password && dto.password.trim() !== '') {
      existing.password = await hash(dto.password.trim(), 10);
    }

    await this.em.persistAndFlush(existing);

    return this.getProfile(userId);
  }
}
