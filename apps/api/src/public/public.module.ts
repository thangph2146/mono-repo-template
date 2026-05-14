import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicPostsService } from './public-posts.service';
import { PublicCategoriesService } from './public-categories.service';
import { PublicContactRequestsService } from './public-contact-requests.service';
import { PublicAuthService } from './public-auth.service';

import { AdmissionResultsModule } from '../admission-results/admission-results.module';
import { PageContentsModule } from '../page-contents/page-contents.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AdmissionResultsModule,
    PageContentsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [PublicController],
  providers: [
    PublicPostsService,
    PublicCategoriesService,
    PublicContactRequestsService,
    PublicAuthService,
  ],
})
export class PublicModule {}
