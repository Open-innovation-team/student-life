import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { authClient, BASE_URL, ORIGIN } from '../../lib/auth-client';
import { userUpdateSchema } from '../../lib/schemas/user';
import { requestDataExport } from '../../lib/api';
import { useEffect, useState } from 'react';

export default function ProfilScreen() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profilPicture, setProfilPicture] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [studyLevel, setStudyLevel] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState({
    firstName: null,
    lastName: null,
    establishment: null,
    sector: null,
    studyLevel: null,
  });

  // RGPD : export + suppression de compte
  const [exporting, setExporting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const response = await fetch(`${BASE_URL}/api/users/me`, {
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        credentials: 'include',
      });
      const userData = await response.json();
      setFirstName(userData.firstName ?? null);
      setLastName(userData.lastName ?? null);
      setEmail(userData.email ?? null);
      setProfilPicture(userData.image ?? null);
      setEstablishment(userData.establishment ?? null);
      setSector(userData.sector ?? null);
      setStudyLevel(userData.studyLevel ?? null);
      setOriginalData({
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        establishment: userData.establishment ?? null,
        sector: userData.sector ?? null,
        studyLevel: userData.studyLevel ?? null,
      });
    }
    loadSession();
  }, []);

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
        // Erreur HTTP (400, 401, 500, etc.)
        const error = await response.json();
        Alert.alert('Erreur', error.message || 'Impossible de mettre à jour');
        return;
      }

      // Succès
      const updatedUser = await response.json();
      setIsEditing(false);
      setOriginalData({
        firstName: updatedUser.firstName ?? firstName,
        lastName: updatedUser.lastName ?? lastName,
        sector: updatedUser.sector ?? sector,
        studyLevel: updatedUser.studyLevel ?? studyLevel,
        establishment: updatedUser.establishment ?? establishment,
      });

      Alert.alert('Succès', 'Profil mis à jour');
      console.log('Profil mis à jour:', updatedUser);
    } catch (error) {
      // Erreur réseau
      Alert.alert('Erreur', 'Problème de connexion');
      console.error(error);
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
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: doLogout,
        },
      ]);
    }
  };
  const startEditing = () => setIsEditing(true);

  // --- RGPD : export des données ---
  const handleExport = async () => {
    try {
      setExporting(true);
      const { downloadUrl } = await requestDataExport();
      // Ouvre le lien sécurisé : déclenche le téléchargement du ZIP
      // (navigateur sur device, téléchargement direct sur web).
      const canOpen = await Linking.canOpenURL(downloadUrl);
      if (!canOpen)
        throw new Error("Impossible d'ouvrir le lien de téléchargement");
      await Linking.openURL(downloadUrl);
      Alert.alert(
        'Export prêt',
        'Le téléchargement de vos données a démarré. Le lien reste valable 24h.',
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : "Échec de l'export",
      );
    } finally {
      setExporting(false);
    }
  };

  // --- RGPD : suppression de compte (confirmation en 2 étapes) ---
  const openDeleteModal = () => {
    setDeleteStep(1);
    setDeletePassword('');
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalVisible(false);
    setDeletePassword('');
    setDeleteStep(1);
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) {
      Alert.alert('Erreur', 'Veuillez saisir votre mot de passe');
      return;
    }
    setDeleting(true);
    const { error } = await authClient.deleteUser({ password: deletePassword });
    setDeleting(false);

    if (error) {
      Alert.alert(
        'Erreur',
        error.message ?? 'Mot de passe incorrect ou suppression impossible',
      );
      return;
    }

    setDeleteModalVisible(false);
    await authClient.signOut().catch(() => undefined);
    router.replace('/(auth)/login');
    Alert.alert(
      'Compte supprimé',
      'Votre compte et vos données ont été définitivement supprimés. Un email de confirmation vous a été envoyé.',
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-[#E5FCFF]"
      contentContainerClassName="items-center px-6 py-8"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-[#08415C] text-xl font-bold m-2">Mon Profil</Text>
      {/* Image de profile */}
      {profilPicture ? (
        <Image
          source={{ uri: profilPicture }}
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
          <Text className="text-[#08415C] font-bold text-lg">
            Informations personnelles
          </Text>

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
                <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
                  <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                    {firstName ?? 'Non renseigné'}
                  </Text>
                </TouchableOpacity>
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
                <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
                  <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                    {lastName ?? 'Non renseigné'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Email */}
          <View className="gap-1">
            <Text className="text-gray-500 text-xs font-medium ml-1">
              Email
            </Text>
            <Text className="text-black-500 text-md font-medium ml-1">
              {email ?? ''}
            </Text>
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
              <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
                <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                  {sector ?? 'Filière non renseignée'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Niveau d&apos;étude */}
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
              <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
                <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                  {studyLevel ?? "Niveau d'étude non renseigné"}
                </Text>
              </TouchableOpacity>
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
              <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
                <Text className="text-gray-800 text-sm py-3 px-4 bg-[#E5FCFF]/50 rounded-xl">
                  {establishment ?? 'Établissement non renseigné'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bouton */}
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
                // Restaurer les valeurs originales
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

      {/* RGPD : portabilité & droit à l'oubli */}
      <View className="bg-white rounded-2xl p-5 shadow-sm gap-3 w-full max-w-md mt-6">
        <Text className="text-[#08415C] font-bold text-lg">
          Confidentialité (RGPD)
        </Text>

        <TouchableOpacity
          className="bg-[#08415C] rounded-xl items-center py-4 flex-row justify-center gap-2"
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting && <ActivityIndicator color="#fff" size="small" />}
          <Text className="text-white font-semibold">
            {exporting ? 'Préparation…' : 'Exporter mes données'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-red-500 rounded-xl items-center py-4"
          onPress={openDeleteModal}
        >
          <Text className="text-red-600 font-semibold">
            Supprimer mon compte
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modale de suppression en 2 étapes */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md gap-4">
            {deleteStep === 1 ? (
              <>
                <Text className="text-[#08415C] font-bold text-xl">
                  Supprimer définitivement votre compte ?
                </Text>
                <Text className="text-gray-600 text-sm">
                  Cette action est{' '}
                  <Text className="font-bold">irréversible</Text>. Toutes vos
                  données seront effacées : profil, dépenses, budgets, documents
                  et historique IA. Un email de confirmation vous sera envoyé.
                </Text>
                <Text className="text-gray-500 text-xs">
                  Pensez à exporter vos données avant de continuer.
                </Text>
                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 rounded-xl items-center py-4"
                    onPress={closeDeleteModal}
                  >
                    <Text className="text-gray-700 font-semibold">Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-red-500 rounded-xl items-center py-4"
                    onPress={() => setDeleteStep(2)}
                  >
                    <Text className="text-white font-semibold">Continuer</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text className="text-[#08415C] font-bold text-xl">
                  Confirmez avec votre mot de passe
                </Text>
                <Text className="text-gray-600 text-sm">
                  Saisissez votre mot de passe pour confirmer la suppression
                  définitive de votre compte.
                </Text>
                <TextInput
                  className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 py-3 text-gray-800 w-full"
                  placeholder="Mot de passe"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  autoFocus
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  editable={!deleting}
                />
                <View className="flex-row gap-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 rounded-xl items-center py-4"
                    onPress={closeDeleteModal}
                    disabled={deleting}
                  >
                    <Text className="text-gray-700 font-semibold">Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-red-500 rounded-xl items-center py-4 flex-row justify-center gap-2"
                    onPress={handleConfirmDelete}
                    disabled={deleting}
                  >
                    {deleting && (
                      <ActivityIndicator color="#fff" size="small" />
                    )}
                    <Text className="text-white font-semibold">
                      Supprimer définitivement
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
