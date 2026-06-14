import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function Fab() {
  return (
    <TouchableOpacity
      onPress={() => router.push('/expense/new')}
      activeOpacity={0.85}
      className="absolute right-5 bottom-20 w-14 h-14 rounded-full bg-[#C490D1] items-center justify-center shadow-lg"
      style={{ elevation: 6 }}
    >
      <Ionicons name="add" size={32} color="#fff" />
    </TouchableOpacity>
  );
}
