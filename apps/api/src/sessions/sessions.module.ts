import { Module, forwardRef } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { SocketModule } from '../socket/socket.module';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [NotificationsModule, forwardRef(() => SocketModule)],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
