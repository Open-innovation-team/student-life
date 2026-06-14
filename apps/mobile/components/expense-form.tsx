import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ExpenseInput } from '../lib/api';
import {
  getLabelSuggestions,
  parseAmountToCents,
  sanitizeAmountInput,
} from '../utils';
import { CategoryPicker } from './category-picker';
import { DateField } from './date-field';

export type ExpenseFormValues = {
  amount: string;
  category: string;
  label: string;
  date: Date;
};

type Props = {
  initial?: Partial<ExpenseFormValues>;
  submitLabel: string;
  onSubmit: (input: ExpenseInput) => Promise<void>;
};

export function ExpenseForm({ initial, submitLabel, onSubmit }: Props) {
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [date, setDate] = useState(initial?.date ?? new Date());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setSuggestions(await getLabelSuggestions());
      } catch {
        setSuggestions([]);
      }
    };
    loadSuggestions();
  }, []);

  const matchingSuggestions = label.trim()
    ? suggestions
        .filter(
          (s) =>
            s.toLowerCase().includes(label.trim().toLowerCase()) &&
            s.toLowerCase() !== label.trim().toLowerCase(),
        )
        .slice(0, 5)
    : [];

  const handleSubmit = async () => {
    const amountCents = parseAmountToCents(amount);
    if (amountCents === null) {
      setError('Montant invalide (ex : 4,50)');
      return;
    }
    if (!category) {
      setError('Choisis une catégorie');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        amountCents,
        category,
        label: label.trim() || undefined,
        date: date.toISOString(),
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
    >
      <View className="bg-white rounded-3xl py-6 mb-5 border border-gray-100 items-center shadow-sm">
        <Text className="text-gray-400 text-xs uppercase tracking-wide mb-2">
          Montant
        </Text>
        <View className="flex-row items-center justify-center">
          <TextInput
            style={{
              fontSize: 44,
              lineHeight: 52,
              fontWeight: '700',
              color: '#08415C',
              fontVariant: ['tabular-nums'],
              textAlign: 'center',
              minWidth: 100,
              padding: 0,
            }}
            placeholder="0,00"
            placeholderTextColor="#cbd5e1"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(text) => setAmount(sanitizeAmountInput(text))}
            autoFocus={!initial}
          />
          <Text
            style={{
              fontSize: 30,
              lineHeight: 52,
              fontWeight: '700',
              color: '#cbd5e1',
              marginLeft: 6,
            }}
          >
            €
          </Text>
        </View>
      </View>

      <Text className="text-[#08415C] font-semibold mb-2">Catégorie</Text>
      <View className="mb-5">
        <CategoryPicker value={category} onChange={setCategory} />
      </View>

      <Text className="text-[#08415C] font-semibold mb-2">
        Libellé <Text className="text-gray-400 font-normal">(optionnel)</Text>
      </Text>
      <TextInput
        className="bg-white rounded-2xl px-4 py-4 text-[#08415C] border border-gray-100"
        placeholder="Ex : Courses Carrefour"
        placeholderTextColor="#9ca3af"
        value={label}
        onChangeText={setLabel}
      />
      {matchingSuggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
        >
          {matchingSuggestions.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setLabel(s)}
              className="bg-[#E5FCFF] rounded-full px-3 py-1.5"
            >
              <Text className="text-[#08415C] text-sm">{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text className="text-[#08415C] font-semibold mb-2 mt-5">Date</Text>
      <DateField value={date} onChange={setDate} />

      {error && <Text className="text-red-500 text-sm mt-4">{error}</Text>}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className="bg-[#08415C] rounded-2xl items-center py-4 mt-6 mb-8 flex-row justify-center gap-2 shadow-sm"
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">
            {submitLabel}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
