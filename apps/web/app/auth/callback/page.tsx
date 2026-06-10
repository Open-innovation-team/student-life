import { Suspense } from 'react';
import { CallbackHandler } from './callback-handler';

/** Page de retour OAuth. useSearchParams impose une frontiere Suspense. */
export default function AuthCallbackPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <Suspense
        fallback={
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chargement…
          </p>
        }
      >
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
