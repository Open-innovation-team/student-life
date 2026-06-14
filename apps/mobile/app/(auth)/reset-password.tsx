import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput as RNTextInput } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { authClient } from '../../lib/auth-client';

// Memes regles que l'inscription : longueur minimale 8 (defaut better-auth).
const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordScreen() {
  const { token, error: linkError } = useLocalSearchParams<{
    token?: string;
    error?: string;
  }>();
  const confirmRef = useRef<RNTextInput>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const tokenInvalid = !token || linkError === 'INVALID_TOKEN';

  const handleReset = useCallback(async () => {
    if (!token) {
      Alert.alert('Erreur', 'Lien de réinitialisation invalide ou expiré.');
      return;
    }
    if (!password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(
        'Erreur',
        `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    setLoading(false);

    if (error) {
      Alert.alert(
        'Erreur',
        error.message ??
          'Impossible de réinitialiser le mot de passe. Le lien a peut-être expiré.',
      );
      return;
    }

    Alert.alert(
      'Mot de passe réinitialisé',
      'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
    );
  }, [token, password, confirmPassword]);

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
            Nouveau mot de passe
          </Text>
        </View>

        {tokenInvalid ? (
          <View className="items-center gap-4">
            <Text className="text-gray-500 text-center">
              Ce lien de réinitialisation est invalide ou a expiré. Veuillez en
              demander un nouveau.
            </Text>
            <Link href="/(auth)/forgot-password">
              <Text className="text-[#08415C] font-bold">
                Demander un nouveau lien
              </Text>
            </Link>
          </View>
        ) : (
          <>
            {/* Inputs */}
            <View className="gap-3">
              <TextInput
                className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
                style={{
                  paddingVertical: Platform.OS === 'web' ? 14 : 18,
                  fontSize: Platform.OS === 'web' ? 14 : 16,
                }}
                placeholder="Nouveau mot de passe"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                submitBehavior="submit"
              />
              <TextInput
                ref={confirmRef}
                className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
                style={{
                  paddingVertical: Platform.OS === 'web' ? 14 : 18,
                  fontSize: Platform.OS === 'web' ? 14 : 16,
                }}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleReset}
              />
            </View>

            {/* Bouton */}
            <TouchableOpacity
              className={`bg-[#08415C] rounded-xl items-center mt-6 ${loading ? 'opacity-60' : ''}`}
              style={{ paddingVertical: Platform.OS === 'web' ? 14 : 18 }}
              onPress={handleReset}
              disabled={loading}
            >
              <Text
                style={{ fontSize: Platform.OS === 'web' ? 14 : 17 }}
                className="text-white font-semibold"
              >
                {loading ? 'Réinitialisation...' : 'Réinitialiser'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}
