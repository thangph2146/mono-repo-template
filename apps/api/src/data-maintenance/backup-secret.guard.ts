import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Backup/import: nếu đặt BACKUP_IMPORT_SECRET thì bắt buộc header X-Backup-Secret
 * trùng khớp; nếu không đặt (để trống) thì không kiểm tra — phù hợp môi trường dev.
 */
@Injectable()
export class BackupSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('BACKUP_IMPORT_SECRET', '')?.trim();
    if (!secret) {
      return true;
    }
    const req = context.switchToHttp().getRequest<Request>();
    const sent = String(req.headers['x-backup-secret'] ?? '').trim();
    if (sent !== secret) {
      throw new ForbiddenException('X-Backup-Secret không hợp lệ.');
    }
    return true;
  }
}
