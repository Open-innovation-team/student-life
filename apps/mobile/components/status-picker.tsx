import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APPLICATION_STATUSES, statusColor } from '../utils';

type Props = {
  value: string;
  onChange: (status: string) => void;
  compact?: boolean;
};

export function StatusPicker({ value, onChange, compact }: Props) {
  const [open, setOpen] = useState(false);

  const select = (status: string) => {
    setOpen(false);
    if (status !== value) onChange(status);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={`flex-row items-center gap-1.5 rounded-full ${
          compact ? 'px-2 py-1' : 'px-3 py-2 border border-gray-200 bg-white'
        }`}
        style={
          compact ? { backgroundColor: `${statusColor(value)}22` } : undefined
        }
      >
        <View
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: statusColor(value) }}
        />
        <Text
          className={`text-[#08415C] ${compact ? 'text-xs font-medium' : 'text-sm'}`}
        >
          {value}
        </Text>
        <Ionicons
          name="chevron-down"
          size={compact ? 12 : 16}
          color="#9ca3af"
        />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/30 justify-center px-8"
          onPress={() => setOpen(false)}
        >
          <View className="bg-white rounded-2xl p-2">
            {APPLICATION_STATUSES.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => select(status)}
                className="flex-row items-center gap-3 px-3 py-3 rounded-xl"
              >
                <View
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColor(status) }}
                />
                <Text className="text-[#08415C] flex-1">{status}</Text>
                {status === value && (
                  <Ionicons name="checkmark" size={18} color="#08415C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
