import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { devSignIn, type OAuthProvider, signIn } from '@/lib/auth';

/**
 * Ecran de connexion : deux boutons OAuth. Le clic ouvre la session navigateur
 * vers le backend, et en cas de succes redirige vers le tableau de bord.
 */
export default function Login() {
  const router = useRouter();
  const [pending, setPending] = useState<OAuthProvider | 'dev' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(provider: OAuthProvider) {
    setError(null);
    setPending(provider);
    try {
      const ok = await signIn(provider);
      if (ok) {
        router.replace('/dashboard');
      } else {
        setError('La connexion a echoue. Veuillez reessayer.');
      }
    } finally {
      setPending(null);
    }
  }

  // DEV uniquement : connexion sans OAuth (necessite DEV_AUTH_BYPASS=true cote backend).
  async function handleDevSignIn() {
    setError(null);
    setPending('dev');
    try {
      const ok = await devSignIn();
      if (ok) {
        router.replace('/dashboard');
      } else {
        setError(
          'Bypass dev indisponible (DEV_AUTH_BYPASS actif cote backend ?).',
        );
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Student Life</Text>
        <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>

        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            disabled={pending !== null}
            onPress={() => handleSignIn('google')}
          >
            {pending === 'google' ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Continuer avec Google</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            disabled={pending !== null}
            onPress={() => handleSignIn('microsoft')}
          >
            {pending === 'microsoft' ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Continuer avec Microsoft</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.devButton,
              pressed && styles.pressed,
            ]}
            disabled={pending !== null}
            onPress={handleDevSignIn}
          >
            {pending === 'dev' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.devButtonText}>
                Connexion dev (sans OAuth)
              </Text>
            )}
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    padding: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#71717a',
  },
  buttons: {
    marginTop: 28,
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
  },
  devButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  error: {
    marginTop: 16,
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
});
