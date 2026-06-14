import { View } from 'react-native';
import { router } from 'expo-router';
import { ExpenseForm } from '../../components/expense-form';
import { SheetHeader } from '../../components/sheet-header';
import { createExpense, ExpenseInput } from '../../lib/api';
import { notifyBudgetAlert } from '../../utils/notify';

export default function NewExpenseScreen() {
  const handleSubmit = async (input: ExpenseInput) => {
    const created = await createExpense(input);
    await notifyBudgetAlert(created.alert);
    router.back();
  };

  return (
    <View className="flex-1 bg-[#E5FCFF] px-5">
      <SheetHeader title="Nouvelle dépense" />
      <ExpenseForm submitLabel="Ajouter la dépense" onSubmit={handleSubmit} />
    </View>
  );
}
