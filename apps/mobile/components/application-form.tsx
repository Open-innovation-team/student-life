import { ReactNode, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ApplicationInput } from '../lib/api';
import { PLATFORMS } from '../utils';
import { DateField } from './date-field';
import { StatusPicker } from './status-picker';

export type ApplicationFormValues = {
  company: string;
  position: string;
  platform: string;
  status: string;
  sentAt: Date;
  notes: string;
};

type Props = {
  initial?: Partial<ApplicationFormValues>;
  submitLabel: string;
  onSubmit: (input: ApplicationInput) => Promise<void>;
  footer?: ReactNode;
};

const inputClass =
  'bg-white rounded-2xl px-4 py-3.5 text-[#08415C] border border-gray-100';

export function ApplicationForm({
  initial,
  submitLabel,
  onSubmit,
  footer,
}: Props) {
  const [company, setCompany] = useState(initial?.company ?? '');
  const [position, setPosition] = useState(initial?.position ?? '');
  const [platform, setPlatform] = useState(initial?.platform ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'Envoyée');
  const [sentAt, setSentAt] = useState(initial?.sentAt ?? new Date());
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!company.trim() || !position.trim()) {
      setError('Entreprise et poste sont obligatoires');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        company: company.trim(),
        position: position.trim(),
        platform: platform.trim() || undefined,
        status,
        sentAt: sentAt.toISOString(),
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <Text className="text-[#08415C] font-semibold mb-2">Entreprise</Text>
      <TextInput
        className={inputClass}
        placeholder="Ex : Google"
        placeholderTextColor="#9ca3af"
        value={company}
        onChangeText={setCompany}
      />

      <Text className="text-[#08415C] font-semibold mb-2 mt-4">Poste</Text>
      <TextInput
        className={inputClass}
        placeholder="Ex : Alternant développeur"
        placeholderTextColor="#9ca3af"
        value={position}
        onChangeText={setPosition}
      />

      <Text className="text-[#08415C] font-semibold mb-2 mt-4">
        Plateforme{' '}
        <Text className="text-gray-400 font-normal">(optionnel)</Text>
      </Text>
      <TextInput
        className={inputClass}
        placeholder="LinkedIn, Indeed…"
        placeholderTextColor="#9ca3af"
        value={platform}
        onChangeText={setPlatform}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
      >
        {PLATFORMS.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPlatform(p)}
            className="bg-[#E5FCFF] rounded-full px-3 py-1.5"
          >
            <Text className="text-[#08415C] text-sm">{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text className="text-[#08415C] font-semibold mb-2 mt-2">
        Date d&apos;envoi
      </Text>
      <DateField value={sentAt} onChange={setSentAt} />

      <Text className="text-[#08415C] font-semibold mb-2 mt-4">Statut</Text>
      <View className="flex-row">
        <StatusPicker value={status} onChange={setStatus} />
      </View>

      <Text className="text-[#08415C] font-semibold mb-2 mt-4">
        Notes <Text className="text-gray-400 font-normal">(optionnel)</Text>
      </Text>
      <TextInput
        className={`${inputClass} h-28`}
        placeholder="Retours, contacts, impressions…"
        placeholderTextColor="#9ca3af"
        value={notes}
        onChangeText={setNotes}
        multiline
        textAlignVertical="top"
      />

      {error && <Text className="text-red-500 text-sm mt-4">{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className="bg-[#08415C] rounded-2xl items-center py-4 mt-6 shadow-sm"
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">
            {submitLabel}
          </Text>
        )}
      </TouchableOpacity>

      {footer}
    </ScrollView>
  );
}
