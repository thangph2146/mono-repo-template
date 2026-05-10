import {
  BadRequestException,
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
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService, type CreateOrderDto } from './orders.service';
import { Order, OrderStatus } from '../entities';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Public, Permissions } from '../auth/decorators/public.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';

interface ActorPayload {
  actor?: string;
}

@ApiTags('orders')
@Controller('orders')
@UseGuards(PermissionsGuard)
@ApiHeader({ name: 'X-User-Id', required: false })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'List orders (staff); ?email= lọc theo khách' })
  async findAll(@Query('email') email?: string): Promise<Order[]> {
    if (email) return this.ordersService.findByCustomerEmail(email);
    return this.ordersService.findAll();
  }

  @Get('customer/:customerId')
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'Get orders by customer id' })
  async findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
  ): Promise<Order[]> {
    return this.ordersService.findByCustomer(customerId);
  }

  @Get('status/:status')
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'Get orders by status' })
  async findByStatus(@Param('status') status: OrderStatus): Promise<Order[]> {
    return this.ordersService.findByStatus(status);
  }

  @Get('dispatch/shippers')
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({
    summary: 'Danh sách nhân viên shipper (gán đơn)',
  })
  async listShippers(): Promise<
    Array<{ id: number; email: string; fullName: string }>
  > {
    return this.ordersService.listShippers();
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ORDERS_READ)
  @ApiOperation({ summary: 'Get order by id' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Create a new order from cart (server validates stock & price)',
  })
  @ApiResponse({ status: 201, description: 'Order created' })
  async create(@Body() body: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({ summary: 'Update an order (admin)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() orderData: Partial<Order>,
  ): Promise<Order> {
    return this.ordersService.update(id, orderData);
  }

  @Put(':id/assign-shipper')
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({
    summary:
      'Chỉ định shipper giao hàng (user phải có role shipper); null để bỏ gán',
  })
  async assignShipper(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { shipperUserId?: number | null },
  ): Promise<Order> {
    const raw = body?.shipperUserId;
    if (raw === null || raw === undefined) {
      return this.ordersService.assignShipper(id, null);
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      throw new BadRequestException('shipperUserId không hợp lệ');
    }
    return this.ordersService.assignShipper(id, n);
  }

  @Put(':id/status')
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({ summary: 'Update order status (generic transition)' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: OrderStatus; actor?: string },
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, body.status, body.actor);
  }

  @Post(':id/confirm-shipped')
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({
    summary: 'Warehouse staff confirms the order has left the warehouse',
  })
  async confirmShipped(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActorPayload = {},
  ): Promise<Order> {
    return this.ordersService.confirmShipped(id, body.actor);
  }

  @Post(':id/confirm-delivered')
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({
    summary: 'Delivery staff confirms goods delivered & cash collected (COD)',
  })
  async confirmDelivered(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActorPayload = {},
  ): Promise<Order> {
    return this.ordersService.confirmDelivered(id, body.actor);
  }

  @Post(':id/cancel')
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({ summary: 'Cancel an order and restore stock' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActorPayload = {},
  ): Promise<Order> {
    return this.ordersService.cancel(id, body.actor);
  }

  @Post(':id/reopen-from-cancelled')
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({
    summary:
      'Mở lại đơn đã huỷ về Chờ xử lý (trừ tồn kho lại, reset thanh toán / giao)',
  })
  async reopenFromCancelled(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ActorPayload = {},
  ): Promise<Order> {
    return this.ordersService.reopenCancelled(id, body.actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(PERMISSIONS.ORDERS_WRITE)
  @ApiOperation({ summary: 'Delete an order (admin)' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.ordersService.delete(id);
  }
}
