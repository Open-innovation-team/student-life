import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Aide = {
  nom: string;
  description: string;
  montant: string;
  url: string;
};

type Categorie = {
  titre: string;
  aides: Aide[];
};

const CATEGORIES: Categorie[] = [
  {
    titre: 'Logement',
    aides: [
      {
        nom: 'APL — Aide Personnalisée au Logement',
        description: 'Aide de la CAF pour réduire le montant de ton loyer.',
        montant: "Jusqu'à ~250€/mois",
        url: 'https://www.caf.fr/allocataires/aides-et-demarches/ma-situation/vie-personnelle/mon-enfant-poursuit-ses-etudes',
      },
      {
        nom: 'ALS — Allocation de Logement Sociale',
        description: "Pour les étudiants non éligibles à l'APL.",
        montant: 'Variable',
        url: 'https://www.caf.fr',
      },
      {
        nom: 'Visale — Garantie loyer',
        description:
          'Action Logement se porte garant à ta place auprès du bailleur.',
        montant: 'Gratuit',
        url: 'https://www.visale.fr',
      },
    ],
  },
  {
    titre: 'Alimentation',
    aides: [
      {
        nom: 'Repas CROUS à 1€',
        description:
          'Repas complet dans les restaurants universitaires pour 1€.',
        montant: '1€/repas',
        url: 'https://www.lescrous.fr',
      },
      {
        nom: "Aide alimentaire d'urgence",
        description:
          'Aide ponctuelle du CROUS en cas de difficulté financière.',
        montant: 'Ponctuelle',
        url: 'https://www.lescrous.fr',
      },
    ],
  },
  {
    titre: 'Bourses',
    aides: [
      {
        nom: 'Bourse sur critères sociaux',
        description:
          'Bourse CROUS selon les revenus de ta famille, de 0 à 7 échelons.',
        montant: '~1 100€ à ~6 000€/an',
        url: 'https://www.messervices.etudiant.gouv.fr',
      },
      {
        nom: 'Bourse au mérite',
        description:
          'Complément de bourse pour les bacheliers avec mention Très Bien.',
        montant: '+1 800€/an',
        url: 'https://www.messervices.etudiant.gouv.fr',
      },
      {
        nom: "Aide d'urgence CROUS",
        description:
          'Aide financière ponctuelle en cas de situation difficile imprévue.',
        montant: 'Ponctuelle',
        url: 'https://www.lescrous.fr',
      },
    ],
  },
  {
    titre: 'Transport',
    aides: [
      {
        nom: 'Carte Imagine R (Île-de-France)',
        description:
          'Abonnement annuel illimité sur les transports franciliens.',
        montant: '~350€/an',
        url: 'https://www.iledefrance-mobilites.fr',
      },
      {
        nom: 'Aides régionales transport',
        description:
          'Chaque région propose ses propres aides pour les transports.',
        montant: 'Variable selon région',
        url: 'https://www.regions-de-france.eu',
      },
    ],
  },
  {
    titre: 'Santé',
    aides: [
      {
        nom: 'Complémentaire Santé Solidaire (CSS)',
        description:
          'Mutuelle gratuite ou quasi-gratuite pour les revenus modestes.',
        montant: 'Gratuite ou ~1€/jour',
        url: 'https://www.ameli.fr',
      },
      {
        nom: 'LMDE / SMERRA',
        description: 'Mutuelles étudiantes avec tarifs adaptés.',
        montant: 'Variable',
        url: 'https://www.lmde.com',
      },
    ],
  },
  {
    titre: 'Aides diverses',
    aides: [
      {
        nom: "Prime d'activité",
        description:
          'Complément de revenus si tu travailles en parallèle de tes études.',
        montant: 'Variable',
        url: 'https://www.caf.fr',
      },
      {
        nom: 'Aide à la mobilité internationale',
        description:
          "Bourses Erasmus+ et aides régionales pour partir étudier à l'étranger.",
        montant: 'Variable',
        url: 'https://www.erasmusplus.fr',
      },
    ],
  },
];

export default function GuideAideFinanceScreen() {
  const [search, setSearch] = useState('');

  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    aides: cat.aides.filter(
      (a) =>
        a.nom.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.aides.length > 0);

  return (
    <View className="flex-1 bg-[#E5FCFF]">
      {/* Header */}
      <View className="bg-[#08415C] pt-16 pb-6 px-6">
        <Text className="text-white/70 text-sm">Finances</Text>
        <Text className="text-white text-2xl font-bold mt-1">
          Guide des aides
        </Text>
      </View>

      {/* Barre de recherche */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-white rounded-xl px-3 shadow-sm">
          <Ionicons name="search" size={18} color="#08415C" />
          <TextInput
            className="flex-1 py-3 px-2 text-gray-800"
            placeholder="Rechercher une aide..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View className="items-center mt-16">
            <Text className="text-gray-400 text-base">
              Aucune aide trouvée.
            </Text>
          </View>
        ) : (
          filtered.map((cat) => (
            <View key={cat.titre} className="mb-4">
              {/* Titre de catégorie */}
              <Text className="text-[#08415C] font-bold text-base mb-2 mt-2">
                {cat.titre}
              </Text>

              {cat.aides.map((aide) => (
                <View
                  key={aide.nom}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <Text className="text-[#08415C] font-semibold text-sm mb-1">
                    {aide.nom}
                  </Text>
                  <Text className="text-gray-500 text-xs mb-2">
                    {aide.description}
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <View className="bg-[#E5FCFF] rounded-full px-3 py-1">
                      <Text className="text-[#08415C] text-xs font-medium">
                        {aide.montant}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(aide.url)}
                      className="bg-[#08415C] rounded-full px-4 py-1.5"
                    >
                      <Text className="text-white text-xs font-medium">
                        En savoir plus
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
