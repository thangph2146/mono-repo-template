import { Module } from '@nestjs/common';
import { ProxyImageController } from './proxy-image.controller';

@Module({
  controllers: [ProxyImageController],
})
export class ProxyImageModule {}
