import { View } from 'react-native';
import { router } from 'expo-router';
import { ExpenseForm } from '../../components/expense-form';
import { SheetHeader } from '../../components/sheet-header';
import { createExpense, ExpenseInput } from '../../lib/api';

export default function NewExpenseScreen() {
  const handleSubmit = async (input: ExpenseInput) => {
    await createExpense(input);
    router.back();
  };

  return (
    <View className="flex-1 bg-[#E5FCFF] px-5">
      <SheetHeader title="Nouvelle dépense" />
      <ExpenseForm submitLabel="Ajouter la dépense" onSubmit={handleSubmit} />
    </View>
  );
}
