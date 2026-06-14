import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

type Mailer = Transporter<SMTPTransport.SentMessageInfo>;

// Mailer autonome (hors DI Nest, à l'image de `auth.ts`) : utilisé par les hooks
// Better Auth (`afterDelete`) et exploitable depuis les services Nest si besoin.
//
// En dev, si `SMTP_HOST` n'est pas défini, on crée un compte de test Ethereal :
// aucun email réel n'est envoyé, un lien de prévisualisation est loggé en console.

const MAIL_FROM =
  process.env.MAIL_FROM ?? 'Student Life <no-reply@student-life.app>';

let transporterPromise: Promise<Mailer> | null = null;

function getTransporter(): Promise<Mailer> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const host = process.env.SMTP_HOST;
    if (host) {
      return nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }

    // Dev : compte Ethereal éphémère (preview loggée, aucun envoi réel).
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

/**
 * Email de confirmation envoyé après la suppression définitive d'un compte
 * (droit à l'oubli / RGPD).
 */
export async function sendAccountDeletionEmail(
  to: string,
  firstName?: string | null,
): Promise<void> {
  const transporter = await getTransporter();
  const greeting = firstName?.trim() ? ` ${firstName.trim()}` : '';

  const text = [
    `Bonjour${greeting},`,
    '',
    "Votre compte Student Life ainsi que l'ensemble de vos données (profil, " +
      'dépenses, budgets, documents et historique IA) ont été définitivement ' +
      "supprimés, conformément à votre droit à l'oubli (RGPD).",
    '',
    "Cette action est irréversible. Si vous n'êtes pas à l'origine de cette " +
      'demande, contactez-nous immédiatement.',
    '',
    "L'équipe Student Life",
  ].join('\n');

  const html = `
    <p>Bonjour${greeting},</p>
    <p>
      Votre compte Student Life ainsi que l'ensemble de vos données
      (profil, dépenses, budgets, documents et historique IA) ont été
      <strong>définitivement supprimés</strong>, conformément à votre droit
      à l'oubli (RGPD).
    </p>
    <p>
      Cette action est irréversible. Si vous n'êtes pas à l'origine de cette
      demande, contactez-nous immédiatement.
    </p>
    <p>L'équipe Student Life</p>
  `;

  const info = await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: 'Confirmation de suppression de votre compte Student Life',
    text,
    html,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log('[mailer] Aperçu email de suppression de compte :', preview);
  }
}
