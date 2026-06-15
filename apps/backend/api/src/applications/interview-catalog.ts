export const INTERVIEW_CATEGORIES = [
  'Motivation',
  'Comportemental',
  'Technique',
  'Mise en situation',
] as const;

export type InterviewCategory = (typeof INTERVIEW_CATEGORIES)[number];

export type CatalogQuestion = {
  category: InterviewCategory;
  question: string;
};

export const INTERVIEW_CATALOG: readonly CatalogQuestion[] = [
  {
    category: 'Motivation',
    question: 'Pourquoi avez-vous postulé à ce poste en particulier ?',
  },
  {
    category: 'Motivation',
    question:
      "Que savez-vous de notre entreprise et qu'est-ce qui vous attire ?",
  },
  {
    category: 'Motivation',
    question: 'Où vous voyez-vous dans cinq ans ?',
  },
  {
    category: 'Motivation',
    question: "Pourquoi vous plutôt qu'un autre candidat ?",
  },
  {
    category: 'Comportemental',
    question:
      'Décrivez une situation où vous avez dû gérer un conflit dans une équipe.',
  },
  {
    category: 'Comportemental',
    question: "Parlez-moi d'un projet dont vous êtes particulièrement fier.",
  },
  {
    category: 'Comportemental',
    question:
      'Racontez une fois où vous avez échoué et ce que vous en avez appris.',
  },
  {
    category: 'Comportemental',
    question:
      'Donnez un exemple de situation où vous avez dû respecter un délai serré.',
  },
  {
    category: 'Technique',
    question:
      'Quelles sont les compétences techniques que vous maîtrisez le mieux ?',
  },
  {
    category: 'Technique',
    question: 'Comment vous tenez-vous à jour dans votre domaine ?',
  },
  {
    category: 'Technique',
    question: 'Décrivez votre méthode pour résoudre un problème complexe.',
  },
  {
    category: 'Mise en situation',
    question:
      'Comment réagiriez-vous si un client était mécontent de votre travail ?',
  },
  {
    category: 'Mise en situation',
    question: 'Que feriez-vous si vous étiez en désaccord avec votre manager ?',
  },
  {
    category: 'Mise en situation',
    question:
      'Comment prioriseriez-vous plusieurs tâches urgentes en même temps ?',
  },
];

export function normalizeCategory(value: string): InterviewCategory {
  const match = INTERVIEW_CATEGORIES.find(
    (category) => category.toLowerCase() === value.trim().toLowerCase(),
  );
  return match ?? 'Mise en situation';
}
