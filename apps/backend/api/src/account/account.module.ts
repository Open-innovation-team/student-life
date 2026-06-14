import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { ExportPurgeService } from './export-purge.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, ExportPurgeService],
})
export class AccountModule {}
