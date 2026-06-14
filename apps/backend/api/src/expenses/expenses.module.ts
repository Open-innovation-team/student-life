import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [ExpensesController, CategoriesController],
  providers: [ExpensesService, CategoriesService],
})
export class ExpensesModule {}
