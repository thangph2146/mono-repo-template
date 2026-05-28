import { Module } from '@nestjs/common';
import { ImportedUsersController } from './imported-users.controller';
import { ImportedUsersService } from './imported-users.service';

@Module({
  controllers: [ImportedUsersController],
  providers: [ImportedUsersService],
  exports: [ImportedUsersService],
})
export class ImportedUsersModule {}
