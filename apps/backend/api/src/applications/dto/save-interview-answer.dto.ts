import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveInterviewAnswerDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  answer?: string;
}
