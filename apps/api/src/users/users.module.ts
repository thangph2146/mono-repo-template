import { Module, forwardRef } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SocketModule } from '../socket/socket.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    NotificationsModule,
    forwardRef(() => SocketModule),
    forwardRef(() => SessionsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
