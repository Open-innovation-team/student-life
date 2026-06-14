import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BudgetsService } from '../budgets/budgets.service';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesQueryDto } from './dto/list-expenses-query.dto';

@Controller('api/expenses')
@UseGuards(SessionGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly budgetsService: BudgetsService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateExpenseDto,
  ) {
    const expense = await this.expensesService.create(user.id, dto);
    const alert = await this.budgetsService.evaluateAlert(
      user.id,
      expense.category,
      expense.date,
      expense.amountCents,
    );
    return { ...expense, alert };
  }

  @Get()
  list(@CurrentUser() user: SessionUser, @Query() query: ListExpensesQueryDto) {
    return this.expensesService.list(user.id, query.sort, query.order);
  }

  @Get('today')
  today(@CurrentUser() user: SessionUser) {
    return this.expensesService.today(user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, user.id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.expensesService.delete(id, user.id);
  }
}
