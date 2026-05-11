import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { Order, Product } from '../entities';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([Order, Product]),
    AuthModule,
    UsersModule,
    PromoCodesModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
