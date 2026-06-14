import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

const prisma = new PrismaClient();

const EXPENSE_SELECT = {
  id: true,
  amountCents: true,
  category: true,
  label: true,
  date: true,
};

export type ExpenseSort = 'date' | 'amount' | 'category';
export type SortOrder = 'asc' | 'desc';

const SORT_FIELDS: Record<ExpenseSort, string> = {
  date: 'date',
  amount: 'amountCents',
  category: 'category',
};

@Injectable()
export class ExpensesService {
  async create(userId: string, dto: CreateExpenseDto) {
    return prisma.expense.create({
      data: {
        userId,
        amountCents: dto.amountCents,
        category: dto.category,
        label: dto.label?.trim() || null,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
      select: EXPENSE_SELECT,
    });
  }

  async list(userId: string, sort: ExpenseSort, order: SortOrder) {
    return prisma.expense.findMany({
      where: { userId },
      orderBy: { [SORT_FIELDS[sort]]: order },
      select: EXPENSE_SELECT,
    });
  }

  async today(userId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: 'desc' },
      select: EXPENSE_SELECT,
    });
    const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0);
    return { expenses, totalCents };
  }

  async update(id: string, userId: string, dto: UpdateExpenseDto) {
    await this.findOwned(id, userId);

    const data: {
      amountCents?: number;
      category?: string;
      label?: string | null;
      date?: Date;
    } = {};
    if (dto.amountCents !== undefined) data.amountCents = dto.amountCents;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.label !== undefined) data.label = dto.label.trim() || null;
    if (dto.date !== undefined) data.date = new Date(dto.date);

    return prisma.expense.update({
      where: { id },
      data,
      select: EXPENSE_SELECT,
    });
  }

  async delete(id: string, userId: string) {
    await this.findOwned(id, userId);
    await prisma.expense.delete({ where: { id } });
    return { deleted: true };
  }

  private async findOwned(id: string, userId: string) {
    const expense = await prisma.expense.findFirst({ where: { id, userId } });
    if (!expense) throw new NotFoundException('Dépense introuvable');
    return expense;
  }
}
