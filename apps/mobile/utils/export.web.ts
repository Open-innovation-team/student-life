import { budgetExportUrl } from '../lib/api';

export async function exportCsv(url: string, filename: string): Promise<void> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);

  const objectUrl = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function exportMonthCsv(month: string): Promise<void> {
  return exportCsv(budgetExportUrl(month), `depenses-${month}.csv`);
}
