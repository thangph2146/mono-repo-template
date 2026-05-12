import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [NotificationsModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
