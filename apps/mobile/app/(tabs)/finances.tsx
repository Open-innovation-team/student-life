import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Expense,
  ExpenseSort,
  SortOrder,
  deleteExpense,
  listExpenses,
} from '../../lib/api';
import { categoryIcon, formatCents } from '../../utils';

const SORTS: { key: ExpenseSort; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Montant' },
  { key: 'category', label: 'Catégorie' },
];

function confirmDelete(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('Supprimer cette dépense ?')) onConfirm();
  } else {
    Alert.alert('Supprimer la dépense', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export default function FinancesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sort, setSort] = useState<ExpenseSort>('date');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setExpenses(await listExpenses(sort, order));
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [sort, order]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const changeSort = (key: ExpenseSort) => {
    if (key === sort) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setOrder(key === 'category' ? 'asc' : 'desc');
    }
  };

  const handleEdit = (e: Expense) =>
    router.push({
      pathname: '/expense/[id]',
      params: {
        id: e.id,
        amountCents: String(e.amountCents),
        category: e.category,
        label: e.label ?? '',
        date: e.date,
      },
    });

  const handleDelete = (e: Expense) =>
    confirmDelete(async () => {
      try {
        await deleteExpense(e.id);
        setExpenses((list) => list.filter((x) => x.id !== e.id));
      } catch {
        // ignore
      }
    });

  const total = expenses.reduce((sum, e) => sum + e.amountCents, 0);

  return (
    <View className="flex-1 bg-[#E5FCFF]">
      <View className="bg-[#08415C] pt-16 pb-7 px-6 rounded-b-3xl">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-white/70 text-sm">Total des dépenses</Text>
            <Text
              className="text-white text-4xl font-bold mt-1"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatCents(total)}
            </Text>
            <Text className="text-white/50 text-xs mt-1">
              {expenses.length} transaction{expenses.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/budget')}
            className="flex-row items-center gap-1.5 bg-white/15 rounded-full px-3 py-2"
          >
            <Ionicons name="pie-chart" size={16} color="#fff" />
            <Text className="text-white text-sm font-medium">Budget</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 px-4 pt-4">
        <View className="flex-row bg-white rounded-full p-1 mb-4 border border-gray-100">
          {SORTS.map(({ key, label }) => {
            const active = key === sort;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => changeSort(key)}
                className={`flex-1 flex-row items-center justify-center gap-1 py-2 rounded-full ${
                  active ? 'bg-[#08415C]' : ''
                }`}
              >
                <Text
                  className={
                    active
                      ? 'text-white text-sm font-medium'
                      : 'text-gray-500 text-sm'
                  }
                >
                  {label}
                </Text>
                {active && (
                  <Ionicons
                    name={order === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={13}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color="#08415C" className="mt-8" />
        ) : expenses.length === 0 ? (
          <View className="items-center mt-12">
            <Ionicons name="wallet-outline" color="#9ca3af" size={48} />
            <Text className="text-gray-400 mt-2 text-center">
              Aucune dépense.{'\n'}Touche le bouton + pour en ajouter une !
            </Text>
          </View>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 96 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                activeOpacity={0.7}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center gap-3"
              >
                <View className="w-11 h-11 rounded-xl bg-[#E5FCFF] items-center justify-center">
                  <Ionicons
                    name={categoryIcon(item.category)}
                    color="#08415C"
                    size={20}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[#08415C] font-semibold"
                    numberOfLines={1}
                  >
                    {item.label || item.category}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {item.category} ·{' '}
                    {new Date(item.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text
                  className="text-[#08415C] font-bold mr-1"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatCents(item.amountCents)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  hitSlop={8}
                  className="p-2"
                >
                  <Ionicons name="trash-outline" color="#ef4444" size={20} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
