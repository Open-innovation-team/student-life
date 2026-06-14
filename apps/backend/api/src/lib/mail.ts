import nodemailer, { type Transporter } from 'nodemailer';

// Transporter mis en cache : cree une seule fois puis reutilise.
let transporterPromise: Promise<Transporter> | null = null;

/**
 * Retourne un transporter nodemailer.
 * - Si SMTP_HOST est defini : SMTP reel (Mailtrap, Gmail, etc.).
 * - Sinon (dev) : compte de test Ethereal genere a la volee. Les mails ne partent
 *   pas reellement mais un lien de preview est logge (voir sendResetPasswordEmail).
 */
async function createTransporter(): Promise<Transporter> {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }

  // Dev : Ethereal. createTestAccount() appelle api.nodemailer.com (peut echouer).
  const testAccount = await nodemailer.createTestAccount();
  console.log('[mail] Mode Ethereal (dev) - aucun email reel envoye.');
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
    // Ne pas mettre en cache un echec (ex: Ethereal 502) : on reessaiera au prochain appel.
    transporterPromise.catch(() => {
      transporterPromise = null;
    });
  }
  return transporterPromise;
}

/**
 * Envoie l'email de reinitialisation de mot de passe.
 * En mode Ethereal, logge l'URL de preview pour recuperer le mail en dev.
 */
export async function sendResetPasswordEmail({
  to,
  url,
  name,
}: {
  to: string;
  url: string;
  name?: string;
}): Promise<void> {
  const greeting = name ? `Bonjour ${name},` : 'Bonjour,';
  const usingRealSmtp = Boolean(process.env.SMTP_HOST);

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM ?? 'Student Life <no-reply@student-life.app>',
      to,
      subject: 'Reinitialisation de votre mot de passe',
      text:
        `${greeting}\n\n` +
        `Vous avez demande la reinitialisation de votre mot de passe.\n` +
        `Ouvrez ce lien pour choisir un nouveau mot de passe (valable 1 heure) :\n${url}\n\n` +
        `Si vous n'etes pas a l'origine de cette demande, ignorez cet email.`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #08415C;">
        <h2>Reinitialisation de votre mot de passe</h2>
        <p>${greeting}</p>
        <p>Vous avez demande la reinitialisation de votre mot de passe.
        Ce lien est valable <strong>1 heure</strong> et utilisable une seule fois.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="background:#08415C;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">
            Choisir un nouveau mot de passe
          </a>
        </p>
        <p style="font-size:12px;color:#6b7280;">Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[mail] Preview email de reset (Ethereal) : ${previewUrl}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[mail] Echec de l'envoi de l'email de reset : ${message}`);
    if (usingRealSmtp) {
      // En prod (SMTP reel configure), on remonte l'erreur.
      throw err;
    }
    // Dev : Ethereal indisponible -> on logge le lien pour ne pas bloquer le flux.
    console.log(`[mail] (fallback dev) Lien de reinitialisation : ${url}`);
  }
}
