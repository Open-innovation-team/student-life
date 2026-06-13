import { createAuthClient } from 'better-auth/react';
import { Platform } from 'react-native';
import { secureStorage } from './secure-storage';

const apiHost = process.env.EXPO_PUBLIC_API_HOST ?? 'localhost';

export const BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3001' : `http://${apiHost}:3001`;

export const ORIGIN =
  Platform.OS === 'web' ? 'http://localhost:8081' : `http://${apiHost}:8081`;

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  storage: secureStorage,
  fetchOptions: {
    headers: {
      Origin: ORIGIN,
    },
  },
});
