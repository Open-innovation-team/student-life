import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { UserProvider } from '../../lib/user-context';

export default function TabsLayout() {
  return (
    <UserProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#08415C',
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#ABDAFC',
          tabBarInactiveTintColor: '#ffffff80',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documents',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="ia"
          options={{
            title: 'IA',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profil"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </UserProvider>
  );
}
