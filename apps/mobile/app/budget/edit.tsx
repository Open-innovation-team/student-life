import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listBudgets, listCategories, upsertBudget } from '../../lib/api';
import {
  categoryIcon,
  currentMonth,
  formatMonthLabel,
  parseAmountToCents,
} from '../../utils';
import { SheetHeader } from '../../components/sheet-header';
import { MoneyInput } from '../../components/money-input';

const GLOBAL_KEY = '__global__';

function centsToInput(cents: number): string {
  return cents ? (cents / 100).toFixed(2).replace('.', ',') : '';
}

export default function BudgetEditScreen() {
  const params = useLocalSearchParams<{ month?: string }>();
  const month = params.month ?? currentMonth();

  const [categories, setCategories] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, budgets] = await Promise.all([
          listCategories(),
          listBudgets(month),
        ]);
        const values: Record<string, string> = {};
        for (const b of budgets) {
          values[b.category ?? GLOBAL_KEY] = centsToInput(b.amountCents);
        }
        const names = [
          ...new Set([
            ...cats.predefined,
            ...cats.custom.map((c) => c.name),
            ...budgets
              .filter((b) => b.category)
              .map((b) => b.category as string),
          ]),
        ];
        setCategories(names);
        setAmounts(values);
        setInitial(values);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  const setAmount = (key: string, value: string) =>
    setAmounts((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const keys = [GLOBAL_KEY, ...categories];
      const tasks = keys
        .filter((key) => (amounts[key] ?? '') !== (initial[key] ?? ''))
        .map((key) =>
          upsertBudget({
            month,
            category: key === GLOBAL_KEY ? null : key,
            amountCents: parseAmountToCents(amounts[key] ?? '') ?? 0,
          }),
        );
      await Promise.all(tasks);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#E5FCFF] px-5">
      <SheetHeader title="Mes budgets" subtitle={formatMonthLabel(month)} />

      {loading ? (
        <ActivityIndicator color="#08415C" className="mt-8" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <Text className="text-[#08415C] font-semibold mb-1">
              Budget mensuel global
            </Text>
            <Text className="text-gray-400 text-xs mb-3">
              Optionnel — toutes catégories confondues
            </Text>
            <MoneyInput
              value={amounts[GLOBAL_KEY] ?? ''}
              onChangeText={(v) => setAmount(GLOBAL_KEY, v)}
            />
          </View>

          <Text className="text-[#08415C] font-semibold mb-2">
            Par catégorie
          </Text>
          {categories.map((cat) => (
            <View
              key={cat}
              className="bg-white rounded-2xl p-3 mb-2 flex-row items-center gap-3 border border-gray-100"
            >
              <Ionicons name={categoryIcon(cat)} size={20} color="#08415C" />
              <Text className="flex-1 text-[#08415C]">{cat}</Text>
              <View className="w-28">
                <MoneyInput
                  value={amounts[cat] ?? ''}
                  onChangeText={(v) => setAmount(cat, v)}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-[#08415C] rounded-2xl items-center py-4 mt-4 shadow-sm"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Enregistrer
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
