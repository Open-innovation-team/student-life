import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { DocumentItem, listDocuments } from '../lib/api';

type Props = {
  label: string;
  value: string | null;
  onChange: (documentId: string | null) => void;
};

export function DocumentSelect({ label, value, onChange }: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [open, setOpen] = useState(false);

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

  return (
    <View className="bg-white rounded-2xl p-3 mb-2 flex-row items-center gap-3 border border-gray-100">
      <Ionicons name="document-attach-outline" size={20} color="#08415C" />
      <View className="flex-1">
        <Text className="text-[#08415C] font-medium">{label}</Text>
        <Text className="text-gray-400 text-xs" numberOfLines={1}>
          {selected ? selected.filename : 'Aucun document'}
        </Text>
      </View>
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
