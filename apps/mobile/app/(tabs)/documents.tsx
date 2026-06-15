import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { AppHeader } from '../../components/AppHeader';
import {
  DocumentItem,
  deleteDocument,
  listDocuments,
  uploadDocument,
} from '../../lib/api';
import { openDocument } from '../../utils/document-view';

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

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(query.trim().toLowerCase()),
  );

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

  const handleView = async (doc: DocumentItem) => {
    try {
      await openDocument(doc.id, doc.filename);
    } catch {
      showError('Ouverture impossible', 'Impossible d’ouvrir le PDF.');
    }
  };

  return (
    <View className="flex-1 bg-[#E5FCFF]">
      <AppHeader title="Mes documents" />

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
