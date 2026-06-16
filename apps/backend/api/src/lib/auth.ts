import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import { sendAccountDeletionEmail, sendResetPasswordEmail } from './mailer';

const prisma = new PrismaClient();

// Le scheme deep-link mobile doit etre de confiance pour le callbackURL du reset
// (match prefixe cote better-auth). exp:// est deja fourni via l'env pour Expo Go.
const trustedOrigins = [
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? []),
  'studentlife://',
];

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    // Lien de reset valable 1 heure.
    resetPasswordTokenExpiresIn: 3600,
    // Apres reset reussi, toutes les sessions actives sont invalidees.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ to: user.email, url, name: user.name });
    },
  },

  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: true,
      },
      lastName: {
        type: 'string',
        required: true,
      },
      establishment: {
        type: 'string',
        required: false,
      },
      studyLevel: {
        type: 'string',
        required: false,
      },
      sector: {
        type: 'string',
        required: false,
      },
    },

    // Droit à l'oubli (RGPD) : suppression définitive et immédiate du compte.
    // Côté client : authClient.deleteUser({ password }) — Better Auth vérifie le
    // mot de passe avant d'effacer l'utilisateur (cascade Prisma sur dépenses,
    // budgets, documents, historique IA, etc.).
    deleteUser: {
      enabled: true,
      // Avant la suppression DB : purge des fichiers sur disque (PDF + exports),
      // que la cascade ne supprime pas.
      beforeDelete: async (user) => {
        const [documents, dataExports] = await Promise.all([
          prisma.document.findMany({
            where: { userId: user.id },
            select: { path: true },
          }),
          prisma.dataExport.findMany({
            where: { userId: user.id },
            select: { filePath: true },
          }),
        ]);

        const paths = [
          ...documents.map((d) => d.path),
          ...dataExports.map((e) => e.filePath),
        ];
        await Promise.all(paths.map((p) => unlink(p).catch(() => undefined)));
      },
      // Après suppression : email de confirmation (RGPD).
      afterDelete: async (user) => {
        const firstName = (user as { firstName?: string | null }).firstName;
        await sendAccountDeletionEmail(user.email, firstName).catch((err) => {
          console.error(
            '[auth] Échec envoi email de confirmation de suppression',
            err,
          );
        });
      },
    },
  },
});
