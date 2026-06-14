import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { budgetExportUrl } from '../lib/api';
import { ORIGIN } from '../lib/auth-client';

export async function exportCsv(url: string, filename: string): Promise<void> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { Origin: ORIGIN },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const csv = await res.text();

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv' });
  }
}

export function exportMonthCsv(month: string): Promise<void> {
  return exportCsv(budgetExportUrl(month), `depenses-${month}.csv`);
}
