import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { budgetExportUrl } from '../lib/api';
import { ORIGIN } from '../lib/auth-client';

export async function exportMonthCsv(month: string): Promise<void> {
  const res = await fetch(budgetExportUrl(month), {
    credentials: 'include',
    headers: { Origin: ORIGIN },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const csv = await res.text();

  const file = new File(Paths.cache, `depenses-${month}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: `Dépenses ${month}`,
    });
  }
}
