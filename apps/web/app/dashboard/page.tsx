'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type AuthUser, fetchCurrentUser, logout } from '@/lib/auth';

/**
 * Page protegee : verifie le JWT via GET /auth/me.
 * Redirige vers /login si l'utilisateur n'est pas authentifie.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then((result) => {
        if (result) {
          setUser(result);
        } else {
          router.replace('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Chargement…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Bienvenue
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Vous etes connecte.
        </p>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {user.email}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">ID</dt>
            <dd className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
              {user.id}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 h-11 w-full rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:opacity-90"
        >
          Se deconnecter
        </button>
      </div>
    </div>
  );
}
