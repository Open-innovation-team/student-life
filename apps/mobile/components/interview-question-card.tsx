import { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import type { InterviewQuestion } from '../lib/api';

type Props = {
  question: InterviewQuestion;
  onSave: (answer: string) => Promise<void>;
};

const inputClass =
  'bg-[#F7FEFF] rounded-xl px-3 py-2.5 text-[#08415C] border border-gray-100 mt-2';

export function InterviewQuestionCard({ question, onSave }: Props) {
  const [answer, setAnswer] = useState(question.answer ?? '');
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    if (answer.trim() === (question.answer ?? '').trim()) return;
    setSaving(true);
    try {
      await onSave(answer);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="text-[#08415C] font-semibold flex-1">
          {question.question}
        </Text>
        {question.source === 'ai' && (
          <View className="bg-[#C490D1]/20 rounded-full px-2 py-0.5">
            <Text className="text-[#7B4B8A] text-[10px] font-medium">IA</Text>
          </View>
        )}
      </View>

      <TextInput
        className={`${inputClass} h-24`}
        placeholder="Ta réponse préparée…"
        placeholderTextColor="#9ca3af"
        value={answer}
        onChangeText={setAnswer}
        onBlur={handleBlur}
        multiline
        textAlignVertical="top"
      />

      {saving && (
        <View className="flex-row items-center gap-2 mt-2">
          <ActivityIndicator size="small" color="#08415C" />
          <Text className="text-gray-400 text-xs">Enregistrement…</Text>
        </View>
      )}
    </View>
  );
}
