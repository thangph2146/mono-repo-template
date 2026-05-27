/**
 * Posts Admin API Controller.
 * GET list, options, :id; POST (create); PUT :id; POST bulk; DELETE :id/hard-delete; DELETE :id; POST :id/restore.
 * Header: X-User-Id (bắt buộc).
 */
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { PostsService } from './posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationKind } from '../entities/notification.entity';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';
import { RESOURCES, ACTIONS } from '../config/permissions';

type PostListStatus = 'active' | 'deleted' | 'all';
type PostBulkAction =
  | 'delete'
  | 'restore'
  | 'hard-delete'
  | 'set-categories'
  | 'clear-images';
type PostCrudBulkAction = 'delete' | 'restore' | 'hard-delete';

/** Chuẩn hóa categoryIds/tagIds từ body: luôn trả về string[] (loại bỏ rỗng, hỗ trợ string hoặc object có id). */
function normalizeRelationIds(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const arr = value
      .map((item) => {
        if (item == null) return '';
        const obj = item as Record<string, unknown>;
        if (typeof item === 'object' && 'id' in obj && obj.id != null) {
          const id = obj.id;
          if (typeof id === 'string' || typeof id === 'number')
            return String(id).trim();
          if (typeof id === 'boolean') return String(id);
          return '';
        }
        return typeof item === 'string' || typeof item === 'number'
          ? String(item).trim()
          : '';
      })
      .filter((id) => id !== '');
    return arr;
  }
  if (typeof value === 'string' && value.trim() !== '') return [value.trim()];
  return undefined;
}

@ApiTags('Posts')
@Controller(ADMIN_ROUTES.POSTS)
export class PostsController {
  private readonly logger = new Logger(PostsController.name);
  private readonly listStatuses = new Set<PostListStatus>([
    'active',
    'deleted',
    'all',
  ]);
  private readonly bulkActions = new Set<PostBulkAction>([
    'delete',
    'restore',
    'hard-delete',
    'set-categories',
    'clear-images',
  ]);

  constructor(
    private readonly postsService: PostsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private logActivity(
    userId: string,
    title: string,
    description: string,
    actionUrl?: string,
    metadata?: Record<string, unknown>,
  ): void {
    void this.notificationsService
      .create({
        userId,
        kind: NotificationKind.SYSTEM,
        title,
        description,
        actionUrl: actionUrl ?? null,
        metadata: metadata ?? undefined,
      })
      .catch(() => {});
  }

  private getUserId(
    headers: Record<string, string | string[] | undefined>,
  ): string | null {
    const val = headers[APP_HEADERS.USER_ID];
    const id = Array.isArray(val) ? val[0] : val;
    return id?.trim() || null;
  }

  private unauthorized(res: Response): Response {
    const { statusCode, body } = createErrorResponse('Thiếu header X-User-Id', {
      status: 401,
    });
    return res.status(statusCode).json(body);
  }

  private parseListStatus(status?: string): PostListStatus {
    if (status && this.listStatuses.has(status as PostListStatus)) {
      return status as PostListStatus;
    }
    return 'active';
  }

  private isBulkAction(action: string): action is PostBulkAction {
    return this.bulkActions.has(action as PostBulkAction);
  }

  private isCrudBulkAction(
    action: PostBulkAction,
  ): action is PostCrudBulkAction {
    return (
      action === 'delete' || action === 'restore' || action === 'hard-delete'
    );
  }

  private buildErrorDetails(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack ?? null,
      };
    }
    return {
      message: typeof error === 'string' ? error : String(error),
      stack: null,
    };
  }

  private logApiError(
    api: string,
    message: string,
    error: unknown,
    metadata?: Record<string, unknown>,
  ): void {
    this.logger.error(
      JSON.stringify({
        api,
        message,
        ...this.buildErrorDetails(error),
        metadata: metadata ?? null,
      }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'List posts with pagination' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'deleted', 'all'],
  })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Missing X-User-Id header' })
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query() query?: Record<string, string>,
  ) {
    this.logger.log(
      `list page=${page ?? 1} limit=${limit ?? 10} status=${status ?? 'active'}`,
    );
    const userId = this.getUserId(headers);
    if (!userId) {
      this.logger.warn('list: Missing X-User-Id');
      return this.unauthorized(res);
    }
    const filters: Record<string, string> = {};
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        const m = key.match(/^filter\[(.+)\]$/);
        if (m && value) filters[m[1]] = value;
      }
    }
    try {
      const result = await this.postsService.list({
        page: Math.max(1, parseInt(String(page), 10) || 1),
        limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
        search: search?.trim(),
        status: this.parseListStatus(status),
        filters: Object.keys(filters).length ? filters : undefined,
      });
      const { statusCode, body } = createSuccessResponse({
        data: result.data,
        pagination: result.pagination,
      });
      return res.status(statusCode).json(body);
    } catch (error: unknown) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `GET /admin/posts ERROR: ${error instanceof Error ? error.message : String(error)}`,
        stack,
      );
      this.logApiError(
        'GET /admin/posts',
        'Lỗi khi lấy danh sách posts',
        error,
        {
          page,
          limit,
          status,
          search,
          filters,
        },
      );
      const { statusCode, body } = createErrorResponse(
        'Lỗi server khi lấy danh sách posts',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('options')
  @ApiOperation({ summary: 'Get post options for dropdowns' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Options retrieved successfully' })
  async options(
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query('column') column?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(`options column=${column ?? 'title'}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      this.logger.warn('options: Missing X-User-Id');
      return this.unauthorized(res);
    }
    const options = await this.postsService.getOptions(
      column ?? 'title',
      search?.trim(),
      Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50)),
    );
    const { statusCode, body } = createSuccessResponse(options);
    return res.status(statusCode).json(body);
  }

  @Get('dates-with-posts')
  @ApiOperation({ summary: 'Get dates with posts' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiResponse({ status: 200, description: 'Dates retrieved successfully' })
  async getDatesWithPosts(
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    try {
      this.logger.log('getDatesWithPosts');
      const userId = this.getUserId(headers);
      if (!userId) {
        this.logger.warn('getDatesWithPosts: Missing X-User-Id');
        return this.unauthorized(res);
      }
      const dates = await this.postsService.getDatesWithPosts();
      const { statusCode, body } = createSuccessResponse({ dates });
      return res.status(statusCode).json(body);
    } catch (error) {
      const details =
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : { message: String(error) };
      this.logger.error(
        `[GET ${ADMIN_ROUTES.POSTS}/dates-with-posts] controller error ${JSON.stringify(details)}`,
      );
      const { statusCode, body } = createErrorResponse(
        'Lỗi server khi lấy danh sách ngày có bài viết',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post found' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`getById id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      this.logger.warn('getById: Missing X-User-Id');
      return this.unauthorized(res);
    }
    const row = await this.postsService.getById(id);
    if (!row) {
      this.logger.log(`getById id=${id} not found`);
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy bài viết',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create new post' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body()
    body: {
      title?: string;
      slug?: string;
      content?: unknown;
      excerpt?: string | null;
      image?: string | null;
      published?: boolean;
      publishedAt?: string | null;
      eventStartAt?: string | null;
      eventEndAt?: string | null;
      categoryIds?: string[];
      tagIds?: string[];
    },
  ) {
    this.logger.log('create');
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    if (!body?.title?.trim() || !body?.slug?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'title và slug là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.postsService.create(userId, {
      title: body.title.trim(),
      slug: body.slug.trim(),
      content: body.content ?? {},
      excerpt: body.excerpt ?? null,
      image: body.image ?? null,
      published: body.published ?? false,
      publishedAt: body.publishedAt ?? null,
      eventStartAt: body.eventStartAt ?? null,
      eventEndAt: body.eventEndAt ?? null,
      categoryIds: normalizeRelationIds(body.categoryIds) ?? [],
      tagIds: normalizeRelationIds(body.tagIds) ?? [],
    });
    if (userId) {
      this.logActivity(
        userId,
        'Đã tạo bài viết',
        `Tạo bài viết: ${created.title} (${created.slug})`,
        `${ADMIN_ROUTES.POSTS}/${created.id}`,
        {
          resource: RESOURCES.POSTS,
          action: ACTIONS.CREATE,
          resourceId: created.id,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(created, {
      status: 201,
    });
    return res.status(statusCode).json(okBody);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update post by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      slug?: string;
      content?: unknown;
      excerpt?: string | null;
      image?: string | null;
      published?: boolean;
      publishedAt?: string | null;
      eventStartAt?: string | null;
      eventEndAt?: string | null;
      categoryIds?: string[];
      tagIds?: string[];
      authorId?: string;
    },
  ) {
    try {
      this.logger.log(`update id=${id}`);
      const userId = this.getUserId(headers);
      if (!userId) {
        return this.unauthorized(res);
      }
      const updated = await this.postsService.update(id, {
        title: body?.title?.trim(),
        slug: body?.slug?.trim(),
        content: body?.content,
        excerpt: body?.excerpt ?? undefined,
        image: body?.image ?? undefined,
        published: body?.published,
        publishedAt: body?.publishedAt ?? undefined,
        eventStartAt: body?.eventStartAt ?? undefined,
        eventEndAt: body?.eventEndAt ?? undefined,
        categoryIds: normalizeRelationIds(body?.categoryIds),
        tagIds: normalizeRelationIds(body?.tagIds),
        authorId: body?.authorId?.trim() || undefined,
      });
      if (!updated) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Không tìm thấy bài viết',
          { status: 404 },
        );
        return res.status(statusCode).json(errBody);
      }
      this.logActivity(
        userId,
        'Đã cập nhật bài viết',
        `Cập nhật bài viết: ${updated.title} (${updated.slug})`,
        `${ADMIN_ROUTES.POSTS}/${updated.id}`,
        {
          resource: RESOURCES.POSTS,
          action: ACTIONS.UPDATE,
          resourceId: updated.id,
        },
      );
      const { statusCode, body: okBody } = createSuccessResponse(updated);
      return res.status(statusCode).json(okBody);
    } catch (error) {
      this.logApiError(
        `${ADMIN_ROUTES.POSTS}/${id}`,
        'Lỗi cập nhật bài viết',
        error,
        {
          postId: id,
          body: {
            ...body,
            content: body?.content ? '[provided]' : undefined,
          },
        },
      );
      const fallbackMessage =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Lỗi server khi cập nhật bài viết';
      const status =
        fallbackMessage.includes('không hợp lệ') ||
        fallbackMessage.includes('không tồn tại')
          ? 400
          : 500;
      const { statusCode, body: errBody } = createErrorResponse(
        fallbackMessage,
        {
          status,
        },
      );
      return res.status(statusCode).json(errBody);
    }
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk action on posts' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  async bulk(
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: { action?: string; ids?: string[] },
  ) {
    this.logger.log(
      `bulk action=${body?.action} ids=${(body?.ids ?? []).length}`,
    );
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const action = body?.action;
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (!action || !this.isBulkAction(action)) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Action không hợp lệ',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }

    if (action === 'set-categories') {
      const rawCats = (body as { categoryIds?: unknown }).categoryIds;
      const categoryIds = normalizeRelationIds(rawCats) ?? [];
      const modeRaw = (body as { mode?: string }).mode;
      const mode = modeRaw === 'add' ? ('add' as const) : ('replace' as const);
      const result = await this.postsService.bulkSetCategories(
        ids,
        categoryIds,
        mode,
      );
      if (userId && result.affected > 0) {
        this.logActivity(
          userId,
          'Đã gán danh mục hàng loạt',
          `${result.message} (${mode})`,
          ADMIN_ROUTES.POSTS,
          {
            resource: RESOURCES.POSTS,
            action: ACTIONS.UPDATE,
            count: result.affected,
            ids,
            categoryIds,
            mode,
          },
        );
      }
      const { statusCode, body: okBody } = createSuccessResponse(
        { affected: result.affected, message: result.message },
        { message: result.message },
      );
      return res.status(statusCode).json(okBody);
    }

    if (action === 'clear-images') {
      const result = await this.postsService.bulkClearImages(ids);
      if (userId && result.affected > 0) {
        this.logActivity(
          userId,
          'Đã xóa hình ảnh hàng loạt',
          result.message,
          ADMIN_ROUTES.POSTS,
          {
            resource: RESOURCES.POSTS,
            action: ACTIONS.UPDATE,
            count: result.affected,
            ids,
          },
        );
      }
      const { statusCode, body: okBody } = createSuccessResponse(
        { affected: result.affected, message: result.message },
        { message: result.message },
      );
      return res.status(statusCode).json(okBody);
    }

    if (!this.isCrudBulkAction(action)) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Action không hợp lệ',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }

    const result = await this.postsService.bulk(action, ids);
    if (userId && result.affected > 0) {
      let actionLabel = '';
      let actionType = '';

      switch (action) {
        case 'delete':
          actionLabel = 'Xóa';
          actionType = ACTIONS.DELETE;
          break;
        case 'restore':
          actionLabel = 'Khôi phục';
          actionType = ACTIONS.RESTORE;
          break;
        case 'hard-delete':
          actionLabel = 'Xóa vĩnh viễn';
          actionType = ACTIONS.HARD_DELETE;
          break;
      }

      this.logActivity(
        userId,
        `Đã ${actionLabel} ${result.affected} bài viết`,
        `Bulk: ${actionLabel} ${result.affected} bài viết`,
        ADMIN_ROUTES.POSTS,
        {
          resource: RESOURCES.POSTS,
          action: actionType,
          count: result.affected,
          ids,
        },
      );
    }
    const { statusCode, body: okBody } = createSuccessResponse(
      { affected: result.affected, message: result.message },
      { message: result.message },
    );
    return res.status(statusCode).json(okBody);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({ summary: 'Hard delete post permanently' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post deleted permanently' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`hardDelete id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const ok = await this.postsService.hardDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy bài viết',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa vĩnh viễn bài viết',
        `Xóa vĩnh viễn bài viết id: ${id}`,
        ADMIN_ROUTES.POSTS,
        {
          resource: RESOURCES.POSTS,
          action: ACTIONS.HARD_DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn bài viết',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete post' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post deleted' })
  @ApiResponse({
    status: 404,
    description: 'Post not found or already deleted',
  })
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`softDelete id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const ok = await this.postsService.softDelete(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Bài viết không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã xóa bài viết',
        `Xóa bài viết (soft) id: ${id}`,
        ADMIN_ROUTES.POSTS,
        {
          resource: RESOURCES.POSTS,
          action: ACTIONS.DELETE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa bài viết',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted post' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post restored' })
  @ApiResponse({ status: 404, description: 'Post not found or not deleted' })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    this.logger.log(`restore id=${id}`);
    const userId = this.getUserId(headers);
    if (!userId) {
      return this.unauthorized(res);
    }
    const ok = await this.postsService.restore(id);
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Bài viết không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    if (userId) {
      this.logActivity(
        userId,
        'Đã khôi phục bài viết',
        `Khôi phục bài viết id: ${id}`,
        `${ADMIN_ROUTES.POSTS}/${id}`,
        {
          resource: RESOURCES.POSTS,
          action: ACTIONS.RESTORE,
          resourceId: id,
        },
      );
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục bài viết',
    });
    return res.status(statusCode).json(body);
  }
}
