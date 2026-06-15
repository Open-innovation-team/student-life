import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { InterviewQuestion, getInterviewPrep } from '../../lib/api';
import { interviewCategoryColor } from '../../utils/interview';
import { InterviewTimer } from '../../components/interview-timer';

export default function InterviewTrainingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [draft, setDraft] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const prep = await getInterviewPrep(id);
        if (!cancelled) setQuestions(prep);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const question = questions[current];

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrent((c) => c + 1);
    setDraft('');
    setRevealed(false);
  };

  const handleRestart = () => {
    setCurrent(0);
    setDraft('');
    setRevealed(false);
    setFinished(false);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#E5FCFF] items-center justify-center">
        <ActivityIndicator color="#08415C" size="large" />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View className="flex-1 bg-[#E5FCFF] items-center justify-center px-8">
        <Ionicons name="briefcase-outline" color="#9ca3af" size={48} />
        <Text className="text-gray-500 text-center mt-3">
          Aucune question à préparer.
        </Text>
        <TouchableOpacity
          className="bg-[#08415C] rounded-xl px-6 py-3 mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (finished) {
    return (
      <View className="flex-1 bg-[#E5FCFF] items-center justify-center px-8">
        <Ionicons name="trophy" color="#08415C" size={56} />
        <Text className="text-[#08415C] text-2xl font-bold mt-4">
          Entraînement terminé
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          Tu as parcouru {questions.length} question
          {questions.length > 1 ? 's' : ''}.
        </Text>
        <TouchableOpacity
          className="bg-[#08415C] rounded-xl px-8 py-4 mt-8 w-full items-center"
          onPress={handleRestart}
        >
          <Text className="text-white font-semibold">Recommencer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="border border-[#08415C] rounded-xl px-8 py-4 mt-3 w-full items-center"
          onPress={() => router.back()}
        >
          <Text className="text-[#08415C] font-semibold">
            Retour à la préparation
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#E5FCFF] pt-12">
      <View className="flex-row items-center px-4 mb-2 gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" color="#08415C" size={24} />
        </TouchableOpacity>
        <Text className="text-[#08415C] font-bold flex-1">
          Question {current + 1} / {questions.length}
        </Text>
        <InterviewTimer resetKey={current} />
      </View>
      <View className="h-2 bg-white rounded-full mx-4 mb-4 overflow-hidden">
        <View
          className="h-2 bg-[#08415C] rounded-full"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </View>

      <ScrollView
        className="flex-1 px-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <View
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: interviewCategoryColor(question.category),
              }}
            />
            <Text className="text-gray-400 text-xs">{question.category}</Text>
          </View>
          <Text className="text-[#08415C] font-bold text-lg">
            {question.question}
          </Text>
        </View>

        <Text className="text-[#08415C] font-semibold mb-2">
          Ta réponse de tête
        </Text>
        <TextInput
          className="bg-white rounded-2xl px-4 py-3.5 text-[#08415C] border border-gray-100 h-32"
          placeholder="Réponds à voix haute ou note tes idées…"
          placeholderTextColor="#9ca3af"
          value={draft}
          onChangeText={setDraft}
          multiline
          textAlignVertical="top"
        />

        {revealed ? (
          <View className="bg-[#08415C]/5 border border-[#08415C]/20 rounded-2xl p-4 mt-4">
            <Text className="text-[#08415C] font-semibold mb-1">
              Ta préparation
            </Text>
            <Text className="text-gray-600 leading-5">
              {(question.answer ?? '').trim() ||
                'Aucune réponse préparée pour cette question.'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            className="border border-[#08415C] rounded-xl items-center py-4 mt-4"
            onPress={() => setRevealed(true)}
          >
            <Text className="text-[#08415C] font-semibold">
              Voir ma préparation
            </Text>
          </TouchableOpacity>
        )}

        {revealed && (
          <TouchableOpacity
            className="bg-[#08415C] rounded-xl items-center py-4 mt-4"
            onPress={handleNext}
          >
            <Text className="text-white font-semibold">
              {current + 1 >= questions.length
                ? "Terminer l'entraînement"
                : 'Question suivante'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
