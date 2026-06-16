import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import * as Linking from 'expo-linking';
import { authClient } from '../../lib/auth-client';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email) {
      Alert.alert('Erreur', 'Veuillez saisir votre email');
      return;
    }
    setLoading(true);
    // Genere le bon deep link selon le runtime : studentlife://reset-password
    // (build standalone) ou exp://.../--/reset-password (Expo Go).
    const redirectTo = Linking.createURL('/reset-password');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (authClient as any).requestPasswordReset({
      email,
      redirectTo,
    });
    setLoading(false);

    // Securite : on n'indique jamais si l'email existe ou non.
    if (error && error.status !== 200) {
      console.log('requestPasswordReset error:', error);
    }
    Alert.alert(
      'Vérifiez vos emails',
      'Si un compte est associé à cette adresse, un lien de réinitialisation vient de vous être envoyé.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
    );
  }, [email]);

  return (
    <ScrollView
      className="flex-1 bg-[#E5FCFF]"
      contentContainerClassName="flex-1 justify-center items-center px-4 py-12"
      showsVerticalScrollIndicator={false}
    >
      <View
        className="w-full max-w-md bg-white rounded-3xl shadow-lg"
        style={{ padding: Platform.OS === 'web' ? 32 : 24 }}
      >
        {/* Header */}
        <View className="items-center mb-10">
          <View
            className="rounded-2xl bg-[#08415C] items-center justify-center mb-4"
            style={{
              width: Platform.OS === 'web' ? 64 : 80,
              height: Platform.OS === 'web' ? 64 : 80,
            }}
          >
            <Text
              style={{ fontSize: Platform.OS === 'web' ? 24 : 30 }}
              className="text-white font-bold"
            >
              SL
            </Text>
          </View>
          <Text
            style={{ fontSize: Platform.OS === 'web' ? 28 : 34 }}
            className="text-[#08415C] font-bold"
          >
            Mot de passe oublié
          </Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">
            Saisis ton email pour recevoir un lien de réinitialisation.
          </Text>
        </View>

        {/* Input */}
        <View className="gap-3">
          <TextInput
            className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
            style={{
              paddingVertical: Platform.OS === 'web' ? 14 : 18,
              fontSize: Platform.OS === 'web' ? 14 : 16,
            }}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
        </View>

        {/* Bouton */}
        <TouchableOpacity
          className={`bg-[#08415C] rounded-xl items-center mt-6 ${loading ? 'opacity-60' : ''}`}
          style={{ paddingVertical: Platform.OS === 'web' ? 14 : 18 }}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text
            style={{ fontSize: Platform.OS === 'web' ? 14 : 17 }}
            className="text-white font-semibold"
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </Text>
        </TouchableOpacity>

        {/* Lien retour */}
        <View className="items-center mt-6">
          <Link href="/(auth)/login">
            <Text className="text-[#08415C] text-sm">
              Retour à la <Text className="font-bold">connexion</Text>
            </Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
