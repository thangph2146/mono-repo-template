import { Module } from '@nestjs/common';
import { EventSpeakersController } from './event-speakers.controller';
import { EventSpeakersService } from './event-speakers.service';

@Module({
  controllers: [EventSpeakersController],
  providers: [EventSpeakersService],
  exports: [EventSpeakersService],
})
export class EventSpeakersModule {}
