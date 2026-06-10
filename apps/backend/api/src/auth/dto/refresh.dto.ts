import { IsString, MinLength } from 'class-validator';

/** Corps attendu par POST /auth/refresh. */
export class RefreshDto {
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
