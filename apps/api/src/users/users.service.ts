import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  EntityManager,
  type FilterQuery,
  type RequiredEntityData,
} from '@mikro-orm/core';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRoleLink } from '../entities/user-role-link.entity';
import { Order } from '../entities/order.entity';

export type CreateUserDto = Partial<User> & {
  email: string;
  password: string;
  fullName: string;
  roleCodes?: string[];
};

/** Chỉ tên / SĐT / địa chỉ — dùng cho storefront tự cập nhật hồ sơ. */
export type UpdateProfileDto = {
  fullName?: string;
  phone?: string;
  address?: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @Inject(EntityManager)
    private readonly em: EntityManager,
  ) {}

  private static readonly userPopulate = ['userRoleLinks.role'] as const;

  private visible(): FilterQuery<User> {
    return { deletedAt: null };
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find(this.visible(), {
      populate: [...UsersService.userPopulate],
      orderBy: { id: 'asc' },
    });
  }

  async findPage(opts: {
    q?: string;
    page: number;
    limit: number;
  }): Promise<{ items: User[]; total: number }> {
    const page = Math.max(1, opts.page);
    const limit = Math.min(200, Math.max(1, opts.limit));
    const offset = (page - 1) * limit;
    const q = opts.q?.trim();
    const where: FilterQuery<User> = { deletedAt: null };
    if (q) {
      const like = `%${q}%`;
      where.$or = [
        { email: { $like: like } },
        { fullName: { $like: like } },
        { phone: { $like: like } },
      ];
    }
    const [items, total] = await this.userRepository.findAndCount(where, {
      populate: [...UsersService.userPopulate],
      orderBy: { id: 'asc' },
      limit,
      offset,
    });
    return { items, total };
  }

  async listTrashed(opts?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<{ items: User[]; total: number }> {
    const page = Math.max(1, opts?.page ?? 1);
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 20));
    const offset = (page - 1) * limit;
    const where: FilterQuery<User> = { deletedAt: { $ne: null } };
    const q = opts?.q?.trim();
    if (q) {
      const like = `%${q}%`;
      where.$or = [
        { email: { $like: like } },
        { fullName: { $like: like } },
        { phone: { $like: like } },
      ];
    }
    const [items, total] = await this.userRepository.findAndCount(where, {
      populate: [...UsersService.userPopulate],
      orderBy: { updatedAt: 'desc' },
      limit,
      offset,
    });
    return { items, total };
  }

  async findByIdAny(id: number): Promise<User | null> {
    return this.userRepository.findOne(
      { id },
      { populate: [...UsersService.userPopulate] },
    );
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne(
      { id, deletedAt: null },
      { populate: [...UsersService.userPopulate] },
    );
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByEmail(
    email: string,
    opts?: { includeTrashed?: boolean },
  ): Promise<User | null> {
    const cond: FilterQuery<User> = { email: email.trim() };
    if (!opts?.includeTrashed) {
      cond.deletedAt = null;
    }
    return this.userRepository.findOne(cond, {
      populate: [...UsersService.userPopulate],
    });
  }

  async findByRoleCode(roleCode: string): Promise<User[]> {
    const role = await this.em.findOne(Role, { code: roleCode });
    if (!role) return [];
    const links = await this.em.find(
      UserRoleLink,
      { role: role.id },
      { populate: ['user.userRoleLinks.role'] },
    );
    const users = links.map((l) => l.user).filter(Boolean) as User[];
    return users.filter((u) => u.deletedAt == null);
  }

  async create(userData: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(userData.email, {
      includeTrashed: true,
    });
    if (existing) {
      if (existing.deletedAt == null) {
        throw new ConflictException(
          `User with email ${userData.email} already exists`,
        );
      }
      throw new ConflictException(
        `Email ${userData.email} đang ở thùng rác — khôi phục tài khoản đó hoặc dùng email khác.`,
      );
    }
    const { roleCodes, ...rest } = userData;
    const user = this.userRepository.create({
      ...rest,
      deletedAt: null,
    } as RequiredEntityData<User>);
    await this.em.persistAndFlush(user);
    if (roleCodes?.length) {
      await this.setRoleCodes(user.id, roleCodes);
    }
    return this.findOne(user.id);
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.fullName !== undefined) {
      const t = dto.fullName.trim();
      if (!t) {
        throw new BadRequestException('fullName không được để trống');
      }
      user.fullName = t;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone.trim() || undefined;
    }
    if (dto.address !== undefined) {
      user.address = dto.address.trim() || undefined;
    }
    await this.em.flush();
    return this.findOne(id);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findOne(id);
    if (user.password !== dto.currentPassword.trim()) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    const next = dto.newPassword.trim();
    if (next.length < 6) {
      throw new BadRequestException('Mật khẩu mới tối thiểu 6 ký tự');
    }
    if (next === dto.currentPassword.trim()) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    user.password = next;
    await this.em.flush();
  }

  async update(
    id: number,
    userData: Partial<User> & { roleCodes?: string[] },
  ): Promise<User> {
    const user = await this.findOne(id);
    const { roleCodes, ...rest } = userData;
    this.userRepository.assign(user, rest as Partial<User>);
    if (roleCodes !== undefined) {
      await this.setRoleCodes(id, roleCodes);
    }
    await this.em.flush();
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    const user = await this.findByIdAny(id);
    if (!user || user.deletedAt != null) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    user.deletedAt = new Date();
    await this.em.flush();
  }

  async restore(id: number): Promise<User> {
    const user = await this.userRepository.findOne(
      { id, deletedAt: { $ne: null } },
      { populate: [...UsersService.userPopulate] },
    );
    if (!user) {
      throw new NotFoundException(
        `No trashed user with id ${id} (or already active)`,
      );
    }
    const clash = await this.userRepository.findOne({
      email: user.email,
      deletedAt: null,
    });
    if (clash && clash.id !== user.id) {
      throw new ConflictException(
        'Email đã được dùng bởi tài khoản khác — không thể khôi phục.',
      );
    }
    user.deletedAt = null;
    await this.em.flush();
    return user;
  }

  /**
   * Xóa hẳn tài khoản đang ở thùng rác — gỡ FK đơn hàng (khách / shipper), xóa liên kết role.
   */
  async purgeTrashed(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      id,
      deletedAt: { $ne: null },
    });
    if (!user) {
      throw new NotFoundException(
        `Không có tài khoản id ${id} trong thùng rác — chỉ xóa vĩnh viễn bản đã xóa tạm.`,
      );
    }
    await this.em.transactional(async (em) => {
      await em.nativeDelete(UserRoleLink, { user: id });
      await em.nativeUpdate(Order, { customer: id }, { customer: null });
      await em.nativeUpdate(
        Order,
        { assignedShipper: id },
        {
          assignedShipper: null,
        },
      );
      em.remove(user);
      await em.flush();
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email, { includeTrashed: false });
    if (user && user.password === password) {
      return user;
    }
    return null;
  }

  async setRoleCodes(userId: number, codes: string[]): Promise<void> {
    const user = await this.findOne(userId);
    const roles =
      codes.length > 0
        ? await this.em.find(Role, { code: { $in: [...new Set(codes)] } })
        : [];
    await this.em.nativeDelete(UserRoleLink, { user: userId });
    for (const role of roles) {
      const link = this.em.create(
        UserRoleLink,
        { user, role },
        { partial: true },
      );
      this.em.persist(link);
    }
    await this.em.flush();
  }

  async getCartSnapshot(id: number): Promise<{ lines: unknown[] }> {
    const user = await this.findOne(id);
    const raw = user.cartJson?.trim();
    if (!raw) return { lines: [] };
    try {
      const parsed = JSON.parse(raw) as { lines?: unknown[] };
      if (!parsed || !Array.isArray(parsed.lines)) return { lines: [] };
      return { lines: parsed.lines };
    } catch {
      return { lines: [] };
    }
  }

  async saveCartSnapshot(
    id: number,
    payload: { lines: unknown[] },
  ): Promise<void> {
    const user = await this.findOne(id);
    if (!Array.isArray(payload.lines)) {
      throw new BadRequestException('cart.lines must be an array');
    }
    user.cartJson = JSON.stringify({ lines: payload.lines });
    await this.em.flush();
  }
}
