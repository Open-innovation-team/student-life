import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DashboardCategory } from '../lib/api';
import { categoryColor, categoryIcon, formatCents } from '../utils';

function PreviousComparison({ delta }: { delta: number }) {
  if (delta === 0) {
    return <Text className="text-gray-400 text-xs">= vs mois préc.</Text>;
  }
  const up = delta > 0;
  return (
    <Text className={`text-xs ${up ? 'text-red-500' : 'text-green-600'}`}>
      {up ? '▲' : '▼'} {formatCents(Math.abs(delta))} vs mois préc.
    </Text>
  );
}

export function BudgetCategoryRow({ item }: { item: DashboardCategory }) {
  const { category, spentCents, budgetCents, previousSpentCents } = item;
  const color = categoryColor(category);
  const over = budgetCents !== null && spentCents > budgetCents;
  const percent =
    budgetCents && budgetCents > 0
      ? Math.min(100, Math.round((spentCents / budgetCents) * 100))
      : null;

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center gap-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: `${color}22` }}
        >
          <Ionicons name={categoryIcon(category)} size={20} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-[#08415C] font-semibold">{category}</Text>
          <PreviousComparison delta={spentCents - previousSpentCents} />
        </View>
        <View className="items-end">
          <Text
            className={`font-bold ${over ? 'text-red-500' : 'text-[#08415C]'}`}
            style={{ fontVariant: ['tabular-nums'] }}
          >
            {formatCents(spentCents)}
          </Text>
          {budgetCents !== null && (
            <Text className="text-gray-400 text-xs">
              / {formatCents(budgetCents)}
            </Text>
          )}
        </View>
      </View>

      {percent !== null && (
        <View className="mt-3 bg-gray-100 rounded-full h-2">
          <View
            className="rounded-full h-2"
            style={{
              width: `${percent}%`,
              backgroundColor: over ? '#ef4444' : color,
            }}
          />
        </View>
      )}
    </View>
  );
}
