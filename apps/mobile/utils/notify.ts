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

export async function notifyLocal(title: string, body: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!(await ensurePermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

export async function notifyBudgetAlert(
  alert: BudgetAlert | null,
): Promise<void> {
  if (!alert) return;
  const exceeded = alert.level === 'exceeded';
  await notifyLocal(
    exceeded
      ? `Budget ${alert.category} dépassé 🚨`
      : `Budget ${alert.category} à 80% ⚠️`,
    `${formatCents(alert.spentCents)} dépensés sur ${formatCents(alert.budgetCents)}.`,
  );
}
