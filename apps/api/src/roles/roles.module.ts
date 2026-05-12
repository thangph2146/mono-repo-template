import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SocketModule } from '../socket/socket.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [NotificationsModule, SocketModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
