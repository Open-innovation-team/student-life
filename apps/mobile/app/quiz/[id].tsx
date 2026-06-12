import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { QuizQuestion, generateQuiz } from '../../lib/api';

export default function QuizScreen() {
  const { id, nb } = useLocalSearchParams<{ id: string; nb?: string }>();
  const nbQuestions = Number(nb ?? 5);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const quiz = await generateQuiz(id, nbQuestions);
        if (!cancelled) setQuestions(quiz.questions);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, nbQuestions]);

  const question = questions[current];
  const revealed = selected !== null;

  const handleSelect = (index: number) => {
    if (revealed) return;
    setSelected(index);
    if (index === question.bonneReponse) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  // Chargement / erreur
  if (error || questions.length === 0) {
    return (
      <View className="flex-1 bg-[#E5FCFF] items-center justify-center px-8">
        {error ? (
          <>
            <Ionicons name="alert-circle" color="#ef4444" size={48} />
            <Text className="text-gray-600 text-center mt-3">{error}</Text>
            <TouchableOpacity
              className="bg-[#08415C] rounded-xl px-6 py-3 mt-6"
              onPress={() => router.back()}
            >
              <Text className="text-white font-semibold">Retour</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator color="#08415C" size="large" />
            <Text className="text-[#08415C] font-semibold mt-4">
              Génération du quiz…
            </Text>
            <Text className="text-gray-400 text-center mt-2 text-sm">
              L&apos;IA prépare {nbQuestions} questions, cela peut prendre
              quelques secondes.
            </Text>
          </>
        )}
      </View>
    );
  }

  // Écran de score final
  if (finished) {
    const ratio = score / questions.length;
    return (
      <View className="flex-1 bg-[#E5FCFF] items-center justify-center px-8">
        <Ionicons
          name={ratio >= 0.5 ? 'trophy' : 'school'}
          color="#08415C"
          size={56}
        />
        <Text className="text-[#08415C] text-2xl font-bold mt-4">
          {score} / {questions.length}
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          {ratio === 1
            ? 'Parfait, tout est maîtrisé !'
            : ratio >= 0.5
              ? 'Bien joué, continue comme ça !'
              : 'Relis ta fiche synthèse et réessaie !'}
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
            Retour au document
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#E5FCFF] pt-12">
      {/* Header + progression */}
      <View className="flex-row items-center px-4 mb-2 gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="close" color="#08415C" size={24} />
        </TouchableOpacity>
        <Text className="text-[#08415C] font-bold flex-1">
          Question {current + 1} / {questions.length}
        </Text>
        <Text className="text-[#08415C] font-semibold">Score : {score}</Text>
      </View>
      <View className="h-2 bg-white rounded-full mx-4 mb-4 overflow-hidden">
        <View
          className="h-2 bg-[#08415C] rounded-full"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <Text className="text-[#08415C] font-bold text-lg">
            {question.question}
          </Text>
        </View>

        {question.choix.map((choice, index) => {
          let style = 'bg-white border border-gray-200';
          if (revealed) {
            if (index === question.bonneReponse) {
              style = 'bg-green-100 border border-green-500';
            } else if (index === selected) {
              style = 'bg-red-100 border border-red-500';
            }
          }
          return (
            <TouchableOpacity
              key={index}
              className={`${style} rounded-2xl p-4 mb-3 flex-row items-center gap-3`}
              onPress={() => handleSelect(index)}
              disabled={revealed}
            >
              <View className="w-7 h-7 rounded-full bg-[#E5FCFF] items-center justify-center">
                <Text className="text-[#08415C] font-bold text-xs">
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <Text className="text-gray-700 flex-1">{choice}</Text>
              {revealed && index === question.bonneReponse && (
                <Ionicons name="checkmark-circle" color="#22c55e" size={22} />
              )}
              {revealed &&
                index === selected &&
                index !== question.bonneReponse && (
                  <Ionicons name="close-circle" color="#ef4444" size={22} />
                )}
            </TouchableOpacity>
          );
        })}

        {revealed && (
          <>
            <View className="bg-[#08415C]/5 border border-[#08415C]/20 rounded-2xl p-4 mt-1">
              <Text className="text-[#08415C] font-semibold mb-1">
                Explication
              </Text>
              <Text className="text-gray-600 leading-5">
                {question.explication}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-[#08415C] rounded-xl items-center py-4 mt-4"
              onPress={handleNext}
            >
              <Text className="text-white font-semibold">
                {current + 1 >= questions.length
                  ? 'Voir le score'
                  : 'Question suivante'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
