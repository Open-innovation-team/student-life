import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { createCategory, listCategories } from '../lib/api';
import { categoryIcon } from '../utils';

type Props = {
  value: string;
  onChange: (category: string) => void;
};

export function CategoryPicker({ value, onChange }: Props) {
  const [categories, setCategories] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { predefined, custom } = await listCategories();
      setCategories([...predefined, ...custom.map((c) => c.name)]);
    } catch {
      setCategories([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createCategory(name);
      await load();
      onChange(created.name);
      setNewName('');
      setAdding(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
      >
        {categories.map((cat) => {
          const selected = cat === value;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => onChange(cat)}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
                selected
                  ? 'bg-[#08415C] border-[#08415C]'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Ionicons
                name={categoryIcon(cat)}
                size={15}
                color={selected ? '#fff' : '#08415C'}
              />
              <Text
                className={
                  selected ? 'text-white text-sm' : 'text-[#08415C] text-sm'
                }
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => setAdding((v) => !v)}
          className="flex-row items-center gap-1.5 px-3 py-2 rounded-full border border-dashed border-[#C490D1]"
        >
          <Ionicons name="add" size={15} color="#C490D1" />
          <Text className="text-[#C490D1] text-sm">Nouvelle</Text>
        </TouchableOpacity>
      </ScrollView>

      {adding && (
        <View className="mt-2">
          <View className="flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-[#08415C]"
              placeholder="Nom de la catégorie"
              placeholderTextColor="#9ca3af"
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleAdd}
              disabled={saving}
              className="bg-[#08415C] rounded-xl px-4 py-2.5"
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
        </View>
      )}
    </View>
  );
}
