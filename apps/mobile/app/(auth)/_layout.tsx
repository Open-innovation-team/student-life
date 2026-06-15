import { Stack, Redirect } from 'expo-router';
import { authClient } from '../../lib/auth-client';

export default function AuthLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (session?.user) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
