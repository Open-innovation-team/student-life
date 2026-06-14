import { View, Text, ScrollView } from 'react-native';
import { Application } from '../lib/api';
import { APPLICATION_STATUSES, statusColor } from '../utils';
import { ApplicationCard } from './application-card';

type Props = {
  applications: Application[];
  onOpen: (application: Application) => void;
  onChangeStatus: (application: Application, status: string) => void;
};

export function KanbanBoard({ applications, onOpen, onChangeStatus }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
    >
      {APPLICATION_STATUSES.map((status) => {
        const items = applications.filter((a) => a.status === status);
        return (
          <View key={status} style={{ width: 240 }}>
            <View className="flex-row items-center gap-2 mb-2">
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: statusColor(status) }}
              />
              <Text className="text-[#08415C] font-semibold flex-1">
                {status}
              </Text>
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
      })}
    </ScrollView>
  );
}
