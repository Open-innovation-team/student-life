/**
 * Profil OAuth normalise : forme commune produite par les strategies
 * Google et Microsoft, consommee par AuthService.
 */
export interface OAuthProfile {
  provider: 'GOOGLE' | 'MICROSOFT';
  /** Identifiant du compte chez le fournisseur (stable, jamais l'email). */
  providerAccountId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

/** Charge utile d'un JWT d'acces emis par l'API. */
export interface JwtPayload {
  /** id du User. */
  sub: string;
  email: string;
}

/** Utilisateur authentifie attache a la requete par JwtStrategy. */
export interface AuthenticatedUser {
  id: string;
  email: string;
}
