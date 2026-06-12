import { createAuthClient } from 'better-auth/react';
import { Platform } from 'react-native';
import { secureStorage } from './secure-storage';

export const BASE_URL =
  Platform.OS === 'web' ? 'http://localhost:3001' : 'http://10.61.8.11:3001'; // Modifier avec son IP : Windows -> ipconfig, Linux -> ifconfig

export const ORIGIN =
  Platform.OS === 'web' ? 'http://localhost:8081' : 'http://10.61.8.11:8081';

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  storage: secureStorage,
  fetchOptions: {
    headers: {
      Origin: ORIGIN,
    },
  },
});
