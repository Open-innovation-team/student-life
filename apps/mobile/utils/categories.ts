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

const PALETTE = [
  '#08415C',
  '#C490D1',
  '#5AA9E6',
  '#2A9D8F',
  '#E9C46A',
  '#F4A261',
  '#E76F51',
  '#9B5DE5',
];

export function categoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
