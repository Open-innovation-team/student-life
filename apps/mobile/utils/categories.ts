import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

const CATEGORY_ICONS: Record<string, IoniconName> = {
  Logement: 'home',
  Nourriture: 'restaurant',
  Transport: 'bus',
  Loisirs: 'game-controller',
  Santé: 'medkit',
  Études: 'school',
  Abonnements: 'card',
  Autre: 'ellipsis-horizontal',
};

export function categoryIcon(name: string): IoniconName {
  return CATEGORY_ICONS[name] ?? 'pricetag';
}
