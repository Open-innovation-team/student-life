import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * Guard OAuth Google qui transporte le `redirect_uri` fourni par le client
 * (mobile) dans le `state` OAuth. Le state est round-trippe par le provider
 * et revient en `req.query.state` au callback, ou le controller l'utilise
 * comme cible de redirection. Sans `redirect_uri`, comportement web inchange.
 */
@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const redirectUri = request.query.redirect_uri;
    return typeof redirectUri === 'string' ? { state: redirectUri } : {};
  }
}
