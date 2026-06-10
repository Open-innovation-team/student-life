import { IsEmail, IsOptional } from 'class-validator';

/**
 * Corps optionnel de POST /auth/dev-login (bypass de connexion en dev).
 * Sans email fourni, le backend utilise un compte de test par defaut.
 */
export class DevLoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}
