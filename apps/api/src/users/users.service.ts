import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  EntityManager,
  type RequiredEntityData,
} from '@mikro-orm/core';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRoleLink } from '../entities/user-role-link.entity';

export type CreateUserDto = Partial<User> & {
  email: string;
  password: string;
  fullName: string;
  roleCodes?: string[];
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

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll({
      populate: [...UsersService.userPopulate],
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne(
      { id },
      { populate: [...UsersService.userPopulate] },
    );
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne(
      { email },
      { populate: [...UsersService.userPopulate] },
    );
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
    return users;
  }

  async create(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException(
        `User with email ${userData.email} already exists`,
      );
    }
    const { roleCodes, ...rest } = userData;
    const user = this.userRepository.create(
      rest as RequiredEntityData<User>,
    );
    await this.em.persistAndFlush(user);
    if (roleCodes?.length) {
      await this.setRoleCodes(user.id, roleCodes);
    }
    return this.findOne(user.id);
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
    const user = await this.findOne(id);
    await this.em.removeAndFlush(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
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
