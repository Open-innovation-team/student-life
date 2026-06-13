import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import { authClient, BASE_URL, ORIGIN } from '../../lib/auth-client';
import { useUser } from '../../lib/user-context';
import { userUpdateSchema } from '../../lib/schemas/user';
import { useEffect, useState } from 'react';

export default function ProfilScreen() {
  const { editing } = useLocalSearchParams<{ editing?: string }>();
  const {
    firstName: ctxFirstName,
    lastName: ctxLastName,
    email: ctxEmail,
    image: ctxImage,
    establishment: ctxEstablishment,
    sector: ctxSector,
    studyLevel: ctxStudyLevel,
    refresh,
  } = useUser();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [studyLevel, setStudyLevel] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState({
    firstName: null as string | null,
    lastName: null as string | null,
    establishment: null as string | null,
    sector: null as string | null,
    studyLevel: null as string | null,
  });

  useEffect(() => {
    setFirstName(ctxFirstName);
    setLastName(ctxLastName);
    setEmail(ctxEmail);
    setEstablishment(ctxEstablishment);
    setSector(ctxSector);
    setStudyLevel(ctxStudyLevel);
    setOriginalData({
      firstName: ctxFirstName,
      lastName: ctxLastName,
      establishment: ctxEstablishment,
      sector: ctxSector,
      studyLevel: ctxStudyLevel,
    });
  }, [
    ctxFirstName,
    ctxLastName,
    ctxEmail,
    ctxEstablishment,
    ctxSector,
    ctxStudyLevel,
  ]);

  useEffect(() => {
    if (editing === 'true') setIsEditing(true);
  }, [editing]);

  const handleSave = async () => {
    const validation = userUpdateSchema.safeParse({
      firstName,
      lastName,
      establishment,
      sector,
      studyLevel,
    });

    if (!validation.success) {
      Alert.alert('Erreur', 'Données invalides');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        credentials: 'include',
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Impossible de mettre à jour');
        return;
      }

      setIsEditing(false);
      await refresh();
      Alert.alert('Succès', 'Profil mis à jour');
    } catch {
      Alert.alert('Erreur', 'Problème de connexion');
    }
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      await authClient.signOut();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      await doLogout();
    } else {
      Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const startEditing = () => setIsEditing(true);

  return (
    <View className="flex-1 bg-[#E5FCFF] items-center justify-center px-6">
      <Text className="text-[#08415C] text-xl font-bold m-2">Mon Profil</Text>
      {/* Image de profil */}
      {ctxImage ? (
        <Image
          source={{ uri: ctxImage }}
          className="w-24 h-24 rounded-full m-4"
        />
      ) : (
        <View className="w-24 h-24 rounded-full bg-gray-300 items-center justify-center mb-4">
          <Text className="text-white text-xl font-bold">
            {firstName?.[0]}
            {lastName?.[0]}
          </Text>
        </View>
      )}
      <View className="flex-4 bg-[#E5FCFF] items-center px-6 w-full">
        <View className="bg-white rounded-2xl p-5 shadow-sm gap-4 w-full max-w-md">
          {/* En-tête avec bouton Modifier */}
          <View className="flex-row justify-between items-center">
            <Text className="text-[#08415C] font-bold text-lg">
              Informations personnelles
            </Text>
            {!isEditing && (
              <TouchableOpacity onPress={startEditing}>
                <Ionicons name="pencil-outline" size={20} color="#08415C" />
              </TouchableOpacity>
            )}
          </View>

          {/* Prénom + Nom */}
          <View className="flex-row gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-gray-500 text-xs font-medium ml-1">
                Prénom
              </Text>
              {isEditing ? (
                <TextInput
                  className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800 w-full"
                  style={{
                    paddingVertical: Platform.OS === 'web' ? 8 : 12,
                    fontSize: Platform.OS === 'web' ? 10 : 12,
                  }}
                  placeholder="Prénom"
                  placeholderTextColor="#9ca3af"
                  value={firstName ?? ''}
                  onChangeText={setFirstName}
                />
              ) : (
                <View>
                  <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                    {firstName ?? 'Non renseigné'}
                  </Text>
                </View>
              )}
            </View>
            <View className="flex-1 gap-1 w-full max-w-md">
              <Text className="text-gray-500 text-xs font-medium ml-1">
                Nom
              </Text>
              {isEditing ? (
                <TextInput
                  className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800 w-full"
                  style={{
                    paddingVertical: Platform.OS === 'web' ? 8 : 12,
                    fontSize: Platform.OS === 'web' ? 10 : 12,
                  }}
                  placeholder="Nom"
                  placeholderTextColor="#9ca3af"
                  value={lastName ?? ''}
                  onChangeText={setLastName}
                />
              ) : (
                <View>
                  <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                    {lastName ?? 'Non renseigné'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Email */}
          <View className="gap-1">
            <Text className="text-gray-500 text-xs font-medium ml-1">
              Email
            </Text>
            {isEditing ? (
              <TextInput
                className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800 w-full"
                style={{
                  paddingVertical: Platform.OS === 'web' ? 8 : 12,
                  fontSize: Platform.OS === 'web' ? 10 : 12,
                }}
                value={email ?? ''}
                editable={false}
              />
            ) : (
              <View>
                <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                  {email ?? 'Email non renseigné'}
                </Text>
              </View>
            )}
          </View>

          {/* Filière */}
          <View className="gap-1">
            <Text className="text-gray-500 text-xs font-medium ml-1">
              Filière
            </Text>
            {isEditing ? (
              <TextInput
                className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800 w-full"
                style={{
                  paddingVertical: Platform.OS === 'web' ? 8 : 12,
                  fontSize: Platform.OS === 'web' ? 10 : 12,
                }}
                placeholder="Filière"
                placeholderTextColor="#9ca3af"
                value={sector ?? ''}
                onChangeText={setSector}
              />
            ) : (
              <View>
                <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                  {sector ?? 'Filière non renseignée'}
                </Text>
              </View>
            )}
          </View>

          {/* Niveau d'étude */}
          <View className="gap-1">
            <Text className="text-gray-500 text-xs font-medium ml-1">
              Niveau d&apos;étude
            </Text>
            {isEditing ? (
              <TextInput
                className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800 w-full"
                style={{
                  paddingVertical: Platform.OS === 'web' ? 8 : 12,
                  fontSize: Platform.OS === 'web' ? 10 : 12,
                }}
                placeholder="Niveau d'étude"
                placeholderTextColor="#9ca3af"
                value={studyLevel ?? ''}
                onChangeText={setStudyLevel}
              />
            ) : (
              <View>
                <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                  {studyLevel ?? "Niveau d'étude non renseigné"}
                </Text>
              </View>
            )}
          </View>

          {/* Établissement */}
          <View className="gap-1">
            <Text className="text-gray-500 text-xs font-medium ml-1">
              Établissement
            </Text>
            {isEditing ? (
              <TextInput
                className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800 w-full"
                style={{
                  paddingVertical: Platform.OS === 'web' ? 8 : 12,
                  fontSize: Platform.OS === 'web' ? 10 : 12,
                }}
                placeholder="Établissement"
                placeholderTextColor="#9ca3af"
                value={establishment ?? ''}
                onChangeText={setEstablishment}
              />
            ) : (
              <View>
                <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                  {establishment ?? 'Établissement non renseigné'}
                </Text>
              </View>
            )}
          </View>

          {/* Boutons Sauvegarder / Annuler */}
          {isEditing && (
            <TouchableOpacity
              className="bg-[#08415C] rounded-xl items-center py-4 mt-2"
              onPress={handleSave}
            >
              <Text className="text-white font-semibold">Sauvegarder</Text>
            </TouchableOpacity>
          )}
          {isEditing && (
            <TouchableOpacity
              className="bg-gray-300 rounded-xl items-center py-4 mt-2"
              onPress={() => {
                setFirstName(originalData.firstName);
                setLastName(originalData.lastName);
                setSector(originalData.sector);
                setStudyLevel(originalData.studyLevel);
                setEstablishment(originalData.establishment);
                setIsEditing(false);
              }}
            >
              <Text className="text-gray-700 font-semibold">Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <TouchableOpacity
        className="bg-red-500 px-6 py-3 rounded-xl mt-8"
        onPress={handleLogout}
      >
        <Text className="text-white font-semibold">Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}
