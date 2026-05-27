/**
 * Routes phụ huynh (parent role):
 *   POST   /parent/my-students           — yêu cầu liên kết học sinh
 *   GET    /parent/my-students           — danh sách học sinh của phụ huynh đang đăng nhập
 *   DELETE /parent/my-students/:id       — xóa yêu cầu (chỉ khi pending/rejected)
 *
 *   | GET | scores/detailed/{studentCode}   | Chi tiết điểm                     |
 *   | GET | averages/year/{studentCode}     | Điểm trung bình năm               |
 *   | GET | averages/terms/{studentCode}    | Điểm trung bình học kỳ            |
 *   | GET | averages/overall/{studentCode}  | Tổng hợp điểm trung bình chung     |
 *
 * Routes admin:
 *   GET    /admin/parent-students        — toàn bộ yêu cầu (có filter status)
 *   PATCH  /admin/parent-students/:id/review — duyệt / từ chối
 */
import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ParentStudentsService } from './parent-students.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '../common/api-response';
import { APP_HEADERS } from '../config/constants';

@Controller('parent/my-students')
export class ParentStudentsPublicController {
  private readonly logger = new Logger(ParentStudentsPublicController.name);

  constructor(private readonly svc: ParentStudentsService) {}

  @Get()
  async list(
    @Headers() headers: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const parentId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!parentId) {
      const { statusCode, body } = createErrorResponse('Chưa đăng nhập', {
        status: 401,
      });
      return res.status(statusCode).json(body);
    }
    try {
      const data = await this.svc.listByParent(parentId);
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error('listByParent', err);
      const { statusCode, body } = createErrorResponse('Lỗi hệ thống');
      return res.status(statusCode).json(body);
    }
  }

  @Post()
  async add(
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: { studentCode: string; studentName?: string; note?: string },
    @Res() res: Response,
  ) {
    const parentId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!parentId) {
      const { statusCode, body: b } = createErrorResponse('Chưa đăng nhập', {
        status: 401,
      });
      return res.status(statusCode).json(b);
    }
    if (!body.studentCode?.trim()) {
      const { statusCode, body: b } = createErrorResponse(
        'Mã sinh viên không được để trống',
      );
      return res.status(statusCode).json(b);
    }
    try {
      const data = await this.svc.addStudentRequest({
        parentId,
        studentCode: body.studentCode,
        studentName: body.studentName,
        note: body.note,
      });
      const { statusCode, body: b } = createSuccessResponse(data);
      return res.status(statusCode).json(b);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      this.logger.error('addStudentRequest', err);
      const { statusCode, body: b } = createErrorResponse(msg);
      return res.status(statusCode).json(b);
    }
  }

  @Get('grades/:studentCode')
  async getGrades(
    @Param('studentCode') studentCode: string,
    @Headers() headers: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const parentId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!parentId) {
      const { statusCode, body } = createErrorResponse('Chưa đăng nhập', {
        status: 401,
      });
      return res.status(statusCode).json(body);
    }
    try {
      const links = await this.svc.listByParent(parentId);
      const approved = links.find(
        (l) => l.studentCode === studentCode && l.status === 'approved',
      );
      if (!approved) {
        const { statusCode, body } = createErrorResponse(
          'Học sinh chưa được duyệt hoặc không thuộc tài khoản này',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }

      const externalApiUrl = process.env.EXTERNAL_API_URL;
      if (!externalApiUrl) {
        const { statusCode, body } = createSuccessResponse({
          studentCode,
          semesters: [],
          message: 'EXTERNAL_API_URL chưa được cấu hình',
        });
        return res.status(statusCode).json(body);
      }

      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.EXTERNAL_API_TOKEN) {
        fetchHeaders['Authorization'] =
          `Bearer ${process.env.EXTERNAL_API_TOKEN}`;
      }

      const response = await fetch(
        `${externalApiUrl}/api/hub/students/${encodeURIComponent(studentCode)}/scores/detailed`,
        { headers: fetchHeaders, signal: AbortSignal.timeout(10000) },
      );
      if (!response.ok) {
        const { statusCode, body } = createErrorResponse(
          `API điểm trả về lỗi: ${response.status}`,
        );
        return res.status(statusCode).json(body);
      }
      const gradeData = await response.json();
      const { statusCode, body } = createSuccessResponse(gradeData);
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error('getGrades', err);
      const { statusCode, body } = createErrorResponse(
        'Không thể lấy dữ liệu điểm',
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('scores/detailed/:studentCode')
  async getDetailedScores(
    @Param('studentCode') studentCode: string,
    @Headers() headers: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const parentId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!parentId) {
      const { statusCode, body } = createErrorResponse('Chưa đăng nhập', {
        status: 401,
      });
      return res.status(statusCode).json(body);
    }
    try {
      const links = await this.svc.listByParent(parentId);
      const approved = links.find(
        (l) => l.studentCode === studentCode && l.status === 'approved',
      );
      if (!approved) {
        const { statusCode, body } = createErrorResponse(
          'Học sinh chưa được duyệt hoặc không thuộc tài khoản này',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }
      const externalApiUrl = process.env.EXTERNAL_API_URL;
      if (!externalApiUrl) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'EXTERNAL_API_URL chưa được cấu hình',
        });
      }
      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.EXTERNAL_API_TOKEN) {
        fetchHeaders['Authorization'] =
          `Bearer ${process.env.EXTERNAL_API_TOKEN}`;
      }
      const response = await fetch(
        `${externalApiUrl}/api/scores/detailed/${encodeURIComponent(studentCode)}`,
        { headers: fetchHeaders, signal: AbortSignal.timeout(10000) },
      );
      if (!response.ok) {
        const { statusCode, body } = createErrorResponse(
          `API điểm trả về lỗi: ${response.status}`,
        );
        return res.status(statusCode).json(body);
      }
      const data = await response.json();
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error('getDetailedScores', err);
      const { statusCode, body } = createErrorResponse(
        'Không thể lấy dữ liệu điểm chi tiết',
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('averages/year/:studentCode')
  async getYearAverages(
    @Param('studentCode') studentCode: string,
    @Headers() headers: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const parentId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!parentId) {
      const { statusCode, body } = createErrorResponse('Chưa đăng nhập', {
        status: 401,
      });
      return res.status(statusCode).json(body);
    }
    try {
      const links = await this.svc.listByParent(parentId);
      const approved = links.find(
        (l) => l.studentCode === studentCode && l.status === 'approved',
      );
      if (!approved) {
        const { statusCode, body } = createErrorResponse(
          'Học sinh chưa được duyệt hoặc không thuộc tài khoản này',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }
      const externalApiUrl = process.env.EXTERNAL_API_URL;
      if (!externalApiUrl) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'EXTERNAL_API_URL chưa được cấu hình',
        });
      }
      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.EXTERNAL_API_TOKEN) {
        fetchHeaders['Authorization'] =
          `Bearer ${process.env.EXTERNAL_API_TOKEN}`;
      }
      const response = await fetch(
        `${externalApiUrl}/api/averages/year/${encodeURIComponent(studentCode)}`,
        { headers: fetchHeaders, signal: AbortSignal.timeout(10000) },
      );
      if (!response.ok) {
        const { statusCode, body } = createErrorResponse(
          `API điểm trả về lỗi: ${response.status}`,
        );
        return res.status(statusCode).json(body);
      }
      const data = await response.json();
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error('getYearAverages', err);
      const { statusCode, body } = createErrorResponse(
        'Không thể lấy dữ liệu điểm trung bình năm',
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('averages/terms/:studentCode')
  async getTermAverages(
    @Param('studentCode') studentCode: string,
    @Headers() headers: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const parentId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!parentId) {
      const { statusCode, body } = createErrorResponse('Chưa đăng nhập', {
        status: 401,
      });
      return res.status(statusCode).json(body);
    }
    try {
      const links = await this.svc.listByParent(parentId);
      const approved = links.find(
        (l) => l.studentCode === studentCode && l.status === 'approved',
      );
      if (!approved) {
        const { statusCode, body } = createErrorResponse(
          'Học sinh chưa được duyệt hoặc không thuộc tài khoản này',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }
      const externalApiUrl = process.env.EXTERNAL_API_URL;
      if (!externalApiUrl) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'EXTERNAL_API_URL chưa được cấu hình',
        });
      }
      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.EXTERNAL_API_TOKEN) {
        fetchHeaders['Authorization'] =
          `Bearer ${process.env.EXTERNAL_API_TOKEN}`;
      }
      const response = await fetch(
        `${externalApiUrl}/api/averages/terms/${encodeURIComponent(studentCode)}`,
        { headers: fetchHeaders, signal: AbortSignal.timeout(10000) },
      );
      if (!response.ok) {
        const { statusCode, body } = createErrorResponse(
          `API điểm trả về lỗi: ${response.status}`,
        );
        return res.status(statusCode).json(body);
      }
      const data = await response.json();
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error('getTermAverages', err);
      const { statusCode, body } = createErrorResponse(
        'Không thể lấy dữ liệu điểm trung bình học kỳ',
      );
      return res.status(statusCode).json(body);
    }
  }

  @Get('averages/overall/:studentCode')
  async getOverallAverage(
    @Param('studentCode') studentCode: string,
    @Headers() headers: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const parentId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!parentId) {
      const { statusCode, body } = createErrorResponse('Chưa đăng nhập', {
        status: 401,
      });
      return res.status(statusCode).json(body);
    }
    try {
      const links = await this.svc.listByParent(parentId);
      const approved = links.find(
        (l) => l.studentCode === studentCode && l.status === 'approved',
      );
      if (!approved) {
        const { statusCode, body } = createErrorResponse(
          'Học sinh chưa được duyệt hoặc không thuộc tài khoản này',
          { status: 403 },
        );
        return res.status(statusCode).json(body);
      }
      const externalApiUrl = process.env.EXTERNAL_API_URL;
      if (!externalApiUrl) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'EXTERNAL_API_URL chưa được cấu hình',
        });
      }
      const fetchHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (process.env.EXTERNAL_API_TOKEN) {
        fetchHeaders['Authorization'] =
          `Bearer ${process.env.EXTERNAL_API_TOKEN}`;
      }
      const response = await fetch(
        `${externalApiUrl}/api/averages/overall/${encodeURIComponent(studentCode)}`,
        { headers: fetchHeaders, signal: AbortSignal.timeout(10000) },
      );
      if (!response.ok) {
        const { statusCode, body } = createErrorResponse(
          `API điểm trả về lỗi: ${response.status}`,
        );
        return res.status(statusCode).json(body);
      }
      const data = await response.json();
      const { statusCode, body } = createSuccessResponse(data);
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error('getOverallAverage', err);
      const { statusCode, body } = createErrorResponse(
        'Không thể lấy dữ liệu tổng hợp điểm',
      );
      return res.status(statusCode).json(body);
    }
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers() headers: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const parentId = headers[APP_HEADERS.USER_ID]?.trim();
    if (!parentId) {
      const { statusCode, body } = createErrorResponse('Chưa đăng nhập', {
        status: 401,
      });
      return res.status(statusCode).json(body);
    }
    try {
      const ok = await this.svc.remove(id, parentId);
      if (!ok) {
        const { statusCode, body } = createErrorResponse(
          'Không tìm thấy hoặc không có quyền',
          { status: 404 },
        );
        return res.status(statusCode).json(body);
      }
      const { statusCode, body } = createSuccessResponse({ id });
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error('remove', err);
      const { statusCode, body } = createErrorResponse('Lỗi hệ thống');
      return res.status(statusCode).json(body);
    }
  }
}

@Controller('admin/parent-students')
export class ParentStudentsAdminController {
  private readonly logger = new Logger(ParentStudentsAdminController.name);

  constructor(private readonly svc: ParentStudentsService) {}

  @Get()
  async list(@Query() query: Record<string, string>, @Res() res: Response) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    try {
      const result = await this.svc.listAll({
        page,
        limit,
        status: query.status,
        search: query.search,
        createdAt: query.createdAt,
      });
      const { statusCode, body } = createSuccessResponse(result);
      return res.status(statusCode).json(body);
    } catch (err) {
      this.logger.error('listAll', err);
      const { statusCode, body } = createErrorResponse('Lỗi hệ thống');
      return res.status(statusCode).json(body);
    }
  }

  @Patch(':id/review')
  async review(
    @Param('id') id: string,
    @Body() body: { action: 'approved' | 'rejected' },
    @Headers() headers: Record<string, string | undefined>,
    @Res() res: Response,
  ) {
    const reviewerId = headers[APP_HEADERS.USER_ID]?.trim() ?? 'system';
    if (!['approved', 'rejected'].includes(body.action)) {
      const { statusCode, body: b } = createErrorResponse(
        'action phải là approved hoặc rejected',
      );
      return res.status(statusCode).json(b);
    }
    try {
      const data = await this.svc.review(id, body.action, reviewerId);
      if (!data) {
        const { statusCode, body: b } = createErrorResponse('Không tìm thấy', {
          status: 404,
        });
        return res.status(statusCode).json(b);
      }
      const { statusCode, body: b } = createSuccessResponse(data);
      return res.status(statusCode).json(b);
    } catch (err) {
      this.logger.error('review', err);
      const { statusCode, body: b } = createErrorResponse('Lỗi hệ thống');
      return res.status(statusCode).json(b);
    }
  }
}
