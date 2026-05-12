import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DealerSupportModule } from './dealer-support/dealer-support.module';
import { RbacModule } from './rbac/rbac.module';
import {
  getMikroOrmConfig,
  getMikroOrmDriverClassForNest,
} from './config/database.config';
import { PERSISTENT_ENTITY_CLASSES } from './entities';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { DataMaintenanceModule } from './data-maintenance/data-maintenance.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { LoggerModule } from './common/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '..', '.env'),
        join(process.cwd(), '.env'),
      ],
    }),
    LoggerModule,
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      driver: getMikroOrmDriverClassForNest(),
      useFactory: (configService: ConfigService) =>
        getMikroOrmConfig(configService),
      inject: [ConfigService],
    }),
    MikroOrmModule.forFeature([...PERSISTENT_ENTITY_CLASSES]),
    ProductsModule,
    OrdersModule,
    UsersModule,
    CategoriesModule,
    DataMaintenanceModule,
    PromoCodesModule,
    RbacModule,
    DealerSupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
