import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { authClient, BASE_URL, ORIGIN } from '../../lib/auth-client';
import {
  DocumentItem,
  deleteDocument,
  documentFileUrl,
  listDocuments,
  uploadDocument,
} from '../../lib/api';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function showError(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title} : ${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(query.trim().toLowerCase()),
  );

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

  const load = useCallback(async () => {
    try {
      setDocuments(await listDocuments());
    } catch (err) {
      showError('Erreur', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      await uploadDocument(result.assets[0]);
      await load();
    } catch (err) {
      showError('Upload impossible', (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (doc: DocumentItem) => {
    const doDelete = async () => {
      try {
        await deleteDocument(doc.id);
        setDocuments((docs) => docs.filter((d) => d.id !== doc.id));
      } catch (err) {
        showError('Suppression impossible', (err as Error).message);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer "${doc.filename}" ?`)) doDelete();
    } else {
      Alert.alert(
        'Supprimer le document',
        `"${doc.filename}" ainsi que ses fiches et quiz seront supprimés.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: doDelete },
        ],
      );
    }
  };

  const handleView = (doc: DocumentItem) => {
    const url = documentFileUrl(doc.id);
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() =>
        showError('Ouverture impossible', "Impossible d'ouvrir le PDF."),
      );
    }
  };

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
            Mes documents
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
      <View className="flex-1 px-4 pt-4">
        <View className="bg-white rounded-xl px-3 mb-4 flex-row items-center gap-2">
          <Ionicons name="search" color="#08415C" size={18} />
          <TextInput
            className="flex-1 py-3 text-[#08415C]"
            placeholder="Rechercher un document…"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" color="#9ca3af" size={18} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          className="bg-[#08415C] rounded-xl items-center py-4 mb-4 flex-row justify-center gap-2"
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text className="text-white font-semibold">Envoi en cours…</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload" color="#fff" size={18} />
              <Text className="text-white font-semibold">Uploader un PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color="#08415C" className="mt-8" />
        ) : documents.length === 0 ? (
          <View className="items-center mt-12">
            <Ionicons name="document-text-outline" color="#9ca3af" size={48} />
            <Text className="text-gray-400 mt-2 text-center">
              Aucun document.{'\n'}Uploade un PDF de cours pour commencer !
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center mt-12">
            <Ionicons name="search-outline" color="#9ca3af" size={48} />
            <Text className="text-gray-400 mt-2 text-center">
              Aucun document ne correspond à « {query.trim()} ».
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center gap-3"
                onPress={() => router.push(`/document/${item.id}`)}
              >
                <View className="w-10 h-10 rounded-xl bg-[#E5FCFF] items-center justify-center">
                  <Ionicons name="document-text" color="#08415C" size={22} />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[#08415C] font-semibold"
                    numberOfLines={1}
                  >
                    {item.filename}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {formatSize(item.sizeBytes)} ·{' '}
                    {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  hitSlop={8}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" color="#ef4444" size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleView(item)}
                  hitSlop={8}
                  className="p-2"
                >
                  <Ionicons name="eye-outline" color="#08415C" size={20} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
