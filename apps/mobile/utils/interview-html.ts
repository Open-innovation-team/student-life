import type { CategoryGroup } from './interview';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderQuestion(question: string, answer: string | null): string {
  const reply = (answer ?? '').trim();
  const body = reply
    ? escapeHtml(reply).replace(/\n/g, '<br/>')
    : '<span class="empty">Réponse non préparée</span>';
  return `<div class="question">
    <p class="label">${escapeHtml(question)}</p>
    <p class="answer">${body}</p>
  </div>`;
}

function renderGroup(group: CategoryGroup): string {
  const questions = group.questions
    .map((q) => renderQuestion(q.question, q.answer))
    .join('');
  return `<section>
    <h2>${escapeHtml(group.category)}</h2>
    ${questions}
  </section>`;
}

export function buildInterviewHtml(
  title: string,
  groups: CategoryGroup[],
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #08415C; padding: 24px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #6b7280; margin-top: 0; font-size: 13px; }
    h2 { font-size: 16px; margin-top: 24px; border-bottom: 2px solid #E5FCFF; padding-bottom: 4px; }
    .question { margin-top: 12px; }
    .label { font-weight: 600; margin: 0 0 4px; }
    .answer { margin: 0; color: #374151; line-height: 1.4; }
    .empty { color: #9ca3af; font-style: italic; }
  </style>
</head>
<body>
  <h1>Préparation d'entretien</h1>
  <p class="subtitle">${escapeHtml(title)}</p>
  ${groups.map(renderGroup).join('')}
</body>
</html>`;
}
