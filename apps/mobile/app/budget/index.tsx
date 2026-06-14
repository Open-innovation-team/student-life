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
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BudgetDashboard, getBudgetDashboard } from '../../lib/api';
import { categoryColor, currentMonth, formatCents } from '../../utils';
import { exportMonthCsv } from '../../utils/export';
import { MonthSelector } from '../../components/month-selector';
import { DonutChart } from '../../components/charts/donut-chart';
import { BarChart } from '../../components/charts/bar-chart';
import { BudgetCategoryRow } from '../../components/budget-category-row';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title} : ${message}`);
  else Alert.alert(title, message);
}

export default function BudgetDashboardScreen() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<BudgetDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getBudgetDashboard(month));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleExport = async () => {
    try {
      await exportMonthCsv(month);
    } catch (err) {
      notify('Export impossible', (err as Error).message);
    }
  };

  const spentCategories =
    data?.categories.filter((c) => c.spentCents > 0) ?? [];
  const remaining = data?.remainingCents ?? null;

  return (
    <View className="flex-1 bg-[#E5FCFF]">
      <View className="bg-[#08415C] pt-14 pb-6 px-5 rounded-b-3xl">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg">Budget</Text>
          <TouchableOpacity onPress={handleExport} hitSlop={8}>
            <Ionicons name="download-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <MonthSelector month={month} onChange={setMonth} />

        <View className="flex-row justify-between items-end mt-5">
          <View>
            <Text className="text-white/70 text-xs">Dépensé</Text>
            <Text
              className="text-white text-3xl font-bold"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatCents(data?.totalSpentCents ?? 0)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-white/70 text-xs">Reste à dépenser</Text>
            <Text
              className={`text-lg font-semibold ${
                remaining !== null && remaining < 0
                  ? 'text-red-300'
                  : 'text-white'
              }`}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {remaining === null ? '—' : formatCents(remaining)}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <TouchableOpacity
          className="bg-[#C490D1] rounded-2xl py-3 items-center mb-4 flex-row justify-center gap-2"
          onPress={() =>
            router.push({ pathname: '/budget/edit', params: { month } })
          }
        >
          <Ionicons name="options-outline" size={18} color="#fff" />
          <Text className="text-white font-semibold">Définir mes budgets</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color="#08415C" className="mt-8" />
        ) : spentCategories.length === 0 ? (
          <View className="items-center mt-12">
            <Ionicons name="pie-chart-outline" color="#9ca3af" size={48} />
            <Text className="text-gray-400 mt-2 text-center">
              Aucune dépense ce mois-ci.
            </Text>
          </View>
        ) : (
          <>
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm items-center">
              <Text className="text-[#08415C] font-bold text-lg self-start mb-3">
                Répartition
              </Text>
              <View className="relative items-center justify-center">
                <DonutChart
                  segments={spentCategories.map((c) => ({
                    value: c.spentCents,
                    color: categoryColor(c.category),
                  }))}
                />
                <View className="absolute items-center">
                  <Text className="text-gray-400 text-xs">Total</Text>
                  <Text
                    className="text-[#08415C] font-bold text-lg"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    {formatCents(data?.totalSpentCents ?? 0)}
                  </Text>
                </View>
              </View>
              <View className="w-full mt-4 gap-2">
                {spentCategories.map((c) => (
                  <View
                    key={c.category}
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColor(c.category) }}
                      />
                      <Text className="text-gray-600 text-sm">
                        {c.category}
                      </Text>
                    </View>
                    <Text
                      className="text-[#08415C] text-sm font-medium"
                      style={{ fontVariant: ['tabular-nums'] }}
                    >
                      {formatCents(c.spentCents)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-[#08415C] font-bold text-lg mb-3">
                Par semaine
              </Text>
              <BarChart
                data={(data?.weekly ?? []).map((w) => ({
                  label: `S${w.week}`,
                  value: w.amountCents,
                }))}
              />
            </View>

            <Text className="text-[#08415C] font-bold text-lg mb-3">
              Par catégorie
            </Text>
            {data?.categories.map((c) => (
              <BudgetCategoryRow key={c.category} item={c} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
