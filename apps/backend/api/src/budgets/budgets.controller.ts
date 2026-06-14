import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { BudgetsService } from './budgets.service';
import { UpsertBudgetDto } from './dto/upsert-budget.dto';
import { MonthQueryDto } from './dto/month-query.dto';

@Controller('api/budgets')
@UseGuards(SessionGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser, @Query() query: MonthQueryDto) {
    return this.budgetsService.list(user.id, query.month);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: SessionUser, @Query() query: MonthQueryDto) {
    return this.budgetsService.dashboard(user.id, query.month);
  }

  @Put()
  upsert(@CurrentUser() user: SessionUser, @Body() dto: UpsertBudgetDto) {
    return this.budgetsService.upsert(
      user.id,
      dto.month,
      dto.category ?? null,
      dto.amountCents,
    );
  }

  @Get('export')
  async export(
    @CurrentUser() user: SessionUser,
    @Query() query: MonthQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.budgetsService.exportCsv(user.id, query.month);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="depenses-${query.month}.csv"`,
    );
    res.send(csv);
  }
}
