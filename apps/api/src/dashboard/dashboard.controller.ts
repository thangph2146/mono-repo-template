/**
 * GET /api/admin/dashboard/stats - Thống kê dashboard cho admin.
 * Header: X-User-Id (bắt buộc).
 */
import { Controller, Get, Headers, Res, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@Controller(ADMIN_ROUTES.DASHBOARD)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    this.logger.log('getStats');
    const userId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!userId) {
      this.logger.warn(`getStats: Missing ${APP_HEADERS.USER_ID}`);
      const { statusCode, body } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        {
          status: 401,
        },
      );
      return res.status(statusCode).json(body);
    }
    const stats = await this.dashboardService.getStats();
    const { statusCode, body } = createSuccessResponse(stats);
    return res.status(statusCode).json(body);
  }
}
