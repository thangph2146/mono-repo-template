import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  Param,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { PublicPostsService } from './public-posts.service';
import { PublicCategoriesService } from './public-categories.service';
import { PublicContactRequestsService } from './public-contact-requests.service';
import {
  PublicAuthService,
  type CreatePublicRegisterDto,
} from './public-auth.service';
import { AdmissionResultsService } from '../admission-results/admission-results.service';
import { PageContentsService } from '../page-contents/page-contents.service';
import type { CreateContactRequestDto } from './public-contact-requests.service';
import { UsersService } from '../users/users.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { PUBLIC_ROUTES } from '../config/constants';

function parseQuery(query: Record<string, string | undefined>) {
  const page = Math.max(1, parseInt(String(query.page), 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(String(query.limit), 10) || 10),
  );
  return {
    page,
    limit,
    categorySlug: query.categorySlug,
    tagSlug: query.tagSlug,
    search: query.search,
  };
}

@Controller(PUBLIC_ROUTES.BASE)
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly publicPostsService: PublicPostsService,
    private readonly publicCategoriesService: PublicCategoriesService,
    private readonly publicContactRequestsService: PublicContactRequestsService,
    private readonly publicAuthService: PublicAuthService,
    private readonly admissionResultsService: AdmissionResultsService,
    private readonly pageContentsService: PageContentsService,
    private readonly usersService: UsersService,
  ) {}

  private logApiError(api: string, error: unknown, metadata?: unknown): void {
    const details =
      error instanceof Error
        ? {
            api,
            name: error.name,
            message: error.message,
            stack: error.stack ?? null,
            metadata: metadata ?? null,
          }
        : {
            api,
            message: String(error),
            stack: null,
            metadata: metadata ?? null,
          };
    this.logger.error(JSON.stringify(details));
  }

  @Get('dev-login-options')
  async getDevelopmentLoginOptions(@Res() res: Response) {
    this.logger.log('getDevelopmentLoginOptions');
    if (process.env.NODE_ENV !== 'development') {
      const { statusCode, body } = createErrorResponse('Not Found', {
        status: 404,
      });
      return res.status(statusCode).json(body);
    }

    try {
      const options = await this.usersService.listDevelopmentLoginOptions();
      const { statusCode, body } = createSuccessResponse(options);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/public/dev-login-options', error);
      const { statusCode, body } = createErrorResponse(
        'Không thể tải danh sách tài khoản development.',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('admission-results/lookup')
  async lookupAdmissionResult(
    @Query('cccd') cccd: string,
    @Query('soBaoDanh') soBaoDanh: string,
    @Res() res: Response,
  ) {
    this.logger.log(
      `lookupAdmissionResult cccd=${cccd} soBaoDanh=${soBaoDanh}`,
    );
    try {
      if (!cccd?.trim() || !soBaoDanh?.trim()) {
        const { statusCode, body } = createErrorResponse(
          'Vui lòng nhập đầy đủ số CCCD và số báo danh.',
          { status: 400 },
        );
        return res.status(statusCode).json(body);
      }

      const result = await this.admissionResultsService.lookup(cccd, soBaoDanh);
      if (!result) {
        const { statusCode, body } = createErrorResponse(
          'Không tìm thấy kết quả trúng tuyển với thông tin đã cung cấp.',
          { status: 404 },
        );
        return res.status(statusCode).json(body);
      }

      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/public/admission-results/lookup', error, {
        cccd,
        soBaoDanh,
      });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('categories')
  async getCategories(
    @Query('slug') slug: string | undefined,
    @Res() res: Response,
  ) {
    this.logger.log(`getCategories slug=${slug ?? 'all'}`);
    try {
      const categories = await this.publicCategoriesService.getCategories(slug);
      const { statusCode, body } = createSuccessResponse(categories);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/public/categories', error, { slug });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('page-contents/:pageKey')
  async getPageContent(
    @Param('pageKey') pageKey: string,
    @Query('sectionKey') sectionKey: string,
    @Res() res: Response,
  ) {
    this.logger.log(`getPageContent: ${pageKey}, section: ${sectionKey}`);
    try {
      if (sectionKey) {
        const content = await this.pageContentsService.getByPageAndSection(
          pageKey,
          sectionKey,
        );
        if (!content) {
          const { statusCode, body } = createErrorResponse(
            'Page section content not found',
            {
              status: 404,
            },
          );
          return res.status(statusCode).json(body);
        }
        const { statusCode, body } = createSuccessResponse(content);
        return res.status(statusCode).json(body);
      }

      const contents = await this.pageContentsService.getByKey(pageKey);
      if (!contents || contents.length === 0) {
        const { statusCode, body } = createErrorResponse(
          'Page content not found',
          {
            status: 404,
          },
        );
        return res.status(statusCode).json(body);
      }
      const { statusCode, body } = createSuccessResponse(contents);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/public/page-contents/:pageKey', error, {
        pageKey,
        sectionKey: sectionKey || null,
      });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        {
          status: 500,
        },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Post('contact-requests')
  async createContactRequest(
    @Body() body: CreateContactRequestDto,
    @Res() res: Response,
  ) {
    this.logger.log('createContactRequest');
    try {
      const name = body?.name?.trim() || body?.fullName?.trim();
      const email = body?.email?.trim();
      const subject = body?.subject?.trim();
      const hasLegacyConsultationFields = Boolean(
        body?.address ||
        body?.program ||
        body?.major ||
        body?.subscribeNewsletter ||
        body?.subscribeConsultation,
      );
      if (!name || !email || (!subject && !hasLegacyConsultationFields)) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Vui lòng điền đầy đủ họ tên, email và chủ đề liên hệ.',
          { status: 400 },
        );
        return res.status(statusCode).json(errBody);
      }
      const result = await this.publicContactRequestsService.create(body);
      const { statusCode, body: okBody } = createSuccessResponse(result);
      return res.status(statusCode).json(okBody);
    } catch (error) {
      this.logApiError('POST /api/public/contact-requests', error, {
        name: name ?? null,
        email: body?.email ?? null,
        phone: body?.phone ?? null,
        subject: body?.subject ?? null,
      });
      const { statusCode, body: errBody } = createErrorResponse(
        'Không thể gửi liên hệ hỗ trợ. Vui lòng thử lại sau.',
        { status: 500 },
      );
      return res.status(statusCode).json(errBody);
    }
  }

  @Post('register')
  async register(@Body() body: CreatePublicRegisterDto, @Res() res: Response) {
    this.logger.log(`register email=${body?.email ?? '-'}`);
    try {
      const { fullName, email, password } = body;
      if (!fullName?.trim() || !email?.trim() || !password?.trim()) {
        const { statusCode, body: errBody } = createErrorResponse(
          'Vui lòng điền đầy đủ họ tên, email và mật khẩu.',
          { status: 400 },
        );
        return res.status(statusCode).json(errBody);
      }

      const result = await this.publicAuthService.register(body);
      const { statusCode, body: okBody } = createSuccessResponse(result, {
        status: 201,
        message: 'Đăng ký tài khoản thành công',
      });
      return res.status(statusCode).json(okBody);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể đăng ký tài khoản. Vui lòng thử lại sau.';
      this.logApiError('POST /api/public/register', error, {
        email: body?.email ?? null,
        phone: body?.phone ?? null,
      });
      const { statusCode, body: errBody } = createErrorResponse(message, {
        status: message.includes('đã tồn tại') ? 409 : 400,
      });
      return res.status(statusCode).json(errBody);
    }
  }

  @Get('posts')
  async getPosts(
    @Query() query: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    this.logger.log(
      `getPosts page=${query?.page ?? 1} limit=${query?.limit ?? 10}`,
    );
    try {
      const params = parseQuery(query);
      const result = await this.publicPostsService.getPosts(params);
      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/public/posts', error, { query });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('home-admission-posts')
  async getHomeAdmissionPosts(
    @Query() query: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    this.logger.log('getHomeAdmissionPosts');
    try {
      const latestLimit = query.latestLimit
        ? parseInt(String(query.latestLimit), 10)
        : undefined;
      const admissionLimit = query.admissionLimit
        ? parseInt(String(query.admissionLimit), 10)
        : undefined;
      const result = await this.publicPostsService.getHomeAdmissionPosts({
        latestLimit,
        admissionLimit,
        admissionCategorySlug: query.admissionCategorySlug,
      });
      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/public/home-admission-posts', error, {
        query,
      });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Post('posts/:slug/view')
  async incrementPostView(@Param('slug') slug: string, @Res() res: Response) {
    this.logger.log(`incrementPostView slug=${slug}`);
    try {
      const result =
        await this.publicPostsService.incrementPostViewBySlug(slug);
      if (!result) {
        const { statusCode, body } = createErrorResponse('Not Found', {
          status: 404,
        });
        return res.status(statusCode).json(body);
      }
      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('POST /api/public/posts/:slug/view', error, { slug });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('posts/:slug')
  async getPostBySlug(
    @Param('slug') slug: string,
    @Query('track') track: string | undefined,
    @Res() res: Response,
  ) {
    this.logger.log(`getPostBySlug slug=${slug}`);
    try {
      const shouldTrack = track !== 'false';
      const post = await this.publicPostsService.getPostBySlug(slug, {
        trackView: shouldTrack,
      });
      if (!post) {
        const { statusCode, body } = createErrorResponse('Not Found', {
          status: 404,
        });
        return res.status(statusCode).json(body);
      }
      const { statusCode, body } = createSuccessResponse(post);
      return res.status(statusCode).json(body);
    } catch (error) {
      this.logApiError('GET /api/public/posts/:slug', error, {
        slug,
        track,
      });
      const { statusCode, body } = createErrorResponse(
        'Internal Server Error',
        { status: 500 },
      );
      return res.status(statusCode).json(body);
    }
  }
}
