import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { formatMonthOf, monthRange, previousMonth } from './month.util';

const prisma = new PrismaClient();

type ExpenseRow = { category: string; amountCents: number; date: Date };

export type BudgetAlert = {
  category: string;
  level: 'warning' | 'exceeded';
  spentCents: number;
  budgetCents: number;
};

function sumByCategory(expenses: { category: string; amountCents: number }[]) {
  const totals = new Map<string, number>();
  for (const { category, amountCents } of expenses) {
    totals.set(category, (totals.get(category) ?? 0) + amountCents);
  }
  return totals;
}

function sumCents(expenses: { amountCents: number }[]) {
  return expenses.reduce((total, e) => total + e.amountCents, 0);
}

function weeklyBreakdown(expenses: ExpenseRow[], start: Date, end: Date) {
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  const weeks = Math.ceil(days / 7);
  const totals = new Array<number>(weeks).fill(0);
  for (const { date, amountCents } of expenses) {
    const index = Math.min(
      weeks - 1,
      Math.ceil(new Date(date).getDate() / 7) - 1,
    );
    totals[index] += amountCents;
  }
  return totals.map((amountCents, i) => ({ week: i + 1, amountCents }));
}

@Injectable()
export class BudgetsService {
  list(userId: string, month: string) {
    return prisma.budget.findMany({
      where: { userId, month },
      select: { id: true, category: true, amountCents: true },
    });
  }

  async upsert(
    userId: string,
    month: string,
    category: string | null,
    amountCents: number,
  ) {
    if (amountCents <= 0) {
      await prisma.budget.deleteMany({ where: { userId, month, category } });
      return { deleted: true };
    }
    const existing = await prisma.budget.findFirst({
      where: { userId, month, category },
    });
    if (existing) {
      return prisma.budget.update({
        where: { id: existing.id },
        data: { amountCents },
        select: { id: true, category: true, amountCents: true },
      });
    }
    return prisma.budget.create({
      data: { userId, month, category, amountCents },
      select: { id: true, category: true, amountCents: true },
    });
  }

  async dashboard(userId: string, month: string) {
    const [start, end] = monthRange(month);
    const [prevStart, prevEnd] = monthRange(previousMonth(month));

    const [expenses, prevExpenses, budgets] = await Promise.all([
      prisma.expense.findMany({
        where: { userId, date: { gte: start, lt: end } },
        select: { category: true, amountCents: true, date: true },
      }),
      prisma.expense.findMany({
        where: { userId, date: { gte: prevStart, lt: prevEnd } },
        select: { category: true, amountCents: true },
      }),
      prisma.budget.findMany({
        where: { userId, month },
        select: { category: true, amountCents: true },
      }),
    ]);

    const spentByCategory = sumByCategory(expenses);
    const previousByCategory = sumByCategory(prevExpenses);
    const budgetByCategory = new Map<string, number>(
      budgets
        .filter((b) => b.category !== null)
        .map((b) => [b.category as string, b.amountCents]),
    );
    const globalBudgetCents =
      budgets.find((b) => b.category === null)?.amountCents ?? null;

    const categories = [
      ...new Set([...spentByCategory.keys(), ...budgetByCategory.keys()]),
    ]
      .map((category) => ({
        category,
        spentCents: spentByCategory.get(category) ?? 0,
        budgetCents: budgetByCategory.get(category) ?? null,
        previousSpentCents: previousByCategory.get(category) ?? 0,
      }))
      .sort((a, b) => b.spentCents - a.spentCents);

    const totalSpentCents = sumCents(expenses);

    return {
      month,
      totalSpentCents,
      totalPreviousCents: sumCents(prevExpenses),
      globalBudgetCents,
      remainingCents:
        globalBudgetCents === null ? null : globalBudgetCents - totalSpentCents,
      categories,
      weekly: weeklyBreakdown(expenses, start, end),
    };
  }

  async exportCsv(userId: string, month: string) {
    const [start, end] = monthRange(month);
    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: 'asc' },
      select: { date: true, category: true, label: true, amountCents: true },
    });

    const header = 'Date;Catégorie;Libellé;Montant (€)';
    const rows = expenses.map((e) =>
      [
        new Date(e.date).toISOString().slice(0, 10),
        e.category,
        (e.label ?? '').replace(/;/g, ','),
        (e.amountCents / 100).toFixed(2).replace('.', ','),
      ].join(';'),
    );
    return [header, ...rows].join('\n');
  }

  async evaluateAlert(
    userId: string,
    category: string,
    date: Date,
    addedCents: number,
  ): Promise<BudgetAlert | null> {
    const month = formatMonthOf(new Date(date));
    const budget = await prisma.budget.findFirst({
      where: { userId, month, category },
    });
    if (!budget || budget.amountCents <= 0) return null;

    const [start, end] = monthRange(month);
    const { _sum } = await prisma.expense.aggregate({
      where: { userId, category, date: { gte: start, lt: end } },
      _sum: { amountCents: true },
    });
    const spentAfter = _sum.amountCents ?? 0;
    const spentBefore = spentAfter - addedCents;
    const base = {
      category,
      spentCents: spentAfter,
      budgetCents: budget.amountCents,
    };

    if (spentBefore < budget.amountCents && spentAfter >= budget.amountCents) {
      return { ...base, level: 'exceeded' };
    }
    const warnAt = budget.amountCents * 0.8;
    if (spentBefore < warnAt && spentAfter >= warnAt) {
      return { ...base, level: 'warning' };
    }
    return null;
  }
}
