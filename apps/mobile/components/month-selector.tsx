import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMonthLabel, isCurrentMonth, shiftMonth } from '../utils';

type Props = {
  month: string;
  onChange: (month: string) => void;
};

export function MonthSelector({ month, onChange }: Props) {
  const atCurrent = isCurrentMonth(month);

  return (
    <View className="flex-row items-center justify-between">
      <TouchableOpacity
        onPress={() => onChange(shiftMonth(month, -1))}
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text className="text-white text-base font-semibold capitalize">
        {formatMonthLabel(month)}
      </Text>
      <TouchableOpacity
        onPress={() => onChange(shiftMonth(month, 1))}
        disabled={atCurrent}
        hitSlop={8}
      >
        <Ionicons
          name="chevron-forward"
          size={24}
          color={atCurrent ? '#ffffff40' : '#fff'}
        />
      </TouchableOpacity>
    </View>
  );
}
