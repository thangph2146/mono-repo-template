import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthModule } from '../auth/auth.module';
import { DealerSupportContent } from '../entities/dealer-support-content.entity';
import { DealerSupportService } from './dealer-support.service';
import {
  DealerSupportAdminController,
  DealerSupportPublicController,
} from './dealer-support.controllers';

@Module({
  imports: [MikroOrmModule.forFeature([DealerSupportContent]), AuthModule],
  providers: [DealerSupportService],
  controllers: [DealerSupportPublicController, DealerSupportAdminController],
})
export class DealerSupportModule {}
