import { Module } from '@nestjs/common';
import { EventCheckinsController } from './event-checkins.controller';
import { EventCheckinsService } from './event-checkins.service';

@Module({
  controllers: [EventCheckinsController],
  providers: [EventCheckinsService],
  exports: [EventCheckinsService],
})
export class EventCheckinsModule {}
