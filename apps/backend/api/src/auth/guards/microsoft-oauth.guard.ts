import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/**
 * Guard OAuth Microsoft qui transporte le `redirect_uri` fourni par le client
 * (mobile) dans le `state` OAuth. Voir GoogleOAuthGuard pour le detail :
 * le state revient en `req.query.state` au callback. Web inchange.
 */
@Injectable()
export class MicrosoftOAuthGuard extends AuthGuard('microsoft') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const redirectUri = request.query.redirect_uri;
    return typeof redirectUri === 'string' ? { state: redirectUri } : {};
  }
}
