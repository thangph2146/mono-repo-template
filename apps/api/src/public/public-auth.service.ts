import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Role } from '../entities/role.entity';
import { Setting } from '../entities/setting.entity';
import { User } from '../entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { AUTH_ROLE_NAMES } from '../config/constants';

export interface CreatePublicRegisterDto {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

async function getDefaultNewUserRole(
  em: EntityManager,
): Promise<{ name: string; displayName: string }> {
  const setting = await em.findOne(Setting, { key: 'default_new_user_role' });
  if (setting?.value && typeof setting.value === 'string') {
    const roleName = setting.value.trim().toLowerCase();
    if (roleName) return { name: roleName, displayName: roleName };
  }
  return { name: AUTH_ROLE_NAMES.PARENT, displayName: 'Phụ huynh' };
}

@Injectable()
export class PublicAuthService {
  constructor(
    private readonly em: EntityManager,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  private async ensureDefaultRole(): Promise<Role> {
    const defaultRoleCfg = await getDefaultNewUserRole(this.em);
    let role = await this.em.findOne(Role, { name: defaultRoleCfg.name });
    if (role) return role;

    role = new Role();
    role.name = defaultRoleCfg.name;
    role.displayName = defaultRoleCfg.displayName;
    role.description = `Tài khoản ${defaultRoleCfg.displayName.toLowerCase()} đăng ký công khai`;
    role.permissions = null;
    role.isActive = true;
    this.em.persist(role);
    await this.em.flush();
    return role;
  }

  async register(dto: CreatePublicRegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const password = dto.password;

    if (!fullName || !email || !password) {
      throw new Error('Vui lòng nhập đầy đủ họ tên, email và mật khẩu.');
    }

    if (password.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    const existing = await this.em.findOne(User, { email });
    if (existing) {
      throw new Error(
        'Email đã tồn tại. Vui lòng dùng email khác hoặc đăng nhập.',
      );
    }

    const defaultRole = await this.ensureDefaultRole();
    const created = await this.usersService.create({
      email,
      name: fullName,
      password,
      phone: dto.phone?.trim() || null,
      address: dto.address?.trim() || null,
      isActive: true,
      roleIds: [defaultRole.id],
    });

    const payload = await this.authService.getAuthPayloadByUserId(created.id);
    if (!payload) {
      throw new Error(
        'Đăng ký thành công nhưng chưa thể khởi tạo phiên đăng nhập.',
      );
    }

    return payload;
  }
}
