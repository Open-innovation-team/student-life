export function currentMonth(): string {
  return formatMonthOf(new Date());
}

export function formatMonthOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthRange(month: string): [Date, Date] {
  const [year, m] = month.split('-').map(Number);
  return [new Date(year, m - 1, 1), new Date(year, m, 1)];
}

export function previousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return formatMonthOf(new Date(year, m - 2, 1));
}
