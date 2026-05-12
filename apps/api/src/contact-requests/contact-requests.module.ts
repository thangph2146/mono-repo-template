import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ContactRequestsService } from './contact-requests.service';
import { ContactRequestsController } from './contact-requests.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [ContactRequestsController],
  providers: [ContactRequestsService],
  exports: [ContactRequestsService],
})
export class ContactRequestsModule {}
