import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
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
import { ImportedUsersService } from './imported-users.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS, ADMIN_ROUTES } from '../config/constants';

@ApiTags('Imported Users')
@Controller(ADMIN_ROUTES.IMPORTED_USERS)
export class ImportedUsersController {
  private readonly logger = new Logger(ImportedUsersController.name);

  constructor(private readonly importedUsersService: ImportedUsersService) {}

  private getUserId(
    headers: Record<string, string | undefined>,
  ): string | null {
    const id = headers[APP_HEADERS.USER_ID]?.trim();
    return id || null;
  }

  private unauthorized(res: Response): Response {
    const { statusCode, body } = createErrorResponse('Thiếu header X-User-Id', {
      status: 401,
    });
    return res.status(statusCode).json(body);
  }

  @Get()
  @ApiOperation({ summary: 'List imported users with pagination' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Imported users retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Missing X-User-Id header' })
  async list(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const result = await this.importedUsersService.list({
      page: Math.max(1, parseInt(String(page), 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(String(limit), 10) || 10)),
      search: search?.trim(),
    });
    const { statusCode, body } = createSuccessResponse({
      data: result.data,
      pagination: result.pagination,
    });
    return res.status(statusCode).json(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get imported user by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Imported user found' })
  @ApiResponse({ status: 404, description: 'Imported user not found' })
  async getById(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const row = await this.importedUsersService.getById(Number(id));
    if (!row) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy người dùng',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(row);
    return res.status(statusCode).json(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create new imported user' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiBody({ description: 'Imported user data' })
  @ApiResponse({ status: 201, description: 'Imported user created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Body()
    body: {
      email?: string;
      fullName?: string;
      accountId?: string;
      lastName?: string;
      middleName?: string;
      firstName?: string;
      accountType?: string;
      mobilePhone?: string;
      homePhone1?: string;
      password?: string;
      homePhone?: string;
      avatar?: string;
      canUploadAvatar?: number;
      typeId?: number;
      academicYearId?: number;
      trainingLevelId?: number;
      trainingSystemId?: number;
      majorId?: number;
      departmentId?: number;
      status?: number;
      refreshToken?: string;
      refreshTokenExp?: string;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    if (!body?.email?.trim() && !body?.fullName?.trim()) {
      const { statusCode, body: errBody } = createErrorResponse(
        'email hoặc fullName là bắt buộc',
        { status: 400 },
      );
      return res.status(statusCode).json(errBody);
    }
    const created = await this.importedUsersService.create({
      email: body.email?.trim(),
      fullName: body.fullName?.trim(),
      accountId: body.accountId?.trim(),
      lastName: body.lastName?.trim(),
      middleName: body.middleName?.trim(),
      firstName: body.firstName?.trim(),
      accountType: body.accountType?.trim(),
      mobilePhone: body.mobilePhone?.trim(),
      homePhone1: body.homePhone1?.trim(),
      password: body.password,
      homePhone: body.homePhone?.trim(),
      avatar: body.avatar?.trim(),
      canUploadAvatar: body.canUploadAvatar,
      typeId: body.typeId != null ? Number(body.typeId) : null,
      academicYearId:
        body.academicYearId != null ? Number(body.academicYearId) : null,
      trainingLevelId:
        body.trainingLevelId != null ? Number(body.trainingLevelId) : null,
      trainingSystemId:
        body.trainingSystemId != null ? Number(body.trainingSystemId) : null,
      majorId: body.majorId != null ? Number(body.majorId) : null,
      departmentId:
        body.departmentId != null ? Number(body.departmentId) : null,
      status: body.status,
      refreshToken: body.refreshToken,
      refreshTokenExp: body.refreshTokenExp
        ? new Date(body.refreshTokenExp)
        : null,
    });
    const { statusCode, body: okBody } = createSuccessResponse(created, {
      status: 201,
    });
    return res.status(statusCode).json(okBody);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update imported user by ID' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ description: 'Updated imported user data' })
  @ApiResponse({ status: 200, description: 'Imported user updated' })
  @ApiResponse({ status: 404, description: 'Imported user not found' })
  async update(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
    @Body()
    body: {
      email?: string;
      fullName?: string;
      accountId?: string;
      lastName?: string;
      middleName?: string;
      firstName?: string;
      accountType?: string;
      mobilePhone?: string;
      homePhone1?: string;
      password?: string;
      homePhone?: string;
      avatar?: string;
      canUploadAvatar?: number;
      typeId?: number;
      academicYearId?: number;
      trainingLevelId?: number;
      trainingSystemId?: number;
      majorId?: number;
      departmentId?: number;
      status?: number;
      refreshToken?: string;
      refreshTokenExp?: string;
    },
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const updated = await this.importedUsersService.update(Number(id), {
      email: body.email?.trim(),
      fullName: body.fullName?.trim(),
      accountId: body.accountId?.trim(),
      lastName: body.lastName?.trim(),
      middleName: body.middleName?.trim(),
      firstName: body.firstName?.trim(),
      accountType: body.accountType?.trim(),
      mobilePhone: body.mobilePhone?.trim(),
      homePhone1: body.homePhone1?.trim(),
      password: body.password,
      homePhone: body.homePhone?.trim(),
      avatar: body.avatar?.trim(),
      canUploadAvatar: body.canUploadAvatar,
      typeId: body.typeId != null ? Number(body.typeId) : undefined,
      academicYearId:
        body.academicYearId != null ? Number(body.academicYearId) : undefined,
      trainingLevelId:
        body.trainingLevelId != null ? Number(body.trainingLevelId) : undefined,
      trainingSystemId:
        body.trainingSystemId != null
          ? Number(body.trainingSystemId)
          : undefined,
      majorId: body.majorId != null ? Number(body.majorId) : undefined,
      departmentId:
        body.departmentId != null ? Number(body.departmentId) : undefined,
      status: body.status,
      refreshToken: body.refreshToken,
      refreshTokenExp: body.refreshTokenExp
        ? new Date(body.refreshTokenExp)
        : undefined,
    });
    if (!updated) {
      const { statusCode, body: errBody } = createErrorResponse(
        'Không tìm thấy người dùng',
        { status: 404 },
      );
      return res.status(statusCode).json(errBody);
    }
    const { statusCode, body: okBody } = createSuccessResponse(updated);
    return res.status(statusCode).json(okBody);
  }

  @Delete(':id/hard-delete')
  @ApiOperation({ summary: 'Hard delete imported user permanently' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Imported user deleted permanently',
  })
  @ApiResponse({ status: 404, description: 'Imported user not found' })
  async hardDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.importedUsersService.hardDelete(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Không tìm thấy người dùng',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa vĩnh viễn người dùng',
    });
    return res.status(statusCode).json(body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete imported user' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Imported user deleted' })
  @ApiResponse({
    status: 404,
    description: 'Imported user not found or already deleted',
  })
  async softDelete(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.importedUsersService.softDelete(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Người dùng không tồn tại hoặc đã bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã xóa người dùng',
    });
    return res.status(statusCode).json(body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted imported user' })
  @ApiHeader({ name: 'X-User-Id', required: true })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Imported user restored' })
  @ApiResponse({
    status: 404,
    description: 'Imported user not found or not deleted',
  })
  async restore(
    @Res() res: Response,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id') id: string,
  ) {
    const userId = this.getUserId(headers);
    if (!userId) return this.unauthorized(res);
    const ok = await this.importedUsersService.restore(Number(id));
    if (!ok) {
      const { statusCode, body } = createErrorResponse(
        'Người dùng không tồn tại hoặc chưa bị xóa',
        { status: 404 },
      );
      return res.status(statusCode).json(body);
    }
    const { statusCode, body } = createSuccessResponse(undefined, {
      message: 'Đã khôi phục người dùng',
    });
    return res.status(statusCode).json(body);
  }
}
