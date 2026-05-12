import { Module, forwardRef } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { SocketModule } from '../socket/socket.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [NotificationsModule, forwardRef(() => SocketModule)],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
