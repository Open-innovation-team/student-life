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
