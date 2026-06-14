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
import {
  DocumentItem,
  Expense,
  listDocuments,
  todayExpenses,
} from '../../lib/api';
import { categoryIcon, formatCents } from '../../utils';

export default function HomeScreen() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [recent, setRecent] = useState<DocumentItem[]>([]);
  const [today, setToday] = useState<{
    expenses: Expense[];
    totalCents: number;
  }>({ expenses: [], totalCents: 0 });

  useEffect(() => {
    async function loadSession() {
      const session = await authClient.getSession();
      setFirstName(session?.data?.user?.name?.split(' ')[0] ?? null);
    }
    loadSession();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadWidgets = async () => {
        try {
          const docs = await listDocuments();
          setRecent(docs.slice(0, 3));
        } catch {
          setRecent([]);
        }
        try {
          setToday(await todayExpenses());
        } catch {
          setToday({ expenses: [], totalCents: 0 });
        }
      };
      loadWidgets();
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

        {/* Widget dépenses du jour */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/finances')}
          className="bg-white rounded-2xl p-4 mb-8 shadow-sm"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[#08415C] font-bold text-lg">
              Dépenses du jour
            </Text>
            <Text
              className="text-[#08415C] text-2xl font-bold"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatCents(today.totalCents)}
            </Text>
          </View>

          {today.expenses.length === 0 ? (
            <Text className="text-gray-400 text-sm">
              Aucune dépense aujourd&apos;hui. Touche le bouton + pour en
              ajouter une.
            </Text>
          ) : (
            today.expenses.slice(0, 3).map((e) => (
              <View
                key={e.id}
                className="flex-row items-center py-2 border-b border-gray-100"
              >
                <View className="w-9 h-9 bg-[#E5FCFF] rounded-lg items-center justify-center mr-3">
                  <Ionicons
                    name={categoryIcon(e.category)}
                    color="#08415C"
                    size={18}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-gray-800 font-medium text-sm"
                    numberOfLines={1}
                  >
                    {e.label || e.category}
                  </Text>
                  <Text className="text-gray-400 text-xs">{e.category}</Text>
                </View>
                <Text className="text-[#08415C] font-semibold text-sm">
                  {formatCents(e.amountCents)}
                </Text>
              </View>
            ))
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
