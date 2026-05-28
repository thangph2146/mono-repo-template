import { Module } from '@nestjs/common';
import { TrainingLevelsController } from './training-levels.controller';
import { TrainingLevelsService } from './training-levels.service';

@Module({
  controllers: [TrainingLevelsController],
  providers: [TrainingLevelsService],
  exports: [TrainingLevelsService],
})
export class TrainingLevelsModule {}
