import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { Application } from '../lib/api';
import { APPLICATION_STATUSES, statusColor } from '../utils';
import { ApplicationCard } from './application-card';

type Props = {
  applications: Application[];
  onOpen: (application: Application) => void;
  onChangeStatus: (application: Application, status: string) => void;
};

const WIDE_BREAKPOINT = 768;

export function KanbanBoard({ applications, onOpen, onChangeStatus }: Props) {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const columns = APPLICATION_STATUSES.map((status) => {
    const items = applications.filter((a) => a.status === status);
    return (
      <View
        key={status}
        style={isWide ? { width: 240 } : undefined}
        className={isWide ? undefined : 'mb-4'}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <View
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: statusColor(status) }}
          />
          <Text className="text-[#08415C] font-semibold flex-1">{status}</Text>
          <Text className="text-gray-400 text-xs">{items.length}</Text>
        </View>
        {items.length === 0 ? (
          <Text className="text-gray-300 text-xs">Aucune</Text>
        ) : (
          items.map((a) => (
            <ApplicationCard
              key={a.id}
              application={a}
              onPress={() => onOpen(a)}
              onChangeStatus={(s) => onChangeStatus(a, s)}
            />
          ))
        )}
      </View>
    );
  });

  if (isWide) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
      >
        {columns}
      </ScrollView>
    );
  }

  return <View className="pb-4">{columns}</View>;
}
