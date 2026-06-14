import { IsOptional, Matches } from 'class-validator';
import { currentMonth } from '../month.util';

export class MonthQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month doit être au format YYYY-MM' })
  month: string = currentMonth();
}
