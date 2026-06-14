import { IsIn, IsOptional } from 'class-validator';
import type { ExpenseSort, SortOrder } from '../expenses.service';

export class ListExpensesQueryDto {
  @IsOptional()
  @IsIn(['date', 'amount', 'category'])
  sort: ExpenseSort = 'date';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: SortOrder = 'desc';
}
