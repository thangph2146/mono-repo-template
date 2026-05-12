import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { PublicUploadsController } from './public-uploads.controller';

@Module({
  controllers: [UploadsController, PublicUploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
