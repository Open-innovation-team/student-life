import { Platform } from 'react-native';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { BASE_URL, ORIGIN } from './auth-client';

export type Summary = {
  id: string;
  content: string;
  createdAt: string;
};

export type DocumentItem = {
  id: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  summaries?: Summary[];
};

export type QuizQuestion = {
  question: string;
  choix: [string, string, string, string];
  bonneReponse: number; // 0..3
  explication: string;
};

export type Quiz = {
  id: string;
  documentId: string;
  questions: QuizQuestion[];
};

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      Origin: ORIGIN,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (data?.message) {
        message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
      }
    } catch {
      // corps non JSON : on garde le message générique
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function listDocuments(): Promise<DocumentItem[]> {
  return apiFetch('/api/documents');
}

export function getDocument(id: string): Promise<DocumentItem> {
  return apiFetch(`/api/documents/${id}`);
}

export function deleteDocument(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
}

export function documentFileUrl(id: string): string {
  return `${BASE_URL}/api/documents/${id}/file`;
}

export function uploadDocument(
  asset: DocumentPickerAsset,
): Promise<DocumentItem> {
  const formData = new FormData();
  if (Platform.OS === 'web' && asset.file) {
    formData.append('file', asset.file, asset.name);
  } else {
    // React Native attend un objet { uri, name, type } pour les fichiers
    formData.append('file', {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? 'application/pdf',
    } as unknown as Blob);
  }
  return apiFetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export function summarizeDocument(
  id: string,
  refresh = false,
): Promise<Summary> {
  return apiFetch(
    `/api/documents/${id}/summarize${refresh ? '?refresh=true' : ''}`,
    { method: 'POST' },
  );
}

export function generateQuiz(id: string, nbQuestions: number): Promise<Quiz> {
  return apiFetch(`/api/documents/${id}/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nbQuestions }),
  });
}

export type Expense = {
  id: string;
  amountCents: number;
  category: string;
  label: string | null;
  date: string;
};

export type ExpenseInput = {
  amountCents: number;
  category: string;
  label?: string;
  date?: string;
};

export type ExpenseSort = 'date' | 'amount' | 'category';
export type SortOrder = 'asc' | 'desc';

export type CustomCategory = { id: string; name: string };

export type Categories = {
  predefined: string[];
  custom: CustomCategory[];
};

function jsonBody(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function listExpenses(
  sort: ExpenseSort = 'date',
  order: SortOrder = 'desc',
): Promise<Expense[]> {
  return apiFetch(`/api/expenses?sort=${sort}&order=${order}`);
}

export function todayExpenses(): Promise<{
  expenses: Expense[];
  totalCents: number;
}> {
  return apiFetch('/api/expenses/today');
}

export type BudgetAlert = {
  category: string;
  level: 'warning' | 'exceeded';
  spentCents: number;
  budgetCents: number;
};

export type CreatedExpense = Expense & { alert: BudgetAlert | null };

export function createExpense(input: ExpenseInput): Promise<CreatedExpense> {
  return apiFetch('/api/expenses', jsonBody('POST', input));
}

export function updateExpense(
  id: string,
  input: Partial<ExpenseInput>,
): Promise<Expense> {
  return apiFetch(`/api/expenses/${id}`, jsonBody('PATCH', input));
}

export function deleteExpense(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
}

export function listCategories(): Promise<Categories> {
  return apiFetch('/api/categories');
}

export function createCategory(name: string): Promise<CustomCategory> {
  return apiFetch('/api/categories', jsonBody('POST', { name }));
}

export type Budget = {
  id: string;
  category: string | null;
  amountCents: number;
};

export type DashboardCategory = {
  category: string;
  spentCents: number;
  budgetCents: number | null;
  previousSpentCents: number;
};

export type WeeklyPoint = { week: number; amountCents: number };

export type BudgetDashboard = {
  month: string;
  totalSpentCents: number;
  totalPreviousCents: number;
  globalBudgetCents: number | null;
  remainingCents: number | null;
  categories: DashboardCategory[];
  weekly: WeeklyPoint[];
};

export function getBudgetDashboard(month: string): Promise<BudgetDashboard> {
  return apiFetch(`/api/budgets/dashboard?month=${month}`);
}

export function listBudgets(month: string): Promise<Budget[]> {
  return apiFetch(`/api/budgets?month=${month}`);
}

export function upsertBudget(input: {
  month: string;
  category?: string | null;
  amountCents: number;
}): Promise<unknown> {
  return apiFetch('/api/budgets', jsonBody('PUT', input));
}

export function budgetExportUrl(month: string): string {
  return `${BASE_URL}/api/budgets/export?month=${month}`;
}

/* Applications */

export type Application = {
  id: string;
  company: string;
  position: string;
  platform: string | null;
  status: string;
  sentAt: string;
  notes: string | null;
  cvDocumentId: string | null;
  lmDocumentId: string | null;
  lastStatusAt: string;
  needsFollowUp: boolean;
};

export type ApplicationInput = {
  company: string;
  position: string;
  platform?: string;
  status?: string;
  sentAt?: string;
  notes?: string;
  cvDocumentId?: string;
  lmDocumentId?: string;
};

export type ApplicationStats = {
  total: number;
  byStatus: Record<string, number>;
  interviews: number;
  responseRate: number;
};

export function listApplications(): Promise<Application[]> {
  return apiFetch('/api/applications');
}

export function getApplication(id: string): Promise<Application> {
  return apiFetch(`/api/applications/${id}`);
}

export function applicationStats(): Promise<ApplicationStats> {
  return apiFetch('/api/applications/stats');
}

export function createApplication(
  input: ApplicationInput,
): Promise<Application> {
  return apiFetch('/api/applications', jsonBody('POST', input));
}

export function updateApplication(
  id: string,
  input: Partial<ApplicationInput>,
): Promise<Application> {
  return apiFetch(`/api/applications/${id}`, jsonBody('PATCH', input));
}

export function deleteApplication(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/api/applications/${id}`, { method: 'DELETE' });
}

export function applicationsExportUrl(): string {
  return `${BASE_URL}/api/applications/export`;
}

/* Interview preparation */

export type InterviewQuestion = {
  id: string;
  category: string;
  question: string;
  answer: string | null;
  source: 'catalog' | 'ai';
};

export function getInterviewPrep(
  applicationId: string,
): Promise<InterviewQuestion[]> {
  return apiFetch(`/api/applications/${applicationId}/interview`);
}

export function saveInterviewAnswer(
  applicationId: string,
  questionId: string,
  answer: string,
): Promise<InterviewQuestion> {
  return apiFetch(
    `/api/applications/${applicationId}/interview/${questionId}`,
    jsonBody('PATCH', { answer }),
  );
}

export function generateInterviewQuestions(
  applicationId: string,
): Promise<InterviewQuestion[]> {
  return apiFetch(`/api/applications/${applicationId}/interview/generate`, {
    method: 'POST',
  });
}
