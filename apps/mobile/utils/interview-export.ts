import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { CategoryGroup } from './interview';
import { buildInterviewHtml } from './interview-html';

export async function exportInterviewPdf(
  title: string,
  groups: CategoryGroup[],
): Promise<void> {
  const html = buildInterviewHtml(title, groups);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
  }
}
