import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/public.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';

@ApiTags('rbac')
@Controller('rbac')
@UseGuards(PermissionsGuard)
@Permissions(PERMISSIONS.RBAC_READ)
@ApiHeader({ name: 'X-User-Id', description: 'ID user đang thao tác (sau đăng nhập)' })
export class RbacController {
  constructor(
    @InjectRepository(Permission)
    private readonly permRepo: EntityRepository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepo: EntityRepository<Role>,
  ) {}

  @Get('permissions')
  @ApiOperation({ summary: 'Danh sách mã quyền trong hệ thống' })
  async listPermissions(): Promise<
    Array<{ id: number; code: string; name: string; description: string | null }>
  > {
    const rows = await this.permRepo.findAll({ orderBy: { code: 'asc' } });
    return rows.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description ?? null,
    }));
  }

  @Get('roles')
  @ApiOperation({ summary: 'Danh sách role và quyền gắn kèm' })
  async listRoles(): Promise<
    Array<{
      id: number;
      code: string;
      name: string;
      description: string | null;
      permissions: string[];
    }>
  > {
    const roles = await this.roleRepo.findAll({
      populate: ['permissionLinks.permission'],
      orderBy: { code: 'asc' },
    });
    return roles.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description ?? null,
      permissions: r.permissionLinks
        .getItems()
        .map((l) => l.permission?.code)
        .filter((c): c is string => Boolean(c))
        .sort(),
    }));
  }
}
