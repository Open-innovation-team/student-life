import { View, TextInput, Text } from 'react-native';
import { sanitizeAmountInput } from '../utils';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function MoneyInput({
  value,
  onChangeText,
  placeholder = '0,00',
}: Props) {
  return (
    <View className="flex-row items-center bg-[#E5FCFF] rounded-xl px-3">
      <TextInput
        className="flex-1 py-2.5 text-[#08415C] font-semibold text-right"
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={(text) => onChangeText(sanitizeAmountInput(text))}
      />
      <Text className="text-gray-400 ml-1">€</Text>
    </View>
  );
}
