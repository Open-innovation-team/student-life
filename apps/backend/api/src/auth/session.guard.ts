import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { auth } from '../lib/auth';

export type SessionUser = { id: string; email: string; name: string };

type AuthedRequest = Request & { user?: SessionUser };

@Injectable()
export class SessionGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: req.headers.cookie ?? '',
        authorization: req.headers.authorization ?? '',
      }),
    });
    if (!session?.user) throw new UnauthorizedException();
    req.user = session.user as SessionUser;
    return true;
  }
}
