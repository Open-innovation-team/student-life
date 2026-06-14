import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { APPLICATION_STATUSES } from '../statuses';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  company!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  position!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  platform?: string;

  @IsOptional()
  @IsIn(APPLICATION_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  sentAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsString()
  cvDocumentId?: string;

  @IsOptional()
  @IsString()
  lmDocumentId?: string;
}
