import type { Metadata } from 'next';
import { OAuthButtons } from './oauth-buttons';

export const metadata: Metadata = {
  title: 'Connexion — Student Life',
};

/** Page de connexion : aucun formulaire login/mot de passe, uniquement OAuth. */
export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Connexion
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Connectez-vous avec votre compte Google ou Microsoft. Aucun mot de
          passe n&apos;est stocke.
        </p>

        <div className="mt-8">
          <OAuthButtons />
        </div>
      </div>
    </div>
  );
}
