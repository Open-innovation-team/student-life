import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { fetchCurrentUser } from '@/lib/auth';

/**
 * Ecran d'entree : verifie l'auth (GET /auth/me, avec refresh) puis redirige
 * vers /dashboard ou /login. Equivalent de la garde du dashboard web.
 */
export default function Index() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetchCurrentUser().then((user) => setAuthed(user !== null));
  }, []);

  if (authed === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Redirect href={authed ? '/dashboard' : '/login'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
});
