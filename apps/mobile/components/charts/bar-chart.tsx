import { View, Text } from 'react-native';
import { formatCents } from '../../utils';

export type Bar = { label: string; value: number };

export function BarChart({ data }: { data: Bar[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View className="flex-row justify-between gap-3 h-40">
      {data.map((bar) => (
        <View key={bar.label} className="flex-1 items-center">
          <View className="h-4 justify-end">
            {bar.value > 0 && (
              <Text
                className="text-[#08415C] text-[10px] font-semibold"
                numberOfLines={1}
              >
                {formatCents(bar.value)}
              </Text>
            )}
          </View>
          <View className="flex-1 w-full justify-end">
            <View
              className="w-full rounded-t-lg bg-[#08415C]"
              style={{ height: `${(bar.value / max) * 100}%`, minHeight: 4 }}
            />
          </View>
          <Text className="text-gray-400 text-[10px] mt-1">{bar.label}</Text>
        </View>
      ))}
    </View>
  );
}
