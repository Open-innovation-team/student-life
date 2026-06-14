import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput as RNTextInput } from 'react-native';
import { Link, router } from 'expo-router';
import { authClient } from '../../lib/auth-client';

export default function RegisterScreen() {
  const lastNameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const sectorRef = useRef<RNTextInput>(null);
  const establishmentRef = useRef<RNTextInput>(null);
  const studyLevelRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [sector, setSector] = useState('');
  const [establishment, setEstablishment] = useState('');
  const [studyLevel, setStudyLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !firstName ||
      !lastName ||
      !email ||
      !sector ||
      !establishment ||
      !studyLevel ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      sector,
      establishment,
      studyLevel,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Erreur d'inscription", error.message);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      className="flex-1 bg-[#E5FCFF]"
      contentContainerClassName="flex-1 justify-center items-center px-4 py-12"
      showsVerticalScrollIndicator={false}
    >
      <View
        className="w-full max-w-md bg-white rounded-3xl shadow-lg"
        style={{ padding: Platform.OS === 'web' ? 32 : 24 }}
      >
        {/* Header */}
        <View className="items-center mb-10">
          <View
            className="rounded-2xl bg-[#08415C] items-center justify-center mb-4"
            style={{
              width: Platform.OS === 'web' ? 64 : 80,
              height: Platform.OS === 'web' ? 64 : 80,
            }}
          >
            <Text
              style={{ fontSize: Platform.OS === 'web' ? 24 : 30 }}
              className="text-white font-bold"
            >
              SL
            </Text>
          </View>
          <Text
            style={{ fontSize: Platform.OS === 'web' ? 28 : 34 }}
            className="text-[#08415C] font-bold"
          >
            Créer un compte
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            Rejoins Student Life !
          </Text>
        </View>

        {/* Inputs */}
        <View className="gap-3">
          {/* Prénom + Nom */}
          <View className="flex-row gap-3">
            <TextInput
              className="flex-1 min-w-0 bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
              style={{
                paddingVertical: Platform.OS === 'web' ? 14 : 14,
                fontSize: Platform.OS === 'web' ? 14 : 12,
              }}
              placeholder="Prénom"
              placeholderTextColor="#9ca3af"
              value={firstName}
              onChangeText={setFirstName}
              returnKeyType="next"
              onSubmitEditing={() => lastNameRef.current?.focus()}
              submitBehavior="submit"
            />
            <TextInput
              ref={lastNameRef}
              className="flex-1 min-w-0 bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
              style={{
                paddingVertical: Platform.OS === 'web' ? 14 : 14,
                fontSize: Platform.OS === 'web' ? 14 : 12,
              }}
              placeholder="Nom"
              placeholderTextColor="#9ca3af"
              value={lastName}
              onChangeText={setLastName}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              submitBehavior="submit"
            />
          </View>

          {/* Email */}
          <TextInput
            ref={emailRef}
            className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
            style={{
              paddingVertical: Platform.OS === 'web' ? 14 : 14,
              fontSize: Platform.OS === 'web' ? 14 : 12,
            }}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => sectorRef.current?.focus()}
            submitBehavior="submit"
          />

          {/* Filière */}
          <TextInput
            ref={sectorRef}
            className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
            style={{
              paddingVertical: Platform.OS === 'web' ? 14 : 14,
              fontSize: Platform.OS === 'web' ? 14 : 12,
            }}
            placeholder="Filière"
            placeholderTextColor="#9ca3af"
            value={sector}
            onChangeText={setSector}
            returnKeyType="next"
            onSubmitEditing={() => establishmentRef.current?.focus()}
            submitBehavior="submit"
          />

          {/* Établissement */}
          <TextInput
            ref={establishmentRef}
            className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
            style={{
              paddingVertical: Platform.OS === 'web' ? 14 : 14,
              fontSize: Platform.OS === 'web' ? 14 : 12,
            }}
            placeholder="Établissement"
            placeholderTextColor="#9ca3af"
            value={establishment}
            onChangeText={setEstablishment}
            returnKeyType="next"
            onSubmitEditing={() => studyLevelRef.current?.focus()}
            submitBehavior="submit"
          />

          {/* Niveau d'études */}
          <TextInput
            ref={studyLevelRef}
            className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
            style={{
              paddingVertical: Platform.OS === 'web' ? 14 : 14,
              fontSize: Platform.OS === 'web' ? 14 : 12,
            }}
            placeholder="Niveau d'études"
            placeholderTextColor="#9ca3af"
            value={studyLevel}
            onChangeText={setStudyLevel}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
          />

          {/* Mot de passe */}
          <TextInput
            ref={passwordRef}
            className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
            style={{
              paddingVertical: Platform.OS === 'web' ? 14 : 14,
              fontSize: Platform.OS === 'web' ? 14 : 12,
            }}
            placeholder="Mot de passe"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            submitBehavior="submit"
          />

          {/* Confirmer mot de passe */}
          <TextInput
            ref={confirmPasswordRef}
            className="bg-[#E5FCFF] border border-gray-200 rounded-xl px-4 text-gray-800"
            style={{
              paddingVertical: Platform.OS === 'web' ? 14 : 14,
              fontSize: Platform.OS === 'web' ? 14 : 12,
            }}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        </View>

        {/* Bouton */}
        <TouchableOpacity
          className={`bg-[#08415C] rounded-xl items-center mt-6 ${loading ? 'opacity-60' : ''}`}
          style={{ paddingVertical: Platform.OS === 'web' ? 14 : 18 }}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text
            style={{ fontSize: Platform.OS === 'web' ? 14 : 17 }}
            className="text-white font-semibold"
          >
            {loading ? 'Inscription...' : "S'inscrire"}
          </Text>
        </TouchableOpacity>

        {/* Lien */}
        <View className="items-center mt-6">
          <Link href="/(auth)/login">
            <Text className="text-[#08415C] text-sm">
              Déjà un compte ? <Text className="font-bold">Se connecter</Text>
            </Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
