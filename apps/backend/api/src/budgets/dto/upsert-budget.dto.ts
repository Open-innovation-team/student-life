import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertBudgetDto {
  @Matches(/^\d{4}-\d{2}$/, { message: 'month doit être au format YYYY-MM' })
  month!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsInt()
  @Min(0)
  @Max(100_000_000)
  amountCents!: number;
}
