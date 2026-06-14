import { Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
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
   */
  @Post('export')
  @UseGuards(SessionGuard)
  createExport(@CurrentUser() user: SessionUser) {
    return this.accountService.createExport(user.id);
  }

  /**
   * Téléchargement du ZIP via le token (pas de session : le token fait foi,
   * le lien peut être ouvert directement dans un navigateur).
   */
  @Get('export/:token')
  async download(@Param('token') token: string, @Res() res: Response) {
    const { path, filename } =
      await this.accountService.getExportByToken(token);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    createReadStream(path).pipe(res);
  }
}
