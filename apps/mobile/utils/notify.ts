import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { BudgetAlert } from '../lib/api';
import { formatCents } from './money';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function notifyBudgetAlert(
  alert: BudgetAlert | null,
): Promise<void> {
  if (!alert || Platform.OS === 'web') return;
  if (!(await ensurePermission())) return;

  const exceeded = alert.level === 'exceeded';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: exceeded
        ? `Budget ${alert.category} dépassé 🚨`
        : `Budget ${alert.category} à 80% ⚠️`,
      body: `${formatCents(alert.spentCents)} dépensés sur ${formatCents(
        alert.budgetCents,
      )}.`,
    },
    trigger: null,
  });
}
