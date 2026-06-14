import { useState } from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

function label(date: Date): string {
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) return "Aujourd'hui";
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function toInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const pillClass =
  'flex-row items-center justify-between bg-white rounded-2xl px-4 py-4 border border-gray-100';

export function DateField({ value, onChange }: Props) {
  const [show, setShow] = useState(false);

  const inner = (
    <>
      <View className="flex-row items-center gap-2">
        <Ionicons name="calendar-outline" size={18} color="#08415C" />
        <Text className="text-[#08415C] font-semibold text-base">
          {label(value)}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={18} color="#9ca3af" />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View className={pillClass}>
        {inner}
        <input
          type="date"
          max={toInputValue(new Date())}
          value={toInputValue(value)}
          onChange={(e) =>
            e.target.value && onChange(new Date(`${e.target.value}T12:00:00`))
          }
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity className={pillClass} onPress={() => setShow(true)}>
        {inner}
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          maximumDate={new Date()}
          onChange={(_event, date) => {
            setShow(false);
            if (date) onChange(date);
          }}
        />
      )}
    </View>
  );
}
