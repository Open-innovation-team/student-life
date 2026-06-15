import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountService } from './account.service';

/**
 * Purge planifiée des exports RGPD expirés : les ZIP créés puis jamais
 * téléchargés ne sont sinon supprimés qu'au prochain accès, et s'accumulent
 * sur le disque (PII au repos + saturation). On nettoie automatiquement.
 */
@Injectable()
export class ExportPurgeService {
  private readonly logger = new Logger(ExportPurgeService.name);

  constructor(private readonly accountService: AccountService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async purge(): Promise<void> {
    const deleted = await this.accountService.purgeExpiredExports();
    if (deleted > 0) {
      this.logger.log(
        `Purge des exports RGPD expirés : ${deleted} supprimé(s)`,
      );
    }
  }
}
