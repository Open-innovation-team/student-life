import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  title: string;
  subtitle?: string;
};

export function SheetHeader({ title, subtitle }: Props) {
  return (
    <View className="pt-3 pb-5">
      <View className="self-center w-10 h-1.5 rounded-full bg-gray-200 mb-5" />
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-[#08415C] text-2xl font-bold">{title}</Text>
          {subtitle && (
            <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="close" size={20} color="#08415C" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
