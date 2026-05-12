/**
 * Notifications API cho admin (chuông thông báo + unread count).
 * Service được inject bởi Nest, type đầy đủ từ notifications.service.
 */

import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { NotificationsService } from './notifications.service';
import type {
  NotificationsListResult,
  UnreadCountsResult,
  AdminTableResult,
} from './notifications.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS } from '../config/constants';

@Controller('admin')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  private getUserId(
    headers: Record<string, string | undefined>,
  ): string | null {
    const id = headers[APP_HEADERS.USER_ID]?.trim();
    return id || null;
  }

  private logRequest(
    method: string,
    path: string,
    meta: Record<string, unknown>,
  ) {
    this.logger.log(`[REQUEST] ${method} ${path} | ${JSON.stringify(meta)}`);
  }

  private logResponse(
    method: string,
    path: string,
    statusCode: number,
    dataSummary: string,
  ) {
    this.logger.log(
      `[RESPONSE] ${method} ${path} | ${statusCode} | ${dataSummary}`,
    );
  }

  /**
   * GET /api/admin/notifications/table
   * Danh sách cho bảng admin (page, limit, search, filter). Header: X-User-Id. X-View-All: true = xem tất cả.
   */
  @Get('notifications/table')
  async listTable(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Query('search') searchParam?: string,
    @Query('filter[userEmail]') filterUserEmail?: string,
    @Query('filter[userName]') filterUserName?: string,
    @Query('filter[kind]') filterKind?: string,
    @Query('filter[isRead]') filterIsRead?: string,
  ) {
    const userId = this.getUserId(headers);
    const viewAll =
      headers[APP_HEADERS.VIEW_ALL.toLowerCase()]?.toLowerCase() === 'true';
    this.logRequest('GET', '/admin/notifications/table', {
      [APP_HEADERS.USER_ID]: userId ?? '(missing)',
      [APP_HEADERS.VIEW_ALL]: viewAll,
      page: pageParam,
      limit: limitParam,
    });

    if (!userId) {
      const { statusCode, body } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications/table',
        statusCode,
        'error: Unauthorized',
      );
      return res.status(statusCode).json(body);
    }

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
      const { statusCode, body } = createErrorResponse(
        'page và limit không hợp lệ (page >= 1, limit 1-100)',
        { status: 400 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications/table',
        statusCode,
        'error: Bad Request',
      );
      return res.status(statusCode).json(body);
    }

    const filters: Record<string, string> = {};
    if (filterUserEmail?.trim()) filters.userEmail = filterUserEmail.trim();
    if (filterUserName?.trim()) filters.userName = filterUserName.trim();
    if (filterKind?.trim()) filters.kind = filterKind.trim();
    if (filterIsRead?.trim()) filters.isRead = filterIsRead.trim();

    try {
      const result: AdminTableResult =
        await this.notificationsService.listForAdminTable({
          userId,
          viewAll,
          page,
          limit,
          search: searchParam?.trim() || undefined,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
        });
      const { statusCode, body } = createSuccessResponse(
        {
          data: result.data,
          pagination: result.pagination,
        },
        { message: 'Lấy danh sách thông báo thành công' },
      );
      this.logResponse(
        'GET',
        '/admin/notifications/table',
        statusCode,
        `rows: ${result.data.length}, total: ${result.pagination.total}`,
      );
      return res.status(statusCode).json(body);
    } catch (error) {
      console.error('[Notifications API] listTable error:', error);
      const { statusCode, body } = createErrorResponse(
        'Không thể tải danh sách thông báo',
        { status: 500 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications/table',
        statusCode,
        'error: Internal',
      );
      return res.status(statusCode).json(body);
    }
  }

  /**
   * GET /api/admin/notifications/options
   * Options cho filter cột (userEmail, userName). Header: X-User-Id.
   */
  @Get('notifications/options')
  async options(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('column') columnParam?: string,
    @Query('limit') limitParam?: string,
    @Query('search') searchParam?: string,
  ) {
    const userId = this.getUserId(headers);
    this.logRequest('GET', '/admin/notifications/options', {
      [APP_HEADERS.USER_ID]: userId ?? '(missing)',
      column: columnParam,
      limit: limitParam,
    });

    if (!userId) {
      const { statusCode, body } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications/options',
        statusCode,
        'error: Unauthorized',
      );
      return res.status(statusCode).json(body);
    }

    const column = columnParam?.trim();
    if (column !== 'userEmail' && column !== 'userName') {
      const { statusCode, body } = createErrorResponse(
        'column phải là userEmail hoặc userName',
        { status: 400 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications/options',
        statusCode,
        'error: Bad Request',
      );
      return res.status(statusCode).json(body);
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      const { statusCode, body } = createErrorResponse(
        'limit phải từ 1 đến 100',
        { status: 400 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications/options',
        statusCode,
        'error: Bad Request',
      );
      return res.status(statusCode).json(body);
    }

    try {
      const options = await this.notificationsService.getColumnOptions(
        column,
        searchParam?.trim(),
        limit,
      );
      const { statusCode, body } = createSuccessResponse(options, {
        message: 'Lấy options thành công',
      });
      this.logResponse(
        'GET',
        '/admin/notifications/options',
        statusCode,
        `options: ${options.length}`,
      );
      return res.status(statusCode).json(body);
    } catch (error) {
      console.error('[Notifications API] options error:', error);
      const { statusCode, body } = createErrorResponse(
        'Không thể tải options',
        { status: 500 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications/options',
        statusCode,
        'error: Internal',
      );
      return res.status(statusCode).json(body);
    }
  }

  /**
   * GET /api/admin/notifications
   * Danh sách thông báo cho chuông (Notification bell).
   * Header: X-User-Id (bắt buộc).
   */
  @Get('notifications')
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
    @Query('unreadOnly') unreadOnlyParam?: string,
    @Query('mine') mineParam?: string,
  ) {
    const userId = this.getUserId(headers);
    this.logRequest('GET', '/admin/notifications', {
      [APP_HEADERS.USER_ID]: userId ?? '(missing)',
      limit: limitParam,
      offset: offsetParam,
      unreadOnly: unreadOnlyParam,
      mine: mineParam,
    });

    if (!userId) {
      const { statusCode, body } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        {
          status: 401,
        },
      );
      this.logResponse(
        'GET',
        '/admin/notifications',
        statusCode,
        'error: Unauthorized',
      );
      return res.status(statusCode).json(body);
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    if (isNaN(limit) || limit < 1 || limit > 100) {
      const { statusCode, body } = createErrorResponse(
        'Limit phải từ 1 đến 100',
        { status: 400 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications',
        statusCode,
        'error: Bad Request',
      );
      return res.status(statusCode).json(body);
    }
    if (isNaN(offset) || offset < 0) {
      const { statusCode, body } = createErrorResponse('Offset phải không âm', {
        status: 400,
      });
      this.logResponse(
        'GET',
        '/admin/notifications',
        statusCode,
        'error: Bad Request',
      );
      return res.status(statusCode).json(body);
    }

    try {
      const result: NotificationsListResult =
        await this.notificationsService.list({
          userId,
          limit,
          offset,
          unreadOnly: unreadOnlyParam === 'true',
          mine: mineParam !== 'false',
        });
      const { statusCode, body } = createSuccessResponse(result, {
        message: 'Lấy danh sách thông báo thành công',
      });
      this.logResponse(
        'GET',
        '/admin/notifications',
        statusCode,
        `notifications: ${result.notifications.length}, total: ${result.total}, unreadCount: ${result.unreadCount}`,
      );
      return res.status(statusCode).json(body);
    } catch (error) {
      console.error('[Notifications API] list error:', error);
      const { statusCode, body } = createErrorResponse(
        'Không thể tải danh sách thông báo',
        { status: 500 },
      );
      this.logResponse(
        'GET',
        '/admin/notifications',
        statusCode,
        'error: Internal',
      );
      return res.status(statusCode).json(body);
    }
  }

  /**
   * GET /api/admin/unread-counts
   * Số lượng chưa đọc (chuông + badge). Header: X-User-Id (bắt buộc).
   */
  @Get('unread-counts')
  async unreadCounts(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    const userId = this.getUserId(headers);
    this.logRequest('GET', '/admin/unread-counts', {
      [APP_HEADERS.USER_ID]: userId ?? '(missing)',
    });

    if (!userId) {
      const { statusCode, body } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        {
          status: 401,
        },
      );
      this.logResponse(
        'GET',
        '/admin/unread-counts',
        statusCode,
        'error: Unauthorized',
      );
      return res.status(statusCode).json(body);
    }

    try {
      const result: UnreadCountsResult =
        await this.notificationsService.getUnreadCounts(userId);
      const { statusCode, body } = createSuccessResponse(result, {
        message: 'Lấy số lượng chưa đọc thành công',
      });
      this.logResponse(
        'GET',
        '/admin/unread-counts',
        statusCode,
        `unreadNotifications: ${result.unreadNotifications}, unreadMessages: ${result.unreadMessages}, contactRequests: ${result.contactRequests}`,
      );
      return res.status(statusCode).json(body);
    } catch (error) {
      console.error('[Notifications API] unread-counts error:', error);
      const { statusCode, body } = createErrorResponse(
        'Không thể tải số lượng chưa đọc',
        { status: 500 },
      );
      this.logResponse(
        'GET',
        '/admin/unread-counts',
        statusCode,
        'error: Internal',
      );
      return res.status(statusCode).json(body);
    }
  }

  /**
   * PATCH /api/admin/notifications/:id
   * Đánh dấu một thông báo đã đọc/chưa đọc. Body: { isRead: boolean }. Header: X-User-Id.
   */
  @Patch('notifications/:id')
  async markRead(
    @Res() res: Response,
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { isRead?: boolean },
  ) {
    const userId = this.getUserId(headers);
    this.logRequest('PATCH', `/admin/notifications/${id}`, {
      [APP_HEADERS.USER_ID]: userId ?? '(missing)',
      body: { isRead: body?.isRead },
    });

    if (!userId) {
      const { statusCode, body: errBody } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      this.logResponse(
        'PATCH',
        `/admin/notifications/${id}`,
        statusCode,
        'error: Unauthorized',
      );
      return res.status(statusCode).json(errBody);
    }

    const isRead = body?.isRead !== false;

    try {
      const updated = await this.notificationsService.markRead(
        id,
        userId,
        isRead,
      );
      if (!updated) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Không tìm thấy thông báo hoặc không có quyền',
          { status: 404 },
        );
        this.logResponse(
          'PATCH',
          `/admin/notifications/${id}`,
          statusCode,
          'error: Not found',
        );
        return res.status(statusCode).json(errBody);
      }
      const { statusCode, body: okBody } = createSuccessResponse(updated, {
        message: 'Cập nhật trạng thái đọc thành công',
      });
      this.logResponse(
        'PATCH',
        `/admin/notifications/${id}`,
        statusCode,
        `id: ${updated.id}, isRead: ${updated.isRead}`,
      );
      return res.status(statusCode).json(okBody);
    } catch (error) {
      console.error('[Notifications API] markRead error:', error);
      const { statusCode, body: errBody } = createErrorResponse(
        'Không thể cập nhật thông báo',
        { status: 500 },
      );
      this.logResponse(
        'PATCH',
        `/admin/notifications/${id}`,
        statusCode,
        'error: Internal',
      );
      return res.status(statusCode).json(errBody);
    }
  }

  /**
   * DELETE /api/admin/notifications/:id
   * Xóa một thông báo. Chỉ xóa được nếu thuộc user (X-User-Id). Trả 204 khi thành công, 404 nếu không tìm thấy hoặc không có quyền.
   */
  @Delete('notifications/:id')
  async deleteOne(
    @Res() res: Response,
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
  ) {
    const userId = this.getUserId(headers);
    this.logRequest('DELETE', `/admin/notifications/${id}`, {
      [APP_HEADERS.USER_ID]: userId ?? '(missing)',
    });

    if (!userId) {
      const { statusCode, body: errBody } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      this.logResponse(
        'DELETE',
        `/admin/notifications/${id}`,
        statusCode,
        'error: Unauthorized',
      );
      return res.status(statusCode).json(errBody);
    }

    try {
      const deleted = await this.notificationsService.deleteOne(id, userId);
      if (!deleted) {
        const { statusCode, body: errBody = {} } = createErrorResponse(
          'Không tìm thấy thông báo hoặc không có quyền xóa',
          { status: 404 },
        );
        this.logResponse(
          'DELETE',
          `/admin/notifications/${id}`,
          statusCode,
          'error: Not found',
        );
        return res.status(statusCode).json(errBody);
      }
      this.logResponse('DELETE', `/admin/notifications/${id}`, 204, 'deleted');
      return res.status(204).send();
    } catch (error) {
      console.error('[Notifications API] delete error:', error);
      const { statusCode, body: errBody } = createErrorResponse(
        'Không thể xóa thông báo',
        { status: 500 },
      );
      this.logResponse(
        'DELETE',
        `/admin/notifications/${id}`,
        statusCode,
        'error: Internal',
      );
      return res.status(statusCode).json(errBody);
    }
  }

  /**
   * POST /api/admin/notifications/mark-all-read
   * Đánh dấu tất cả thông báo của user là đã đọc. Header: X-User-Id (hoặc body.userId).
   */
  @Post('notifications/mark-all-read')
  async markAllAsRead(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { userId?: string },
  ) {
    const userId = this.getUserId(headers) || body?.userId?.trim() || null;
    this.logRequest('POST', '/admin/notifications/mark-all-read', {
      [APP_HEADERS.USER_ID]: this.getUserId(headers) ?? '(missing)',
      'body.userId': body?.userId ?? '(missing)',
      resolvedUserId: userId ?? '(missing)',
    });

    if (!userId) {
      const { statusCode, body: errBody } = createErrorResponse(
        `Thiếu ${APP_HEADERS.USER_ID} (header hoặc body.userId)`,
        { status: 401 },
      );
      this.logResponse(
        'POST',
        '/admin/notifications/mark-all-read',
        statusCode,
        'error: Unauthorized',
      );
      return res.status(statusCode).json(errBody);
    }

    try {
      const result: { count: number } =
        await this.notificationsService.markAllAsRead(userId);
      const { statusCode, body: okBody } = createSuccessResponse(result, {
        message: 'Đánh dấu tất cả đã đọc thành công',
      });
      this.logResponse(
        'POST',
        '/admin/notifications/mark-all-read',
        statusCode,
        `count: ${result.count}`,
      );
      return res.status(statusCode).json(okBody);
    } catch (error) {
      console.error('[Notifications API] markAllAsRead error:', error);
      const { statusCode, body: errBody } = createErrorResponse(
        'Không thể đánh dấu tất cả đã đọc',
        { status: 500 },
      );
      this.logResponse(
        'POST',
        '/admin/notifications/mark-all-read',
        statusCode,
        'error: Internal',
      );
      return res.status(statusCode).json(errBody);
    }
  }

  /**
   * POST /api/admin/notifications/bulk
   * Thực hiện hành động hàng loạt (xóa, đánh dấu đã đọc/chưa đọc).
   * Body: { action: 'delete' | 'mark-read' | 'mark-unread', ids: string[] }.
   * Header: X-User-Id.
   */
  @Post('notifications/bulk')
  async bulk(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      action?: 'delete' | 'mark-read' | 'mark-unread';
      ids?: string[];
    },
  ) {
    const userId = this.getUserId(headers);
    const action = body?.action;
    const ids = body?.ids ?? [];

    this.logRequest('POST', '/admin/notifications/bulk', {
      [APP_HEADERS.USER_ID]: userId ?? '(missing)',
      action,
      count: ids.length,
    });

    if (!userId) {
      const { statusCode, body: errBody } = createErrorResponse(
        `Thiếu header ${APP_HEADERS.USER_ID}`,
        { status: 401 },
      );
      this.logResponse(
        'POST',
        '/admin/notifications/bulk',
        statusCode,
        'error: Unauthorized',
      );
      return res.status(statusCode).json(errBody);
    }

    if (
      !action ||
      !['delete', 'mark-read', 'mark-unread'].includes(action) ||
      !Array.isArray(ids) ||
      ids.length === 0
    ) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Action hoặc ids không hợp lệ',
        { status: 400 },
      );
      this.logResponse(
        'POST',
        '/admin/notifications/bulk',
        statusCode,
        'error: Bad Request',
      );
      return res.status(statusCode).json(errBody);
    }

    try {
      let result: { count: number; alreadyAffected?: number };
      if (action === 'delete') {
        result = await this.notificationsService.bulkDelete(userId, ids);
      } else {
        result = await this.notificationsService.bulkMarkReadUnread(
          userId,
          action,
          ids,
        );
      }

      const { statusCode, body: okBody } = createSuccessResponse(result, {
        message: 'Thực hiện hành động hàng loạt thành công',
      });
      this.logResponse(
        'POST',
        '/admin/notifications/bulk',
        statusCode,
        `action: ${action}, count: ${result.count}`,
      );
      return res.status(statusCode).json(okBody);
    } catch (error) {
      console.error('[Notifications API] bulk error:', error);
      const { statusCode, body: errBody } = createErrorResponse(
        'Không thể thực hiện hành động hàng loạt',
        { status: 500 },
      );
      this.logResponse(
        'POST',
        '/admin/notifications/bulk',
        statusCode,
        'error: Internal',
      );
      return res.status(statusCode).json(errBody);
    }
  }
}
