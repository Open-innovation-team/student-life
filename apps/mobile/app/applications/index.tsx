import { useCallback, useRef, useState } from 'react';
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
import {
  Application,
  ApplicationStats,
  applicationStats,
  applicationsExportUrl,
  listApplications,
  updateApplication,
} from '../../lib/api';
import { exportCsv } from '../../utils/export';
import { notifyLocal } from '../../utils/notify';
import { ApplicationStatsSummary } from '../../components/application-stats';
import { KanbanBoard } from '../../components/kanban-board';

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title} : ${message}`);
  else Alert.alert(title, message);
}

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const notified = useRef(false);

  const load = useCallback(async () => {
    try {
      const [apps, summary] = await Promise.all([
        listApplications(),
        applicationStats(),
      ]);
      setApplications(apps);
      setStats(summary);

      const toFollow = apps.filter((a) => a.needsFollowUp).length;
      if (toFollow > 0 && !notified.current) {
        notified.current = true;
        await notifyLocal(
          'Candidatures à relancer',
          `${toFollow} candidature${toFollow > 1 ? 's' : ''} sans réponse depuis 14 jours.`,
        );
      }
    } catch {
      setApplications([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const changeStatus = async (application: Application, status: string) => {
    try {
      await updateApplication(application.id, { status });
      await load();
    } catch (err) {
      notify('Erreur', (err as Error).message);
    }
  };

  const handleExport = async () => {
    try {
      await exportCsv(applicationsExportUrl(), 'candidatures.csv');
    } catch (err) {
      notify('Export impossible', (err as Error).message);
    }
  };

  return (
    <View className="flex-1 bg-[#E5FCFF]">
      <View className="bg-[#08415C] pt-14 pb-6 px-5 rounded-b-3xl">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg">Mes candidatures</Text>
          <TouchableOpacity onPress={handleExport} hitSlop={8}>
            <Ionicons name="download-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {stats && <ApplicationStatsSummary stats={stats} />}

        <TouchableOpacity
          className="bg-[#08415C] rounded-2xl py-3 items-center my-4 flex-row justify-center gap-2"
          onPress={() => router.push('/applications/new')}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text className="text-white font-semibold">Nouvelle candidature</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color="#08415C" className="mt-8" />
        ) : applications.length === 0 ? (
          <View className="items-center mt-12">
            <Ionicons name="briefcase-outline" color="#9ca3af" size={48} />
            <Text className="text-gray-400 mt-2 text-center">
              Aucune candidature.{'\n'}Ajoute ta première candidature !
            </Text>
          </View>
        ) : (
          <KanbanBoard
            applications={applications}
            onOpen={(a) => router.push(`/applications/${a.id}`)}
            onChangeStatus={changeStatus}
          />
        )}
      </ScrollView>
    </View>
  );
}
