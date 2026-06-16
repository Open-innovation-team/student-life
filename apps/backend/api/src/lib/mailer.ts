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

/**
 * Email de réinitialisation de mot de passe. Appelé par le hook
 * `emailAndPassword.sendResetPassword` de Better Auth (cf. `auth.ts`) : le `url`
 * fourni porte le token (haché en base, usage unique, expiration 1 h) ; on ne
 * fait que le relayer par email.
 *
 * En dev sans `SMTP_HOST`, on logge le lien de prévisualisation Ethereal — et,
 * si Ethereal est indisponible, on logge directement l'URL pour ne pas bloquer
 * le flux de reset.
 */
export async function sendResetPasswordEmail({
  to,
  url,
  name,
}: {
  to: string;
  url: string;
  name?: string | null;
}): Promise<void> {
  const greeting = name?.trim() ? `Bonjour ${name.trim()},` : 'Bonjour,';
  const usingRealSmtp = Boolean(process.env.SMTP_HOST);

  const text = [
    greeting,
    '',
    'Vous avez demandé la réinitialisation de votre mot de passe.',
    'Ouvrez ce lien pour choisir un nouveau mot de passe (valable 1 heure, ' +
      `utilisable une seule fois) :`,
    url,
    '',
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
    '',
    "L'équipe Student Life",
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #08415C;">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>${greeting}</p>
      <p>
        Vous avez demandé la réinitialisation de votre mot de passe. Ce lien est
        valable <strong>1 heure</strong> et utilisable une seule fois.
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${url}" style="background:#08415C;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">
          Choisir un nouveau mot de passe
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280;">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
      </p>
    </div>
  `;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject: 'Réinitialisation de votre mot de passe Student Life',
      text,
      html,
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log('[mailer] Aperçu email de réinitialisation :', preview);
    }
  } catch (err) {
    // En prod (SMTP réel), on remonte l'erreur ; en dev (Ethereal indisponible),
    // on logge le lien pour ne pas bloquer le flux de réinitialisation.
    if (usingRealSmtp) throw err;
    console.error('[mailer] Échec envoi email de réinitialisation :', err);
    console.log('[mailer] (fallback dev) Lien de réinitialisation :', url);
  }
}
