import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Application,
  InterviewQuestion,
  generateInterviewQuestions,
  getApplication,
  getInterviewPrep,
  saveInterviewAnswer,
} from '../../lib/api';
import {
  answeredCount,
  groupByCategory,
  interviewCategoryColor,
} from '../../utils/interview';
import { exportInterviewPdf } from '../../utils/interview-export';
import { InterviewQuestionCard } from '../../components/interview-question-card';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title} : ${message}`);
  else Alert.alert(title, message);
}

export default function InterviewPrepScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [app, prep] = await Promise.all([
        getApplication(id),
        getInterviewPrep(id),
      ]);
      setApplication(app);
      setQuestions(prep);
    } catch {
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSave = async (questionId: string, answer: string) => {
    const updated = await saveInterviewAnswer(id, questionId, answer);
    setQuestions((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q)),
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const created = await generateInterviewQuestions(id);
      setQuestions((prev) => [...prev, ...created]);
    } catch {
      notify(
        'Bientôt disponible',
        "La génération de questions par l'IA arrive prochainement.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    try {
      const title = application
        ? `${application.position} — ${application.company}`
        : 'Candidature';
      await exportInterviewPdf(title, groupByCategory(questions));
    } catch (err) {
      notify('Export impossible', (err as Error).message);
    }
  };

  const groups = groupByCategory(questions);
  const answered = answeredCount(questions);

  return (
    <View className="flex-1 bg-[#E5FCFF]">
      <View className="bg-[#08415C] pt-14 pb-6 px-5 rounded-b-3xl">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg">
            Préparer l&apos;entretien
          </Text>
          <TouchableOpacity onPress={handleExport} hitSlop={8}>
            <Ionicons name="download-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {application && (
          <Text className="text-white/70 text-sm mt-2">
            {application.position} · {application.company}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color="#08415C" className="mt-12" />
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 bg-[#08415C] rounded-2xl py-3 items-center flex-row justify-center gap-2"
              onPress={() => router.push(`/interview/training?id=${id}`)}
            >
              <Ionicons name="barbell-outline" size={18} color="#fff" />
              <Text className="text-white font-semibold">Entraînement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-white border border-[#08415C] rounded-2xl py-3 items-center flex-row justify-center gap-2"
              onPress={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#08415C" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={18} color="#08415C" />
                  <Text className="text-[#08415C] font-semibold">
                    Générer (IA)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-sm mb-2">
            {answered} / {questions.length} réponses préparées
          </Text>

          {groups.map((group) => (
            <View key={group.category} className="mb-2">
              <View className="flex-row items-center gap-2 mb-2 mt-2">
                <View
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: interviewCategoryColor(group.category),
                  }}
                />
                <Text className="text-[#08415C] font-bold">
                  {group.category}
                </Text>
              </View>
              {group.questions.map((question) => (
                <InterviewQuestionCard
                  key={question.id}
                  question={question}
                  onSave={(answer) => handleSave(question.id, answer)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
