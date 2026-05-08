import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, type RequiredEntityData } from '@mikro-orm/core';
import { Order, OrderStatus } from '../entities';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: EntityRepository<Order>,
  ) {}

  async findAll(): Promise<Order[]> {
    return this.orderRepository.findAll<'customer'>({
      populate: ['customer'],
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne<'customer'>(
      { id },
      { populate: ['customer'] },
    );
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async findByCustomer(customerId: number): Promise<Order[]> {
    return this.orderRepository.find<'customer'>(
      { customer: customerId },
      { populate: ['customer'] },
    );
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find<'customer'>(
      { status },
      { populate: ['customer'] },
    );
  }

  async create(orderData: Partial<Order>): Promise<Order> {
    const order = this.orderRepository.create({
      ...orderData,
      orderNumber: this.generateOrderNumber(),
    } as RequiredEntityData<Order>);
    await this.orderRepository.getEntityManager().persistAndFlush(order);
    return order;
  }

  async updateStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    await this.orderRepository.getEntityManager().flush();
    return order;
  }

  async update(id: number, orderData: Partial<Order>): Promise<Order> {
    const order = await this.findOne(id);
    this.orderRepository.assign(order, orderData);
    await this.orderRepository.getEntityManager().flush();
    return order;
  }

  async delete(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.getEntityManager().removeAndFlush(order);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}${random}`;
  }
}
