import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  resetKey: string | number;
};

function format(seconds: number): string {
  const mm = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function InterviewTimer({ resetKey }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSeconds(0);
    setRunning(true);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running]);

  return (
    <View className="flex-row items-center gap-2 bg-white rounded-full px-3 py-1.5">
      <Ionicons name="time-outline" size={16} color="#08415C" />
      <Text className="text-[#08415C] font-semibold tabular-nums">
        {format(seconds)}
      </Text>
      <TouchableOpacity onPress={() => setRunning((r) => !r)} hitSlop={8}>
        <Ionicons name={running ? 'pause' : 'play'} size={16} color="#08415C" />
      </TouchableOpacity>
    </View>
  );
}
