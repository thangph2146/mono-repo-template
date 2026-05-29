import { Module } from '@nestjs/common';
import { FaceDataController } from './face-data.controller';
import { FaceDataService } from './face-data.service';

@Module({
  controllers: [FaceDataController],
  providers: [FaceDataService],
  exports: [FaceDataService],
})
export class FaceDataModule {}
