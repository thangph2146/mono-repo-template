import { Module } from '@nestjs/common';
import { ParentStudentsService } from './parent-students.service';
import {
  ParentStudentsPublicController,
  ParentStudentsAdminController,
} from './parent-students.controller';

@Module({
  controllers: [ParentStudentsPublicController, ParentStudentsAdminController],
  providers: [ParentStudentsService],
  exports: [ParentStudentsService],
})
export class ParentStudentsModule {}
