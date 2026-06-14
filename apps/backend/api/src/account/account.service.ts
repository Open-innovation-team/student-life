import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import archiver from 'archiver';
import { randomBytes } from 'crypto';
import { createWriteStream, mkdirSync } from 'fs';
import { stat, unlink } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

const EXPORT_DIR = process.env.EXPORT_DIR ?? './exports';
const EXPORT_TTL_MS = 24 * 60 * 60 * 1000; // 24h (RGPD : lien temporaire)

@Injectable()
export class AccountService {
  /**
   * Génère un export complet des données de l'utilisateur (portabilité RGPD)
   * au format ZIP (JSON + CSV), le stocke avec un token aléatoire, et renvoie
   * un lien de téléchargement sécurisé valable 24h.
   */
  async createExport(userId: string) {
    const [user, expenses, budgets, categories, documents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          establishment: true,
          studyLevel: true,
          sector: true,
          image: true,
          createdAt: true,
        },
      }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        select: {
          id: true,
          date: true,
          category: true,
          label: true,
          amountCents: true,
          createdAt: true,
        },
      }),
      prisma.budget.findMany({
        where: { userId },
        orderBy: [{ month: 'asc' }, { category: 'asc' }],
        select: {
          id: true,
          month: true,
          category: true,
          amountCents: true,
          createdAt: true,
        },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          filename: true,
          sizeBytes: true,
          createdAt: true,
          summaries: {
            select: { id: true, content: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
          quizzes: {
            select: { id: true, questions: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
    ]);

    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Historique IA = résumés + QCM rattachés aux documents
    const aiHistory = documents.flatMap((d) => [
      ...d.summaries.map((s) => ({
        type: 'resume' as const,
        documentId: d.id,
        document: d.filename,
        content: s.content,
        createdAt: s.createdAt,
      })),
      ...d.quizzes.map((q) => ({
        type: 'qcm' as const,
        documentId: d.id,
        document: d.filename,
        questions: q.questions,
        createdAt: q.createdAt,
      })),
    ]);

    // Liste des documents (sans résumés/quiz, déjà dans l'historique IA)
    const documentsList: DocumentRow[] = documents.map((d) => ({
      id: d.id,
      filename: d.filename,
      sizeBytes: d.sizeBytes,
      createdAt: d.createdAt,
    }));

    mkdirSync(EXPORT_DIR, { recursive: true });
    const token = randomBytes(32).toString('hex');
    const filePath = join(EXPORT_DIR, `${token}.zip`);

    await this.buildZip(filePath, {
      user,
      expenses,
      budgets,
      categories,
      documentsList,
      aiHistory,
    });

    const expiresAt = new Date(Date.now() + EXPORT_TTL_MS);
    await prisma.dataExport.create({
      data: { userId, token, filePath, expiresAt },
    });

    const baseUrl = (process.env.BETTER_AUTH_URL ?? '').replace(/\/$/, '');
    return {
      downloadUrl: `${baseUrl}/api/account/export/${token}`,
      filename: `student-life-export-${new Date().toISOString().slice(0, 10)}.zip`,
      expiresAt,
    };
  }

  /**
   * Valide un token d'export et renvoie le chemin du ZIP à streamer.
   * Token expiré → fichier purgé + 410 Gone.
   */
  async getExportByToken(token: string) {
    const record = await prisma.dataExport.findUnique({ where: { token } });
    if (!record) throw new NotFoundException("Lien d'export invalide");

    if (record.expiresAt.getTime() < Date.now()) {
      await unlink(record.filePath).catch(() => undefined);
      await prisma.dataExport
        .delete({ where: { id: record.id } })
        .catch(() => undefined);
      throw new GoneException("Ce lien d'export a expiré (valable 24h)");
    }

    const exists = await stat(record.filePath)
      .then(() => true)
      .catch(() => false);
    if (!exists) throw new GoneException("Fichier d'export introuvable");

    return { path: record.filePath, filename: 'student-life-export.zip' };
  }

  private buildZip(
    filePath: string,
    data: {
      user: unknown;
      expenses: ExpenseRow[];
      budgets: BudgetRow[];
      categories: unknown[];
      documentsList: DocumentRow[];
      aiHistory: unknown[];
    },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      output.on('error', reject);
      archive.on('error', reject);
      archive.pipe(output);

      const json = (value: unknown) => JSON.stringify(value, null, 2);

      archive.append(json(data.user), { name: 'profil.json' });

      archive.append(json(data.expenses), { name: 'depenses.json' });
      archive.append(this.expensesCsv(data.expenses), { name: 'depenses.csv' });

      archive.append(json(data.budgets), { name: 'budgets.json' });
      archive.append(this.budgetsCsv(data.budgets), { name: 'budgets.csv' });

      archive.append(json(data.categories), { name: 'categories.json' });

      archive.append(json(data.documentsList), { name: 'documents.json' });
      archive.append(this.documentsCsv(data.documentsList), {
        name: 'documents.csv',
      });

      archive.append(json(data.aiHistory), { name: 'historique-ia.json' });

      archive.append(README, { name: 'LISEZMOI.txt' });

      void archive.finalize();
    });
  }

  private expensesCsv(rows: ExpenseRow[]): string {
    const header = 'Date;Catégorie;Libellé;Montant (€)';
    const lines = rows.map((e) =>
      [
        e.date.toISOString().slice(0, 10),
        csvCell(e.category),
        csvCell(e.label ?? ''),
        (e.amountCents / 100).toFixed(2).replace('.', ','),
      ].join(';'),
    );
    return [header, ...lines].join('\n');
  }

  private budgetsCsv(rows: BudgetRow[]): string {
    const header = 'Mois;Catégorie;Montant (€)';
    const lines = rows.map((b) =>
      [
        csvCell(b.month),
        csvCell(b.category ?? 'Global'),
        (b.amountCents / 100).toFixed(2).replace('.', ','),
      ].join(';'),
    );
    return [header, ...lines].join('\n');
  }

  private documentsCsv(rows: DocumentRow[]): string {
    const header = 'Nom du fichier;Taille (octets);Ajouté le';
    const lines = rows.map((d) =>
      [
        csvCell(d.filename),
        String(d.sizeBytes),
        d.createdAt.toISOString().slice(0, 10),
      ].join(';'),
    );
    return [header, ...lines].join('\n');
  }
}

type ExpenseRow = {
  id: string;
  date: Date;
  category: string;
  label: string | null;
  amountCents: number;
  createdAt: Date;
};

type BudgetRow = {
  id: string;
  month: string;
  category: string | null;
  amountCents: number;
  createdAt: Date;
};

type DocumentRow = {
  id: string;
  filename: string;
  sizeBytes: number;
  createdAt: Date;
};

function csvCell(value: string): string {
  return value.replace(/;/g, ',').replace(/\r?\n/g, ' ');
}

const README = `Export de vos données Student Life (portabilité RGPD)
====================================================

Ce dossier contient l'ensemble des données associées à votre compte :

- profil.json          : vos informations de profil
- depenses.json/.csv   : vos dépenses
- budgets.json/.csv    : vos budgets mensuels
- categories.json      : vos catégories personnalisées
- documents.json/.csv  : la liste de vos documents importés
- historique-ia.json   : vos résumés et QCM générés par l'IA

Remarque : les modules « candidatures » et « planning / tâches » mentionnés
dans certains gabarits RGPD ne sont pas disponibles dans cette version de
l'application — aucune donnée de ce type n'existe donc pour votre compte.

Les fichiers PDF eux-mêmes ne sont pas inclus dans cet export ; seule la liste
des documents (nom, taille, date) est fournie.
`;
