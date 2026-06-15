import { documentFileUrl } from '../lib/api';

export async function openDocument(id: string): Promise<void> {
  const tab = window.open('', '_blank');
  const res = await fetch(documentFileUrl(id), { credentials: 'include' });
  if (!res.ok) {
    tab?.close();
    throw new Error(`Erreur ${res.status}`);
  }

  const objectUrl = URL.createObjectURL(await res.blob());
  if (tab) tab.location.href = objectUrl;
  else window.open(objectUrl, '_blank');
}
