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
import { ProductsService, type AdjustStockDto } from './products.service';
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
  async findAll(@Query('active') active?: string): Promise<Product[]> {
    return this.productsService.findAll({ activeOnly: active === 'true' });
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.PRODUCTS_WRITE)
  @ApiOperation({ summary: 'Delete a product' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productsService.delete(id);
  }
}
