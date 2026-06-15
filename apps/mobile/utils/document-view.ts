import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { documentFileUrl } from '../lib/api';
import { ORIGIN } from '../lib/auth-client';

export async function openDocument(
  id: string,
  filename: string,
): Promise<void> {
  const res = await fetch(documentFileUrl(id), {
    credentials: 'include',
    headers: { Origin: ORIGIN },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);

  const bytes = new Uint8Array(await res.arrayBuffer());
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
  }
}
