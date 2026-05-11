import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BackupSecretGuard } from './backup-secret.guard';
import { DataBackupService } from './data-backup.service';
import { DataExcelService } from './data-excel.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/public.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';

@ApiTags('data-maintenance')
@Controller('data-maintenance')
@UseGuards(BackupSecretGuard, PermissionsGuard)
@Permissions(PERMISSIONS.DATA_MAINTENANCE)
@ApiHeader({ name: 'X-User-Id', description: 'User có quyền data.maintenance' })
export class DataMaintenanceController {
  constructor(
    private readonly backup: DataBackupService,
    private readonly excel: DataExcelService,
  ) {}

  @Get('export')
  @ApiOperation({
    summary:
      'Xuất backup JSON (ORM metadata) — file có thụt dòng, dễ đọc và chỉnh sửa tay.',
  })
  async export(): Promise<StreamableFile> {
    const payload = await this.backup.exportJson();
    const buf = Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
    return new StreamableFile(buf, {
      type: 'application/json; charset=utf-8',
      disposition: 'attachment; filename="storesync-backup.json"',
    });
  }

  @Post('import')
  @ApiOperation({
    summary:
      'Import backup JSON — xóa dữ liệu hiện có theo thứ tự FK rồi insert lại (PostgreSQL/MySQL/SQLite)',
  })
  async import(
    @Body() payload: unknown,
  ): Promise<{ inserted: number; ok: true }> {
    const inserted = await this.backup.importJson(payload);
    return { ...inserted, ok: true };
  }

  @Get('export/excel')
  @ApiOperation({
    summary:
      'Xuất workbook Excel — sheet Huong_dan + bảng có định dạng (lọc, đóng băng tiêu đề, JSON xuống dòng), metadata ẩn _backup_meta',
  })
  async exportExcel(): Promise<StreamableFile> {
    const buf = await this.excel.exportWorkbook();
    return new StreamableFile(Buffer.from(buf), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment; filename="storesync-backup.xlsx"',
    });
  }

  @Post('import/excel')
  @ApiOperation({
    summary:
      'Import workbook Excel (định dạng do export/excel tạo) — ghi đè toàn bộ dữ liệu như import JSON',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'File .xlsx' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 52 * 1024 * 1024 } }),
  )
  async importExcel(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ inserted: number; ok: true }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Gửi file Excel (form field: file).');
    }
    const inserted = await this.excel.importWorkbook(file.buffer);
    return { ...inserted, ok: true };
  }
}
