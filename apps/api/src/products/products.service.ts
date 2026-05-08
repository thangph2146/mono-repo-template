import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, type RequiredEntityData } from '@mikro-orm/core';
import { Product } from '../entities';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: EntityRepository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ id });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productRepository.findOne({ sku });
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.productRepository.find({ category });
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(
      productData as RequiredEntityData<Product>,
    );
    await this.productRepository.getEntityManager().persistAndFlush(product);
    return product;
  }

  async update(id: number, productData: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id);
    this.productRepository.assign(product, productData);
    await this.productRepository.getEntityManager().flush();
    return product;
  }

  async delete(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.getEntityManager().removeAndFlush(product);
  }
}
