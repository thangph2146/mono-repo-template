import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

export class LoginDto {
  email: string;
  password: string;
}

export class DevLoginDto {
  userId: string;
}

export class GoogleLoginDto {
  credential: string;
}

export class LogoutDto {
  userId: string;
}

/**
 * Auth API cho Admin (tuyen-sinh-admin).
 * Đăng nhập CMS với email/password, trả về user + permissions + roles.
 * Sau này có thể thêm AuthPublicController (auth/public) cho đăng nhập public.
 */
@ApiTags('Auth')
@Controller(ADMIN_ROUTES.AUTH)
export class AuthAdminController {
  private readonly logger = new Logger(AuthAdminController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/admin/me - Lấy payload session hiện tại (permissions, roles) theo X-User-Id.
   * Dùng để refresh session khi role/user được cập nhật (realtime cho tài khoản đang đăng nhập).
   */
  @Get('me')
  @ApiOperation({ summary: 'Get current user session' })
  @ApiHeader({
    name: 'X-User-Id',
    required: true,
    description: 'User ID header',
  })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Missing X-User-Id header' })
  @ApiResponse({ status: 404, description: 'User not found or inactive' })
  async me(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    const userId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!userId) {
      const { statusCode, body } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      return res.status(statusCode).json(body);
    }

    try {
      const { payload: user, reason } =
        await this.authService.tryAuthPayloadByUserId(userId);
      if (!user) {
        const byReason: Record<
          NonNullable<typeof reason>,
          { status: number; message: string }
        > = {
          not_found: {
            status: 404,
            message:
              'Không tìm thấy tài khoản (đã xóa hoặc sai id). Đăng nhập lại.',
          },
          inactive: {
            status: 404,
            message:
              'Tài khoản đã bị vô hiệu hóa hoặc xóa mềm. Liên hệ quản trị.',
          },
          no_roles: {
            status: 404,
            message:
              'Không tìm thấy tài khoản hợp lệ cho phiên đăng nhập: thiếu user_roles. Sau import, cần gửi user + userRole trong một request hoặc khôi phục bảng user_roles, rồi đăng nhập lại.',
          },
        };
        const fallback = byReason.not_found;
        const picked = reason ? byReason[reason] : fallback;
        const { statusCode, body } = createErrorResponse(picked.message, {
          status: picked.status,
        });
        return res.status(statusCode).json(body);
      }
      const { statusCode, body } = createSuccessResponse(user);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logger.error(
        'Auth me error',
        error instanceof Error ? error : String(error),
      );
      const { statusCode, body } = createErrorResponse(
        'Lỗi khi lấy thông tin session',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Admin login with email/password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async login(
    @Body() body: { email?: string; password?: string },
    @Res() res: Response,
  ) {
    this.logger.log(`login email=${body?.email ?? '-'}`);
    try {
      const user = await this.authService.login({
        email: body.email ?? '',
        password: body.password ?? '',
      });

      if (!user) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Email hoặc mật khẩu không đúng.',
          { status: 401 },
        );
        return res.status(statusCode).json(errBody);
      }

      const { statusCode, body: okBody } = createSuccessResponse(user, {
        message: 'Đăng nhập thành công',
      });
      return res.status(statusCode).json(okBody);
    } catch (error) {
      this.logger.error(
        'Admin login error',
        error instanceof Error ? error : String(error),
      );
      const { statusCode, body } = createErrorResponse(
        'Đã xảy ra lỗi khi đăng nhập.',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Post('dev-login')
  @ApiOperation({ summary: 'Development login (dev only)' })
  @ApiBody({ type: DevLoginDto })
  @ApiResponse({ status: 200, description: 'Dev login successful' })
  @ApiResponse({ status: 400, description: 'Missing userId' })
  @ApiResponse({ status: 404, description: 'Not available in production' })
  async developmentLogin(
    @Body() body: { userId?: string },
    @Res() res: Response,
  ) {
    if (process.env.NODE_ENV !== 'development') {
      const { statusCode, body } = createErrorResponse('Not Found', {
        status: 404,
      });
      return res.status(statusCode).json(body);
    }

    const userId = body?.userId?.trim();
    if (!userId) {
      const { statusCode, body } = createErrorResponse('userId là bắt buộc.', {
        status: 400,
      });
      return res.status(statusCode).json(body);
    }

    try {
      const user = await this.authService.loginAsDevelopmentUser(userId);
      if (!user) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Không tìm thấy tài khoản development hợp lệ trong database.',
          { status: 404 },
        );
        return res.status(statusCode).json(errBody);
      }

      const { statusCode, body: okBody } = createSuccessResponse(user, {
        message: 'Đăng nhập development thành công',
      });
      return res.status(statusCode).json(okBody);
    } catch (error) {
      this.logger.error(
        'Admin development login error',
        error instanceof Error ? error : String(error),
      );
      const { statusCode, body } = createErrorResponse(
        'Đã xảy ra lỗi khi đăng nhập development.',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('google/config')
  @ApiOperation({ summary: 'Get Google OAuth client ID for frontend' })
  @ApiResponse({ status: 200, description: 'Returns Google OAuth config' })
  getGoogleConfig(@Res() res: Response) {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const { statusCode, body } = createSuccessResponse({
      clientId,
    });
    return res.status(statusCode).json(body);
  }

  @Post('google')
  @ApiOperation({ summary: 'Login with Google credential (idToken)' })
  @ApiBody({ type: GoogleLoginDto })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async google(@Body() body: { credential?: string }, @Res() res: Response) {
    this.logger.log(`google credential received`);
    try {
      if (!body?.credential) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Thiếu credential Google.',
          { status: 400 },
        );
        return res.status(statusCode).json(errBody);
      }

      const profile = await this.authService.verifyGoogleToken(body.credential);
      if (!profile) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Credential Google không hợp lệ.',
          { status: 401 },
        );
        return res.status(statusCode).json(errBody);
      }

      const user = await this.authService.loginWithGoogle({
        email: profile.email,
        name: profile.name ?? null,
        image: profile.image ?? null,
      });

      if (!user) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Không thể xác thực tài khoản Google.',
          { status: 401 },
        );
        return res.status(statusCode).json(errBody);
      }

      const { statusCode, body: okBody } = createSuccessResponse(user, {
        message: 'Đăng nhập Google thành công',
      });
      return res.status(statusCode).json(okBody);
    } catch (error) {
      this.logger.error(
        'Admin Google login error',
        error instanceof Error ? error : String(error),
      );
      const { statusCode, body } = createErrorResponse(
        'Đã xảy ra lỗi khi đăng nhập Google.',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ type: LogoutDto })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async logout(@Body() body: { userId?: string }, @Res() res: Response) {
    this.logger.log(`logout userId=${body?.userId ?? '-'}`);
    try {
      const result = await this.authService.logout(body?.userId);
      const { statusCode, body: okBody } = createSuccessResponse(result, {
        message: 'Đăng xuất thành công',
      });
      return res.status(statusCode).json(okBody);
    } catch (error) {
      this.logger.error(
        'Admin logout error',
        error instanceof Error ? error : String(error),
      );
      const { statusCode, body } = createErrorResponse(
        'Đã xảy ra lỗi khi đăng xuất.',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }
}
