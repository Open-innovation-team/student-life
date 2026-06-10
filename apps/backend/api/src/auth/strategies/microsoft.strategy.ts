import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { OAuthProfile } from '../auth.types';

interface MicrosoftProfile {
  id: string;
  displayName?: string;
  emails?: { value: string }[];
  _json?: { mail?: string; userPrincipalName?: string };
}

type DoneCallback = (err: unknown, user?: OAuthProfile) => void;

/**
 * Strategy OAuth 2.0 Microsoft (Azure AD, endpoint multi-tenant "common").
 * Declenchee par GET /auth/microsoft et GET /auth/microsoft/callback.
 */
@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('MICROSOFT_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('MICROSOFT_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('MICROSOFT_CALLBACK_URL'),
      tenant: config.get<string>('MICROSOFT_TENANT') ?? 'common',
      scope: ['user.read'],
    });
  }

  /** Normalise le profil Microsoft puis le passe a Passport (-> req.user). */
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: MicrosoftProfile,
    done: DoneCallback,
  ): void {
    const email =
      profile.emails?.[0]?.value ??
      profile._json?.mail ??
      profile._json?.userPrincipalName ??
      '';
    const normalized: OAuthProfile = {
      provider: 'MICROSOFT',
      providerAccountId: profile.id,
      email,
      name: profile.displayName,
    };
    done(null, normalized);
  }
}
