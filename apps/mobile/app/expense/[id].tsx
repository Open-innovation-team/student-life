import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ExpenseForm } from '../../components/expense-form';
import { SheetHeader } from '../../components/sheet-header';
import { ExpenseInput, updateExpense } from '../../lib/api';

export default function EditExpenseScreen() {
  const params = useLocalSearchParams<{
    id: string;
    amountCents: string;
    category: string;
    label: string;
    date: string;
  }>();

  const initial = {
    amount: (Number(params.amountCents) / 100).toFixed(2).replace('.', ','),
    category: params.category,
    label: params.label || '',
    date: new Date(params.date),
  };

  const handleSubmit = async (input: ExpenseInput) => {
    await updateExpense(params.id, input);
    router.back();
  };

  return (
    <View className="flex-1 bg-[#E5FCFF] px-5">
      <SheetHeader title="Modifier la dépense" />
      <ExpenseForm
        initial={initial}
        submitLabel="Enregistrer"
        onSubmit={handleSubmit}
      />
    </View>
  );
}
