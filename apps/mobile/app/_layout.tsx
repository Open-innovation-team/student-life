import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/** Layout racine : pile de navigation sans en-tete. */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
