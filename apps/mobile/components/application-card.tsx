import { View, Text, TouchableOpacity } from 'react-native';
import { Application } from '../lib/api';
import { StatusPicker } from './status-picker';

type Props = {
  application: Application;
  onPress: () => void;
  onChangeStatus: (status: string) => void;
};

export function ApplicationCard({
  application,
  onPress,
  onChangeStatus,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-2xl p-3 mb-2 shadow-sm"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[#08415C] font-semibold" numberOfLines={1}>
            {application.company}
          </Text>
          <Text className="text-gray-500 text-xs" numberOfLines={1}>
            {application.position}
          </Text>
        </View>
        {application.needsFollowUp && (
          <View className="bg-[#E76F51] rounded-full px-2 py-0.5">
            <Text className="text-white text-[10px] font-medium">
              À relancer
            </Text>
          </View>
        )}
      </View>

      <Text className="text-gray-400 text-[11px] mt-2">
        {application.platform ?? '—'} ·{' '}
        {new Date(application.sentAt).toLocaleDateString('fr-FR')}
      </Text>

      <View className="mt-2 flex-row">
        <StatusPicker
          value={application.status}
          onChange={onChangeStatus}
          compact
        />
      </View>
    </TouchableOpacity>
  );
}
