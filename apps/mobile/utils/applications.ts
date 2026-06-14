export const APPLICATION_STATUSES = [
  'Envoyée',
  'En attente',
  'Entretien planifié',
  'Refus',
  'Acceptée',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const STATUS_COLORS: Record<string, string> = {
  Envoyée: '#5AA9E6',
  'En attente': '#E9C46A',
  'Entretien planifié': '#C490D1',
  Refus: '#E76F51',
  Acceptée: '#2A9D8F',
};

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? '#08415C';
}

export const PLATFORMS = [
  'LinkedIn',
  'Indeed',
  'Welcome to the Jungle',
  'Site entreprise',
  'Autre',
];
