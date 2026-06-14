import { View, Text } from 'react-native';
import { ApplicationStats } from '../lib/api';

export function ApplicationStatsSummary({
  stats,
}: {
  stats: ApplicationStats;
}) {
  const cards = [
    { label: 'Envoyées', value: String(stats.total) },
    { label: 'Taux réponse', value: `${stats.responseRate}%` },
    { label: 'Entretiens', value: String(stats.interviews) },
  ];

  return (
    <View className="flex-row gap-3">
      {cards.map((card) => (
        <View
          key={card.label}
          className="flex-1 bg-white rounded-2xl p-3 items-center shadow-sm"
        >
          <Text className="text-[#08415C] text-2xl font-bold">
            {card.value}
          </Text>
          <Text className="text-gray-400 text-xs mt-1">{card.label}</Text>
        </View>
      ))}
    </View>
  );
}
