import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { AuthenticatedUser, OAuthProfile } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { DevLoginDto } from './dto/dev-login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MicrosoftOAuthGuard } from './guards/microsoft-oauth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // --- Google -------------------------------------------------------------

  /** Redirige le navigateur vers l'ecran de consentement Google. */
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleLogin(): void {
    // Le guard declenche la redirection : ce corps n'est jamais execute.
  }

  /** Callback OAuth Google. */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.completeOAuth(req, res);
  }

  // --- Microsoft ----------------------------------------------------------

  /** Redirige le navigateur vers l'ecran de consentement Microsoft. */
  @Get('microsoft')
  @UseGuards(MicrosoftOAuthGuard)
  microsoftLogin(): void {
    // Idem : redirection geree par le guard.
  }

  /** Callback OAuth Microsoft. */
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.completeOAuth(req, res);
  }

  // --- Sessions -----------------------------------------------------------

  /** Echange un refresh token contre un nouveau couple de tokens. */
  @Post('refresh')
  refresh(@Body() dto: RefreshDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return this.authService.refresh(dto.refreshToken);
  }

  /** Retourne l'utilisateur courant (route protegee, exemple d'usage du JWT). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  /**
   * Bypass de connexion pour le DEVELOPPEMENT uniquement : emet de vrais
   * tokens pour un compte de test, sans passer par OAuth. Desactive (404)
   * tant que DEV_AUTH_BYPASS !== 'true'. A retirer / laisser off en prod.
   */
  @Post('dev-login')
  devLogin(@Body() dto: DevLoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    if (this.config.get<string>('DEV_AUTH_BYPASS') !== 'true') {
      throw new NotFoundException();
    }
    return this.authService.devLogin(dto.email ?? 'dev@studentlife.local');
  }

  /**
   * Logique commune aux callbacks : find-or-create du User, emission des
   * tokens, puis redirection vers le client avec les tokens en query string.
   * La cible depend du `state` round-trippe : deep link mobile valide, sinon
   * FRONTEND_CALLBACK_URL (web).
   */
  private async completeOAuth(req: Request, res: Response): Promise<void> {
    const profile = req.user as OAuthProfile;
    const user = await this.authService.validateOAuthLogin(profile);
    const tokens = await this.authService.issueTokens(user);

    const state =
      typeof req.query.state === 'string' ? req.query.state : undefined;
    const redirectUrl = new URL(this.resolveRedirectTarget(state));
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
    res.redirect(redirectUrl.toString());
  }

  /**
   * Determine ou rediriger apres un login OAuth.
   * - Pas de `state` -> FRONTEND_CALLBACK_URL (flux web).
   * - `state` present -> autorise seulement s'il commence par un prefixe de
   *   OAUTH_ALLOWED_REDIRECT_PREFIXES (deep links mobile). Sinon fallback web,
   *   pour empecher tout open-redirect arbitraire.
   */
  private resolveRedirectTarget(state?: string): string {
    const fallback = this.config.getOrThrow<string>('FRONTEND_CALLBACK_URL');
    if (!state) return fallback;

    const allowed = (
      this.config.get<string>('OAUTH_ALLOWED_REDIRECT_PREFIXES') ?? ''
    )
      .split(',')
      .map((prefix) => prefix.trim())
      .filter(Boolean);

    return allowed.some((prefix) => state.startsWith(prefix))
      ? state
      : fallback;
  }
}
