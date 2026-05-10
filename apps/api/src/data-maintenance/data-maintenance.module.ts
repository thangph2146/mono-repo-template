import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BackupSecretGuard } from './backup-secret.guard';
import { DataBackupService } from './data-backup.service';
import { DataExcelService } from './data-excel.service';
import { DataMaintenanceController } from './data-maintenance.controller';

@Module({
  imports: [AuthModule],
  controllers: [DataMaintenanceController],
  providers: [DataBackupService, DataExcelService, BackupSecretGuard],
})
export class DataMaintenanceModule {}
