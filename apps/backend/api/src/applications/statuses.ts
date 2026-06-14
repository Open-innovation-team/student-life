export const APPLICATION_STATUSES = [
  'Envoyée',
  'En attente',
  'Entretien planifié',
  'Refus',
  'Acceptée',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const FOLLOW_UP_STATUSES: readonly ApplicationStatus[] = [
  'Envoyée',
  'En attente',
];

export const RESPONDED_STATUSES: readonly ApplicationStatus[] = [
  'Entretien planifié',
  'Refus',
  'Acceptée',
];

export const INTERVIEW_STATUSES: readonly ApplicationStatus[] = [
  'Entretien planifié',
  'Acceptée',
];

export const FOLLOW_UP_DAYS = 14;
