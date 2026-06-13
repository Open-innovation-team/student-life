import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { router } from 'expo-router';
import { BASE_URL, ORIGIN } from './auth-client';

interface UserData {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  image: string | null;
  establishment: string | null;
  sector: string | null;
  studyLevel: string | null;
  initials: string;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserData>({
  firstName: null,
  lastName: null,
  email: null,
  image: null,
  establishment: null,
  sector: null,
  studyLevel: null,
  initials: '',
  refresh: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [establishment, setEstablishment] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [studyLevel, setStudyLevel] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/me`, {
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          router.replace('/(auth)/login');
        }
        return;
      }
      const userData = await response.json();
      setFirstName(userData.firstName ?? null);
      setLastName(userData.lastName ?? null);
      setEmail(userData.email ?? null);
      setImage(userData.image ?? null);
      setEstablishment(userData.establishment ?? null);
      setSector(userData.sector ?? null);
      setStudyLevel(userData.studyLevel ?? null);
    } catch {
      // erreur réseau silencieuse, les champs restent null
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`;

  return (
    <UserContext.Provider
      value={{
        firstName,
        lastName,
        email,
        image,
        establishment,
        sector,
        studyLevel,
        initials,
        refresh: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
