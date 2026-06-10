/**
 * Client d'authentification cote web.
 *
 * Le flux OAuth est gere par le backend NestJS : le front se contente
 * d'ouvrir les URLs /auth/{provider}, de recuperer les tokens dans l'URL
 * de callback, puis de les stocker pour authentifier les appels API.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const ACCESS_KEY = 'sl_access_token';
const REFRESH_KEY = 'sl_refresh_token';

export interface AuthUser {
  id: string;
  email: string;
}

/** URL a ouvrir pour demarrer la connexion via un fournisseur. */
export function oauthUrl(provider: 'google' | 'microsoft'): string {
  return `${API_URL}/auth/${provider}`;
}

// --- Stockage des tokens (localStorage) -----------------------------------

export function saveTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

// --- Appels API -----------------------------------------------------------

/** Echange le refresh token contre un nouveau couple de tokens. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return false;
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  saveTokens(data.accessToken, data.refreshToken);
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
  const token = getAccessToken();
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
export function logout(): void {
  clearTokens();
}
