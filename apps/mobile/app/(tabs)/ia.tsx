import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authClient, BASE_URL, ORIGIN } from '../../lib/auth-client';

export default function IAScreen() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const response = await fetch(`${BASE_URL}/api/users/me`, {
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        credentials: 'include',
      });
      const userData = await response.json();
      setFirstName(userData.firstName ?? null);
      setLastName(userData.lastName ?? null);
      setUserImage(userData.image ?? null);
      setUserInitials(
        `${userData.firstName?.[0] ?? ''}${userData.lastName?.[0] ?? ''}`,
      );
    }
    loadUser();
  }, []);

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
    <View className="flex-1 bg-[#E5FCFF]">
      {/* Header */}
      <View className="bg-[#08415C] pt-16 pb-6 px-6 flex-row justify-between items-end">
        <View>
          <Text className="text-white/70 text-sm">
            {firstName} {lastName}
          </Text>
          <Text className="text-white text-2xl font-bold mt-1">
            Assistant IA
          </Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)} className="mb-1">
          {userImage ? (
            <Image
              source={{ uri: userImage }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <Text className="text-white font-bold text-sm">
                {userInitials}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Menu déroulant avatar */}
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
            style={{ top: Platform.OS === 'ios' ? 120 : 100, minWidth: 200 }}
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

      {/* Contenu */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 mt-2">Bientôt disponible</Text>
      </View>
    </View>
  );
}
