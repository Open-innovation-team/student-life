import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authClient } from '../../lib/auth-client';
import { DocumentItem, listDocuments } from '../../lib/api';

export default function HomeScreen() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [recent, setRecent] = useState<DocumentItem[]>([]);

  useEffect(() => {
    async function loadSession() {
      const session = await authClient.getSession();
      setFirstName(session?.data?.user?.name?.split(' ')[0] ?? null);
    }
    loadSession();
  }, []);

  useFocusEffect(
    useCallback(() => {
      listDocuments()
        .then((docs) => setRecent(docs.slice(0, 3)))
        .catch(() => setRecent([]));
    }, []),
  );

  const comingSoon = () => {
    const message = 'Le Prof virtuel arrive bientôt 👨‍🏫';
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Bientôt disponible', message);
    }
  };

  return (
    <View className="flex-1 bg-[#E5FCFF]">
      {/* Header */}
      <View className="bg-[#08415C] pt-16 pb-6 px-6">
        <Text className="text-white/70 text-sm">Bonjour {firstName} 👋</Text>
        <Text className="text-white text-2xl font-bold mt-1">Étudiant</Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Widget accès rapide IA */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="text-[#08415C] font-bold text-lg mb-3">
            Assistant IA
          </Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 bg-[#08415C] rounded-xl p-3 items-center"
              onPress={() => router.push('/(tabs)/documents')}
            >
              <Text className="text-white text-xs font-medium">
                Résumer PDF & Quiz
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#C490D1] rounded-xl p-3 items-center"
              onPress={comingSoon}
            >
              <Text className="text-white text-xs font-medium">
                Prof virtuel
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Widget documents récents */}
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[#08415C] font-bold text-lg">
              Documents récents
            </Text>
            {recent.length > 0 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/documents')}
              >
                <Text className="text-[#08415C] text-xs font-medium">
                  Voir tout
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {recent.length === 0 ? (
            <View className="items-center py-4">
              <Text className="text-gray-400 text-sm text-center mb-3">
                Aucun document pour l&apos;instant.
              </Text>
              <TouchableOpacity
                className="bg-[#08415C] rounded-xl px-4 py-2"
                onPress={() => router.push('/(tabs)/documents')}
              >
                <Text className="text-white text-xs font-semibold">
                  Uploader un PDF
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            recent.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                className="flex-row items-center py-3 border-b border-gray-100"
                onPress={() => router.push(`/document/${doc.id}`)}
              >
                <View className="w-10 h-10 bg-[#ABDAFC] rounded-lg items-center justify-center mr-3">
                  <Text className="text-[#08415C] font-bold text-xs">PDF</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-gray-800 font-medium text-sm"
                    numberOfLines={1}
                  >
                    {doc.filename}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" color="#9ca3af" size={18} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Widget budget */}
        <View className="bg-white rounded-2xl p-4 mb-8 shadow-sm">
          <Text className="text-[#08415C] font-bold text-lg mb-3">
            Budget du mois
          </Text>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-400 text-xs">Dépensé</Text>
              <Text className="text-[#08415C] text-2xl font-bold">420€</Text>
            </View>
            <View className="items-end">
              <Text className="text-gray-400 text-xs">Budget total</Text>
              <Text className="text-gray-600 text-lg font-medium">800€</Text>
            </View>
          </View>
          <View className="mt-3 bg-gray-100 rounded-full h-2">
            <View className="bg-[#08415C] rounded-full h-2 w-1/2" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
