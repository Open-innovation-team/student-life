import { Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AccountService } from './account.service';

@Controller('api/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /**
   * Génère un export ZIP des données de l'utilisateur connecté et renvoie un
   * lien de téléchargement sécurisé valable 24h (portabilité RGPD).
   * Limité (chaque appel écrit un ZIP sur disque) → anti-spam d'export.
   */
  @Post('export')
  @UseGuards(SessionGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  createExport(@CurrentUser() user: SessionUser) {
    return this.accountService.createExport(user.id);
  }

  /**
   * Téléchargement du ZIP via le token (le token fait foi, le lien peut être
   * ouvert directement dans un navigateur). Lien à usage unique : il est
   * invalidé (enregistrement + fichier supprimés) après un download réussi.
   */
  @Get('export/:token')
  async download(@Param('token') token: string, @Res() res: Response) {
    const { path, filename } =
      await this.accountService.getExportByToken(token);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const stream = createReadStream(path);
    // Invalidation usage unique uniquement si le téléchargement aboutit
    // (on n'efface pas l'export si le client coupe la connexion en cours).
    res.on('finish', () => {
      void this.accountService.invalidateExport(token);
    });
    stream.pipe(res);
  }
}
