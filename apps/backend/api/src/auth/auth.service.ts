import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser, JwtPayload, OAuthProfile } from './auth.types';

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Coeur de la connexion OAuth : a partir d'un profil fournisseur,
   * retourne le User correspondant en respectant 3 cas, sans jamais
   * creer de doublon :
   *  1. le compte provider est deja lie  -> on renvoie son User ;
   *  2. un User a deja cet email         -> on lie le compte au User existant ;
   *  3. aucun User                       -> on cree User + compte provider.
   */
  async validateOAuthLogin(profile: OAuthProfile): Promise<AuthenticatedUser> {
    if (!profile.email) {
      throw new UnauthorizedException(
        "Le fournisseur OAuth n'a pas communique d'adresse email.",
      );
    }

    // Cas 1 : compte provider deja connu.
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });
    if (existingAccount) {
      return this.toAuthUser(existingAccount.user);
    }

    // Cas 2 : un User existe deja avec cet email -> on rattache le compte.
    const userByEmail = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (userByEmail) {
      await this.prisma.oAuthAccount.create({
        data: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          userId: userByEmail.id,
        },
      });
      this.logger.log(
        `Compte ${profile.provider} lie au User existant ${userByEmail.id}`,
      );
      return this.toAuthUser(userByEmail);
    }

    // Cas 3 : creation automatique du compte.
    const created = await this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        accounts: {
          create: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
      },
    });
    this.logger.log(
      `Nouveau User cree via ${profile.provider} : ${created.id}`,
    );
    return this.toAuthUser(created);
  }

  /**
   * Bypass de connexion reserve au developpement : find-or-create d'un User
   * par email (sans OAuth) puis emission de vrais tokens. Active uniquement
   * quand DEV_AUTH_BYPASS=true (verifie cote controller).
   */
  async devLogin(email: string): Promise<IssuedTokens> {
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { email, name: 'Dev User' },
      });
      this.logger.warn(`[DEV] User de test cree : ${user.id} (${email})`);
    }
    return this.issueTokens(this.toAuthUser(user));
  }

  /** Emet un JWT d'acces court + un refresh token (hash stocke en base). */
  async issueTokens(user: AuthenticatedUser): Promise<IssuedTokens> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m',
    } as JwtSignOptions);

    const refreshToken = randomBytes(48).toString('hex');
    const refreshDays = Number(
      this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS') ?? '30',
    );
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Echange un refresh token valide contre un nouveau couple de tokens.
   * Rotation : l'ancien refresh token est revoque a l'usage.
   */
  async refresh(rawRefreshToken: string): Promise<IssuedTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawRefreshToken) },
      include: { user: true },
    });

    if (
      !stored ||
      stored.revokedAt !== null ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Refresh token invalide ou expire.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(this.toAuthUser(stored.user));
  }

  /** Hash SHA-256 : on ne stocke jamais le refresh token en clair. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toAuthUser(user: { id: string; email: string }): AuthenticatedUser {
    return { id: user.id, email: user.email };
  }
}
