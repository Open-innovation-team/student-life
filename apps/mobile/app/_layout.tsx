import '../global';
import { useEffect, useState, useRef } from 'react';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View, Text } from 'react-native';
import { authClient } from '../lib/auth-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const hasNavigated = useRef(false);

  useEffect(() => {
    async function prepare() {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await SplashScreen.hideAsync();
      setShowSplash(false); // Le Stack va se monter
    }
    prepare();
  }, []);

  useEffect(() => {
    if (showSplash) return; // Attendre que le Stack soit monté
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    async function checkSession() {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }

    checkSession();
  }, [showSplash]); // Se déclenche quand showSplash passe à false

  if (showSplash) {
    return (
      <View className="flex-1 bg-[#08415C] items-center justify-center gap-8">
        <View className="w-32 h-32 rounded-3xl bg-white/20 items-center justify-center">
          <Text className="text-white text-5xl font-bold">SL</Text>
        </View>
        <Text className="text-white text-3xl font-bold tracking-wide">
          Student Life
        </Text>
        <Text className="text-white/70 text-base">Ton compagnon étudiant</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="expense/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="expense/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
