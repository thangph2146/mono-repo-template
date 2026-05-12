import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicPostsService } from './public-posts.service';
import { PublicCategoriesService } from './public-categories.service';
import { PublicContactRequestsService } from './public-contact-requests.service';

import { AdmissionResultsModule } from '../admission-results/admission-results.module';
import { PageContentsModule } from '../page-contents/page-contents.module';

@Module({
  imports: [AdmissionResultsModule, PageContentsModule],
  controllers: [PublicController],
  providers: [
    PublicPostsService,
    PublicCategoriesService,
    PublicContactRequestsService,
  ],
})
export class PublicModule {}
