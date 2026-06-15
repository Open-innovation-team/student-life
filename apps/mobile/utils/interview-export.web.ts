import type { CategoryGroup } from './interview';
import { buildInterviewHtml } from './interview-html';

export async function exportInterviewPdf(
  title: string,
  groups: CategoryGroup[],
): Promise<void> {
  const html = buildInterviewHtml(title, groups);
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Impossible d'ouvrir la fenêtre d'impression");
  }
  win.addEventListener('load', () => {
    win.focus();
    win.print();
    URL.revokeObjectURL(url);
  });
}
