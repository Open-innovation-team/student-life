import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { sendResetPasswordEmail } from './mail';

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
  },
});
