import { View, Text } from 'react-native';
import { AppHeader } from '../../components/AppHeader';

export default function IAScreen() {
  return (
    <View className="flex-1 bg-[#E5FCFF]">
      <AppHeader title="Assistant IA" />

      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400 mt-2">Bientôt disponible</Text>
      </View>
    </View>
  );
}
