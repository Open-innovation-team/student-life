import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard a poser sur les routes necessitant un JWT d'acces valide. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
