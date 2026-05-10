import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { UsersService, type CreateUserDto } from './users.service';
import { User } from '../entities/user.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Public, Permissions } from '../auth/decorators/public.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { RbacService } from '../auth/rbac.service';
import { parseXUserId } from '../auth/request-user.util';

export type PublicUser = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  email: string;
  fullName: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  roles: Array<{ code: string; name: string }>;
};

function toPublicUser(user: User): PublicUser {
  const roles = user.userRoleLinks.isInitialized()
    ? user.userRoleLinks.getItems().map((l) => ({
        code: l.role.code,
        name: l.role.name,
      }))
    : [];
  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    address: user.address,
    isActive: user.isActive,
    roles,
  };
}

@ApiTags('users')
@Controller('users')
@UseGuards(PermissionsGuard)
@ApiHeader({
  name: 'X-User-Id',
  required: false,
  description:
    'ID user đang thao tác — bắt buộc với các API có kiểm tra quyền; với giỏ hàng / xem hồ sơ của chính mình phải trùng id trong URL.',
})
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly rbac: RbacService,
  ) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Validate user credentials' })
  @ApiResponse({ status: 200, description: 'Return user if valid' })
  async validateUser(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<PublicUser | null> {
    const user = await this.usersService.validateUser(email, password);
    return user ? toPublicUser(user) : null;
  }

  @Get()
  @Permissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersService.findAll();
    return users.map(toPublicUser);
  }

  @Get('email/:email')
  @Permissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: 'Get user by email' })
  @ApiResponse({ status: 200, description: 'Return the user' })
  async findByEmail(@Param('email') email: string): Promise<PublicUser | null> {
    const user = await this.usersService.findByEmail(email);
    return user ? toPublicUser(user) : null;
  }

  @Get('by-role/:code')
  @Permissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: 'Get users by role code (vd: admin, sales)' })
  @ApiResponse({ status: 200, description: 'Return users with role' })
  async findByRoleCode(@Param('code') code: string): Promise<PublicUser[]> {
    const users = await this.usersService.findByRoleCode(code);
    return users.map(toPublicUser);
  }

  @Get(':id/cart')
  @Public()
  @ApiOperation({ summary: 'Giỏ hàng đã lưu (JSON) theo user' })
  async getCart(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<{ lines: unknown[] }> {
    await this.assertSelfOrManage(req, id);
    return this.usersService.getCartSnapshot(id);
  }

  @Put(':id/cart')
  @Public()
  @ApiOperation({ summary: 'Lưu giỏ hàng JSON cho user' })
  async saveCart(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { lines: unknown[] },
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    await this.assertSelfOrManage(req, id);
    await this.usersService.saveCartSnapshot(id, body);
    return { ok: true };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<PublicUser> {
    await this.assertSelfOrManage(req, id);
    const user = await this.usersService.findOne(id);
    return toPublicUser(user);
  }

  @Post()
  @Permissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() userData: CreateUserDto): Promise<PublicUser> {
    const user = await this.usersService.create(userData);
    return toPublicUser(user);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: 'Update a user (body.roleCodes thay thế toàn bộ role)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: Partial<User> & { roleCodes?: string[] },
  ): Promise<PublicUser> {
    const user = await this.usersService.update(id, userData);
    return toPublicUser(user);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.USERS_MANAGE)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.delete(id);
  }

  private async assertSelfOrManage(req: Request, targetUserId: number): Promise<void> {
    const actor = parseXUserId(req);
    if (actor === null) {
      throw new UnauthorizedException(
        'Gửi header X-User-Id trùng id tài khoản hoặc dùng tài khoản có quyền users.manage.',
      );
    }
    if (actor === targetUserId) {
      return;
    }
    const ok = await this.rbac.userHasAll(actor, [PERMISSIONS.USERS_MANAGE]);
    if (!ok) {
      throw new ForbiddenException(
        'Chỉ xem/sửa dữ liệu của chính mình, hoặc cần quyền users.manage.',
      );
    }
  }
}
