import { Module } from '@nestjs/common';
import { AuthAdminController } from './auth-admin.controller';
import { AuthService } from './auth.service';

/**
 * Auth module - tuyen-sinh-api.
 * - auth/admin: đăng nhập cho Admin (CMS, tuyen-sinh-admin).
 * - Sau này có thể thêm auth/public cho đăng nhập public (site tuyen-sinh).
 */
@Module({
  imports: [],
  controllers: [AuthAdminController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
