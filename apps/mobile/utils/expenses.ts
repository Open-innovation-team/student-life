import { listExpenses } from '../lib/api';

export async function getLabelSuggestions(): Promise<string[]> {
  const expenses = await listExpenses();
  const labels = expenses.map((e) => e.label).filter((l): l is string => !!l);
  return [...new Set(labels)];
}
