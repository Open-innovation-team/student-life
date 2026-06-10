'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { saveTokens } from '@/lib/auth';

/**
 * Recoit la redirection du backend apres un login OAuth :
 * /auth/callback?accessToken=...&refreshToken=...
 * Stocke les tokens puis redirige vers le tableau de bord.
 */
export function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      setError("La connexion a echoue : tokens manquants dans l'URL.");
      return;
    }

    saveTokens(accessToken, refreshToken);
    router.replace('/dashboard');
  }, [params, router]);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <a
          href="/login"
          className="mt-4 inline-block text-sm font-medium underline"
        >
          Retour a la connexion
        </a>
      </div>
    );
  }

  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      Connexion en cours…
    </p>
  );
}
