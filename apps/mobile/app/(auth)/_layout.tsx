import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { authClient } from '../../lib/auth-client';

export default function AuthLayout() {
  useEffect(() => {
    async function checkSession() {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        router.replace('/(tabs)');
      }
    }
    checkSession();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
