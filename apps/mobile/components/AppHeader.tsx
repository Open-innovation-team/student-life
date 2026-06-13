import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authClient } from '../lib/auth-client';
import { useUser } from '../lib/user-context';

interface AppHeaderProps {
  title: string;
  greeting?: boolean;
}

export function AppHeader({ title, greeting = false }: AppHeaderProps) {
  const { firstName, lastName, image, initials } = useUser();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleEditProfile = () => {
    setMenuVisible(false);
    router.push('/(tabs)/profil?editing=true');
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    const doLogout = async () => {
      await authClient.signOut();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      await doLogout();
    } else {
      Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  return (
    <>
      <View
        className="bg-[#08415C] pb-6 px-6 flex-row justify-between items-end"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View>
          <Text className="text-white/70 text-sm">
            {greeting ? `Bonjour ${firstName} 👋` : `${firstName} ${lastName}`}
          </Text>
          <Text className="text-white text-2xl font-bold mt-1">{title}</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)} className="mb-1">
          {image ? (
            <Image source={{ uri: image }} className="w-10 h-10 rounded-full" />
          ) : (
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white font-bold text-sm">{initials}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View
            className="absolute right-4 bg-white rounded-2xl shadow-lg py-2"
            style={{ top: insets.top + 68, minWidth: 200 }}
          >
            <TouchableOpacity
              className="flex-row items-center gap-3 px-4 py-3"
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil-outline" size={18} color="#08415C" />
              <Text className="text-[#08415C] font-medium">
                Modifier le profil
              </Text>
            </TouchableOpacity>
            <View className="h-px bg-gray-100 mx-3" />
            <TouchableOpacity
              className="flex-row items-center gap-3 px-4 py-3"
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text className="text-red-500 font-medium">Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
