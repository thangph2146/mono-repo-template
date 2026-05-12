import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions, Public } from '../auth/decorators/public.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { DealerSupportService } from './dealer-support.service';

@ApiTags('public')
@Controller('public')
export class DealerSupportPublicController {
  constructor(private readonly dealerSupportService: DealerSupportService) {}

  @Public()
  @Get('dealer-support')
  @Header('Cache-Control', 'no-store, must-revalidate')
  @ApiOperation({
    summary: 'Nội dung Trung tâm hỗ trợ đại lý (JSON)',
    description:
      'Gộp ghi đè từ DB với mặc định package @workspace/dealer-support — dùng cho storefront.',
  })
  getDealerSupport() {
    return this.dealerSupportService.getMerged();
  }
}

@ApiTags('admin')
@Controller('admin/dealer-support')
@UseGuards(PermissionsGuard)
@ApiHeader({ name: 'X-User-Id', required: false })
export class DealerSupportAdminController {
  constructor(private readonly dealerSupportService: DealerSupportService) {}

  @Get()
  @Permissions(PERMISSIONS.SUPPORT_READ)
  @ApiOperation({
    summary: 'Nội dung hỗ trợ đại lý (chỉnh sửa)',
    description: 'defaults + overrides đã lưu + bản gộp hiển thị.',
  })
  getEditorPayload() {
    return this.dealerSupportService.getAdminPayload();
  }

  @Put()
  @Permissions(PERMISSIONS.SUPPORT_WRITE)
  @ApiOperation({
    summary: 'Lưu toàn bộ nội dung hiển thị (gộp)',
    description:
      'Body là object cùng dạng GET /public/dealer-support — API chỉ lưu phần khác mặc định.',
  })
  putMerged(@Body() body: unknown) {
    return this.dealerSupportService.saveMerged(body);
  }

  @Post('reset')
  @Permissions(PERMISSIONS.SUPPORT_WRITE)
  @ApiOperation({ summary: 'Xóa ghi đè, dùng lại toàn bộ mặc định từ code' })
  resetOverrides() {
    return this.dealerSupportService.resetOverrides();
  }
}
