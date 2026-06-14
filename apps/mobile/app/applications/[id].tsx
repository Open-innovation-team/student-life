import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Application,
  ApplicationInput,
  deleteApplication,
  getApplication,
  updateApplication,
} from '../../lib/api';
import { SheetHeader } from '../../components/sheet-header';
import { ApplicationForm } from '../../components/application-form';
import { DocumentSelect } from '../../components/document-select';

function confirmDelete(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('Supprimer cette candidature ?')) onConfirm();
  } else {
    Alert.alert('Supprimer la candidature', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setApplication(await getApplication(id));
    } catch {
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSave = async (input: ApplicationInput) => {
    await updateApplication(id, input);
    router.back();
  };

  const attach = async (
    field: 'cvDocumentId' | 'lmDocumentId',
    documentId: string | null,
  ) => {
    const patch: Partial<ApplicationInput> =
      field === 'cvDocumentId'
        ? { cvDocumentId: documentId ?? '' }
        : { lmDocumentId: documentId ?? '' };
    setApplication(await updateApplication(id, patch));
  };

  const handleDelete = () =>
    confirmDelete(async () => {
      await deleteApplication(id);
      router.back();
    });

  if (loading) {
    return (
      <View className="flex-1 bg-[#E5FCFF] items-center justify-center">
        <ActivityIndicator color="#08415C" />
      </View>
    );
  }

  if (!application) {
    return (
      <View className="flex-1 bg-[#E5FCFF] px-5">
        <SheetHeader title="Candidature" />
        <Text className="text-gray-400">Candidature introuvable.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#E5FCFF] px-5">
      <SheetHeader title="Candidature" subtitle={application.company} />
      <ApplicationForm
        initial={{
          company: application.company,
          position: application.position,
          platform: application.platform ?? '',
          status: application.status,
          sentAt: new Date(application.sentAt),
          notes: application.notes ?? '',
        }}
        submitLabel="Enregistrer"
        onSubmit={handleSave}
        footer={
          <View className="mt-6">
            {application.needsFollowUp && (
              <View className="bg-[#E76F51]/10 rounded-2xl p-3 mb-4 flex-row items-center gap-2">
                <Ionicons name="alarm-outline" size={18} color="#E76F51" />
                <Text className="text-[#E76F51] text-sm flex-1">
                  Sans réponse depuis 14 jours — pense à relancer.
                </Text>
              </View>
            )}

            <Text className="text-[#08415C] font-semibold mb-2">
              Pièces jointes
            </Text>
            <DocumentSelect
              label="CV"
              value={application.cvDocumentId}
              onChange={(d) => attach('cvDocumentId', d)}
            />
            <DocumentSelect
              label="Lettre de motivation"
              value={application.lmDocumentId}
              onChange={(d) => attach('lmDocumentId', d)}
            />

            <TouchableOpacity
              onPress={handleDelete}
              className="flex-row items-center justify-center gap-2 py-4 mt-4"
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text className="text-red-500 font-medium">
                Supprimer la candidature
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
