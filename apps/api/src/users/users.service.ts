import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, type RequiredEntityData } from '@mikro-orm/core';
import { User, UserRole } from '../entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ email });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({ role });
  }

  async create(userData: Partial<User>): Promise<User> {
    const existingUser = await this.findByEmail(userData.email!);
    if (existingUser) {
      throw new ConflictException(
        `User with email ${userData.email} already exists`,
      );
    }

    const user = this.userRepository.create(
      userData as RequiredEntityData<User>,
    );
    await this.userRepository.getEntityManager().persistAndFlush(user);
    return user;
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    this.userRepository.assign(user, userData);
    await this.userRepository.getEntityManager().flush();
    return user;
  }

  async delete(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.getEntityManager().removeAndFlush(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && user.password === password) {
      return user;
    }
    return null;
  }
}
