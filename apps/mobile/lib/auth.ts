/**
 * Client d'authentification cote mobile (Expo).
 *
 * Miroir de `apps/web/lib/auth.ts`, adapte au natif :
 *  - le flux OAuth s'ouvre dans une session navigateur (expo-web-browser) ;
 *  - le backend redirige vers un deep link de l'app, intercepte par
 *    WebBrowser, qui renvoie l'URL finale avec les tokens ;
 *  - les tokens sont stockes de maniere securisee via expo-secure-store
 *    (asynchrone, contrairement au localStorage du web).
 */

import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

/**
 * Resout l'URL de l'API en garantissant un schema http(s). Sans schema,
 * l'ouverture du navigateur natif (ASWebAuthenticationSession) crashe l'app
 * sur iOS. On tolere donc une valeur type "localhost:3000" en la prefixant.
 */
function resolveApiUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) return 'http://localhost:3000';
  return /^https?:\/\//.test(raw) ? raw : `http://${raw}`;
}

export const API_URL = resolveApiUrl();

const ACCESS_KEY = 'sl_access_token';
const REFRESH_KEY = 'sl_refresh_token';

export type OAuthProvider = 'google' | 'microsoft';

export interface AuthUser {
  id: string;
  email: string;
}

/** URL backend a ouvrir pour demarrer la connexion, avec le deep link de retour. */
function oauthUrl(provider: OAuthProvider, redirectUri: string): string {
  return `${API_URL}/auth/${provider}?redirect_uri=${encodeURIComponent(
    redirectUri,
  )}`;
}

// --- Stockage des tokens (SecureStore) ------------------------------------

async function saveTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}

// --- Connexion OAuth ------------------------------------------------------

/**
 * Lance le flux OAuth pour un fournisseur. Ouvre une session navigateur vers
 * le backend, attend le retour via deep link, extrait et stocke les tokens.
 * Retourne true si la connexion a reussi.
 */
export async function signIn(provider: OAuthProvider): Promise<boolean> {
  const redirectUri = Linking.createURL('auth/callback');
  const authUrl = oauthUrl(provider, redirectUri);

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  if (result.type !== 'success') return false;

  const { queryParams } = Linking.parse(result.url);
  const accessToken = queryParams?.accessToken;
  const refreshToken = queryParams?.refreshToken;

  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    return false;
  }

  await saveTokens(accessToken, refreshToken);
  return true;
}

/**
 * Bypass de connexion pour le DEV : appelle POST /auth/dev-login (simple fetch,
 * sans navigateur natif, donc pas de souci http/localhost) et stocke les tokens.
 * Ne fonctionne que si le backend a DEV_AUTH_BYPASS=true. A retirer pour la prod.
 */
export async function devSignIn(): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) return false;

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  await saveTokens(data.accessToken, data.refreshToken);
  return true;
}

// --- Appels API -----------------------------------------------------------

/** Echange le refresh token contre un nouveau couple de tokens. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    await clearTokens();
    return false;
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  await saveTokens(data.accessToken, data.refreshToken);
  return true;
}

/**
 * Recupere l'utilisateur courant via GET /auth/me.
 * En cas de 401, tente une fois de rafraichir les tokens.
 * Retourne null si l'utilisateur n'est pas (ou plus) authentifie.
 */
export async function fetchCurrentUser(
  retryAfterRefresh = true,
): Promise<AuthUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 && retryAfterRefresh) {
    const refreshed = await tryRefresh();
    return refreshed ? fetchCurrentUser(false) : null;
  }

  if (!res.ok) return null;
  return (await res.json()) as AuthUser;
}

/** Deconnexion : purge les tokens locaux. */
export function logout(): Promise<void> {
  return clearTokens();
}
