import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ProductsService,
  type AdjustStockDto,
  type ProductListOptions,
  type ProductListStockBand,
} from './products.service';
import { Product } from '../entities';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Public, Permissions } from '../auth/decorators/public.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';

@ApiTags('products')
@Controller('products')
@UseGuards(PermissionsGuard)
@ApiHeader({ name: 'X-User-Id', required: false })
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List products' })
  async findAll(
    @Query('active') active?: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('brandEmpty') brandEmpty?: string,
    @Query('isActive') isActive?: string,
    @Query('q') q?: string,
    @Query('stock') stock?: string,
    @Query('retailPrice') retailPrice?: string,
    @Query('stockBand') stockBand?: string,
    @Query('purchaseMode') purchaseModeRaw?: string,
    @Query('unitType') unitType?: string,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
  ): Promise<Product[] | { items: Product[]; total: number }> {
    const band: ProductListStockBand | undefined =
      stockBand === 'ok' || stockBand === 'low' || stockBand === 'out'
        ? stockBand
        : undefined;
    const stockN =
      stock !== undefined && stock !== '' ? Number(stock) : undefined;
    const priceN =
      retailPrice !== undefined && retailPrice !== ''
        ? Number(retailPrice)
        : undefined;
    const purchaseMode =
      purchaseModeRaw === 'si' || purchaseModeRaw === 'le'
        ? purchaseModeRaw
        : undefined;
    const listOpts: ProductListOptions = {
      activeOnly: active === 'true',
      category: category?.trim() || undefined,
      brand: brand?.trim() || undefined,
      brandEmpty: brandEmpty === 'true',
      isActive:
        isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      q: q?.trim() || undefined,
      stock:
        stockN !== undefined && Number.isFinite(stockN) ? stockN : undefined,
      retailPrice:
        priceN !== undefined && Number.isFinite(priceN) ? priceN : undefined,
      stockBand: band,
      purchaseMode,
      unitType: unitType?.trim() || undefined,
    };
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
      return this.productsService.findPage({
        ...listOpts,
        page,
        limit,
      });
    }
    return this.productsService.findAll(listOpts);
  }

  @Get('sku/:sku')
  @Public()
  @ApiOperation({ summary: 'Get a product by SKU' })
  async findBySku(@Param('sku') sku: string): Promise<Product | null> {
    return this.productsService.findBySku(sku);
  }

  @Get('category/:category')
  @Public()
  @ApiOperation({ summary: 'Get products by category slug' })
  async findByCategory(
    @Param('category') category: string,
  ): Promise<Product[]> {
    return this.productsService.findByCategory(category);
  }

  @Get('trashed')
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Sản phẩm đã xóa tạm (thùng rác)' })
  async listTrashed(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('q') q?: string,
  ): Promise<{ items: Product[]; total: number }> {
    const page =
      pageStr !== undefined && pageStr !== ''
        ? parseInt(pageStr, 10)
        : undefined;
    const limit =
      limitStr !== undefined && limitStr !== ''
        ? parseInt(limitStr, 10)
        : undefined;
    return this.productsService.listTrashed({
      page,
      limit,
      q: q?.trim() || undefined,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by id' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Create a new product' })
  async create(@Body() productData: Partial<Product>): Promise<Product> {
    return this.productsService.create(productData);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Update a product' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() productData: Partial<Product>,
  ): Promise<Product> {
    return this.productsService.update(id, productData);
  }

  @Patch(':id/stock')
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({
    summary: 'Adjust stock by a delta (positive inbound, negative outbound)',
  })
  async adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdjustStockDto,
  ): Promise<Product> {
    return this.productsService.adjustStock(id, dto);
  }

  @Post(':id/restore')
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Khôi phục sản phẩm từ thùng rác (xóa tạm)' })
  async restore(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.restore(id);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({
    summary: 'Xóa vĩnh viễn sản phẩm (chỉ khi đang trong thùng rác)',
  })
  async purgeTrashed(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productsService.purgeTrashed(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Xóa tạm sản phẩm (đưa vào thùng rác)' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productsService.delete(id);
  }
}
