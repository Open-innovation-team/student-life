import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentItem, listDocuments, uploadDocument } from '../lib/api';
import { openDocument } from '../utils/document-view';

type Props = {
  label: string;
  value: string | null;
  onChange: (documentId: string | null) => void;
};

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title} : ${message}`);
  else Alert.alert(title, message);
}

export function DocumentSelect({ label, value, onChange }: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          setDocuments(await listDocuments());
        } catch {
          setDocuments([]);
        }
      };
      load();
    }, []),
  );

  const selected = documents.find((d) => d.id === value);

  const select = (documentId: string | null) => {
    setOpen(false);
    onChange(documentId);
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const doc = await uploadDocument(result.assets[0]);
      setDocuments((prev) => [doc, ...prev]);
      select(doc.id);
    } catch (err) {
      notify('Import impossible', (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleView = async () => {
    if (!selected) return;
    try {
      await openDocument(selected.id, selected.filename);
    } catch {
      notify('Ouverture impossible', "Impossible d'ouvrir le PDF.");
    }
  };

  return (
    <View className="bg-white rounded-2xl p-3 mb-2 flex-row items-center gap-3 border border-gray-100">
      <Ionicons name="document-attach-outline" size={20} color="#08415C" />
      <View className="flex-1">
        <Text className="text-[#08415C] font-medium">{label}</Text>
        <Text className="text-gray-400 text-xs" numberOfLines={1}>
          {selected ? selected.filename : 'Aucun document'}
        </Text>
      </View>
      {selected && (
        <TouchableOpacity onPress={handleView} hitSlop={8}>
          <Ionicons name="eye-outline" size={20} color="#08415C" />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => setOpen(true)}>
        <Text className="text-[#08415C] text-sm font-medium">Changer</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/30 justify-center px-8"
          onPress={() => setOpen(false)}
        >
          <View className="bg-white rounded-2xl p-2 max-h-96">
            <TouchableOpacity
              onPress={handleImport}
              disabled={uploading}
              className="flex-row items-center gap-2 px-3 py-3 rounded-xl"
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#08415C" />
              ) : (
                <Ionicons
                  name="cloud-upload-outline"
                  size={16}
                  color="#08415C"
                />
              )}
              <Text className="text-[#08415C] font-medium">
                Importer un PDF
              </Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100 my-1" />

            <TouchableOpacity
              onPress={() => select(null)}
              className="px-3 py-3 rounded-xl"
            >
              <Text className="text-gray-500">Aucun document</Text>
            </TouchableOpacity>
            {documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                onPress={() => select(doc.id)}
                className="flex-row items-center gap-2 px-3 py-3 rounded-xl"
              >
                <Ionicons name="document-text" size={16} color="#08415C" />
                <Text className="text-[#08415C] flex-1" numberOfLines={1}>
                  {doc.filename}
                </Text>
                {doc.id === value && (
                  <Ionicons name="checkmark" size={18} color="#08415C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
