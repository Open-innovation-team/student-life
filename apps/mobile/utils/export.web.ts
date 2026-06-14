import { budgetExportUrl } from '../lib/api';

export async function exportMonthCsv(month: string): Promise<void> {
  const res = await fetch(budgetExportUrl(month), { credentials: 'include' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);

  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = `depenses-${month}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
