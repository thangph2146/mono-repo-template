import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, PERMISSIONS_KEY } from '../decorators/public.decorator';
import { RbacService } from '../rbac.service';
import { parseXUserId } from '../request-user.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const userId = parseXUserId(req);
    if (userId === null) {
      throw new UnauthorizedException(
        'Thiếu header X-User-Id (id người dùng đã đăng nhập) để kiểm tra quyền.',
      );
    }

    const granted = await this.rbac.getEffectivePermissionCodes(userId);
    if (granted.has('*')) {
      return true;
    }
    const ok = required.every((code) => granted.has(code));
    if (!ok) {
      throw new ForbiddenException(
        `Không đủ quyền. Cần: ${required.join(', ')}`,
      );
    }
    return true;
  }
}
