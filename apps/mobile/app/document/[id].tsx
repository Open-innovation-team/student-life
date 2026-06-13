import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  DocumentItem,
  Summary,
  getDocument,
  summarizeDocument,
} from '../../lib/api';

const QUESTION_COUNTS = [5, 10, 20];

function showError(message: string) {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert('Erreur', message);
  }
}

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const doc = await getDocument(id);
        setDocument(doc);
        setSummary(doc.summaries?.[0] ?? null);
      } catch (err) {
        showError((err as Error).message);
        router.back();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSummarize = async (refresh: boolean) => {
    setSummarizing(true);
    try {
      setSummary(await summarizeDocument(id, refresh));
    } catch (err) {
      showError((err as Error).message);
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#E5FCFF] items-center justify-center">
        <ActivityIndicator color="#08415C" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#E5FCFF] pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 mb-4 gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" color="#08415C" size={24} />
        </TouchableOpacity>
        <Text
          className="text-[#08415C] text-lg font-bold flex-1"
          numberOfLines={1}
        >
          {document?.filename}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Fiche synthèse */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="sparkles" color="#08415C" size={18} />
            <Text className="text-[#08415C] font-bold text-lg">
              Fiche synthèse
            </Text>
          </View>

          {summarizing ? (
            <View className="gap-3">
              {/* skeleton pendant la génération */}
              <View className="h-4 bg-gray-200 rounded-full w-3/4" />
              <View className="h-4 bg-gray-200 rounded-full w-full" />
              <View className="h-4 bg-gray-200 rounded-full w-5/6" />
              <View className="h-4 bg-gray-200 rounded-full w-2/3" />
              <Text className="text-gray-400 text-xs mt-1">
                Génération en cours… cela peut prendre quelques secondes.
              </Text>
            </View>
          ) : summary ? (
            <>
              <Markdown
                style={{
                  body: {
                    color: '#374151',
                    fontSize: 14,
                    lineHeight: 22,
                  },
                  heading1: {
                    color: '#08415C',
                    fontWeight: 'bold',
                    marginBottom: 4,
                  },
                  heading2: {
                    color: '#08415C',
                    fontWeight: 'bold',
                    marginBottom: 4,
                  },
                  heading3: {
                    color: '#08415C',
                    fontWeight: '600',
                  },
                  strong: { fontWeight: 'bold' },
                  bullet_list: { marginVertical: 4 },
                  ordered_list: { marginVertical: 4 },
                }}
              >
                {summary.content}
              </Markdown>
              <TouchableOpacity
                className="border border-[#08415C] rounded-xl items-center py-3 mt-4"
                onPress={() => handleSummarize(true)}
              >
                <Text className="text-[#08415C] font-semibold">
                  Régénérer la fiche
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              className="bg-[#08415C] rounded-xl items-center py-4"
              onPress={() => handleSummarize(false)}
            >
              <Text className="text-white font-semibold">
                Résumer avec l&apos;IA
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quiz */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="help-circle" color="#08415C" size={20} />
            <Text className="text-[#08415C] font-bold text-lg">Quiz</Text>
          </View>
          <Text className="text-gray-500 text-sm mb-3">
            Génère un QCM à partir du contenu du document.
          </Text>
          <View className="flex-row gap-3">
            {QUESTION_COUNTS.map((nb) => (
              <TouchableOpacity
                key={nb}
                className="flex-1 bg-[#08415C] rounded-xl items-center py-3"
                onPress={() =>
                  router.push({
                    pathname: '/quiz/[id]',
                    params: { id, nb: String(nb) },
                  })
                }
              >
                <Text className="text-white font-semibold">{nb}</Text>
                <Text className="text-white/70 text-xs">questions</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
