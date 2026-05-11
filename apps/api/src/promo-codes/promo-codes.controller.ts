import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PromoRulePublic } from '@workspace/promo-codes';
import { PromoCode } from '../entities/promo-code.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Public, Permissions } from '../auth/decorators/public.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './promo-codes.dto';
import { PromoCodesService } from './promo-codes.service';

@ApiTags('promo-codes')
@Controller('promo-codes')
@UseGuards(PermissionsGuard)
@ApiHeader({ name: 'X-User-Id', required: false })
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Get('public')
  @Public()
  @ApiOperation({
    summary:
      'Danh sách mã đang hiệu lực (tối giản — dùng áp giảm trên storefront)',
  })
  async publicList(): Promise<PromoRulePublic[]> {
    return this.promoCodesService.getActiveRulesForCheckout();
  }

  @Get()
  @Permissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'Danh sách mã (admin), phân trang + tìm' })
  async findAll(
    @Query('q') q?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<PromoCode[] | { items: PromoCode[]; total: number }> {
    const page =
      pageStr !== undefined && pageStr !== ''
        ? parseInt(pageStr, 10)
        : Number.NaN;
    const limit =
      limitStr !== undefined && limitStr !== ''
        ? parseInt(limitStr, 10)
        : Number.NaN;
    if (
      Number.isFinite(page) &&
      Number.isFinite(limit) &&
      page >= 1 &&
      limit >= 1 &&
      limit <= 200
    ) {
      return this.promoCodesService.findAdminPage({
        q: q?.trim() || undefined,
        page,
        limit,
      });
    }
    return this.promoCodesService.findAdminPage({
      q: q?.trim() || undefined,
      page: 1,
      limit: 500,
    });
  }

  @Get(':id')
  @Permissions(PERMISSIONS.PRODUCTS_READ)
  @ApiOperation({ summary: 'Chi tiết một mã' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PromoCode> {
    return this.promoCodesService.findOne(id);
  }

  @Post()
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Tạo mã mới' })
  async create(@Body() dto: CreatePromoCodeDto): Promise<PromoCode> {
    return this.promoCodesService.create(dto);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Cập nhật mã' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromoCodeDto,
  ): Promise<PromoCode> {
    return this.promoCodesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Xóa mã' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.promoCodesService.remove(id);
  }
}
