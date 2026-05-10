import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { AuthModule } from '../auth/auth.module';
import { RbacController } from './rbac.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Permission, Role]), AuthModule],
  controllers: [RbacController],
})
export class RbacModule {}
