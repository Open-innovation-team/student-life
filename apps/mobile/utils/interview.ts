import type { InterviewQuestion } from '../lib/api';

export const INTERVIEW_CATEGORIES = [
  'Motivation',
  'Comportemental',
  'Technique',
  'Mise en situation',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Motivation: '#2A9D8F',
  Comportemental: '#5AA9E6',
  Technique: '#C490D1',
  'Mise en situation': '#E9C46A',
};

export function interviewCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#08415C';
}

export type CategoryGroup = {
  category: string;
  questions: InterviewQuestion[];
};

export function groupByCategory(
  questions: InterviewQuestion[],
): CategoryGroup[] {
  return INTERVIEW_CATEGORIES.map((category) => ({
    category,
    questions: questions.filter((q) => q.category === category),
  })).filter((group) => group.questions.length > 0);
}

export function answeredCount(questions: InterviewQuestion[]): number {
  return questions.filter((q) => (q.answer ?? '').trim().length > 0).length;
}
