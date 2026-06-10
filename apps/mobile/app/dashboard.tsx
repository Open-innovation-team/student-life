import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type AuthUser, fetchCurrentUser, logout } from '@/lib/auth';

/**
 * Ecran protege : verifie le JWT via GET /auth/me.
 * Redirige vers /login si l'utilisateur n'est pas authentifie.
 * Calque sur apps/web/app/dashboard/page.tsx.
 */
export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then((result) => {
        if (result) {
          setUser(result);
        } else {
          router.replace('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>Vous etes connecte.</Text>

        <View style={styles.rows}>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ID</Text>
            <Text style={styles.valueMono}>{user.id}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Se deconnecter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
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
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#71717a',
  },
  rows: {
    marginTop: 24,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    fontSize: 14,
    color: '#71717a',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
    flexShrink: 1,
    textAlign: 'right',
  },
  valueMono: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#3f3f46',
    flexShrink: 1,
    textAlign: 'right',
  },
  button: {
    marginTop: 32,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});
