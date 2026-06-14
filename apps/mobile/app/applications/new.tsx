import { View } from 'react-native';
import { router } from 'expo-router';
import { ApplicationForm } from '../../components/application-form';
import { SheetHeader } from '../../components/sheet-header';
import { ApplicationInput, createApplication } from '../../lib/api';

export default function NewApplicationScreen() {
  const handleSubmit = async (input: ApplicationInput) => {
    await createApplication(input);
    router.back();
  };

  return (
    <View className="flex-1 bg-[#E5FCFF] px-5">
      <SheetHeader title="Nouvelle candidature" />
      <ApplicationForm submitLabel="Ajouter" onSubmit={handleSubmit} />
    </View>
  );
}
