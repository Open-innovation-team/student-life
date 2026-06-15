import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { unlink } from 'fs/promises';
import { AiService, QuizQuestion } from '../ai/ai.service';
import { PdfService } from './pdf.service';
import { PrismaService } from '../prisma/prisma.service';

const DOCUMENT_SELECT = {
  id: true,
  filename: true,
  sizeBytes: true,
  createdAt: true,
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly pdfService: PdfService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, file: Express.Multer.File) {
    const extractedText = await this.pdfService
      .extractText(file.path)
      .catch(async (err: unknown) => {
        await unlink(file.path).catch(() => undefined);
        throw err;
      });

    return this.prisma.document.create({
      data: {
        userId,
        filename: file.originalname,
        path: file.path,
        sizeBytes: file.size,
        extractedText,
      },
      select: DOCUMENT_SELECT,
    });
  }

  async listByUser(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: DOCUMENT_SELECT,
    });
  }

  async findOwned(id: string, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, userId },
    });
    if (!document) throw new NotFoundException('Document introuvable');
    return document;
  }

  async getFilePath(id: string, userId: string) {
    const document = await this.findOwned(id, userId);
    return { path: document.path, filename: document.filename };
  }

  async getOne(id: string, userId: string) {
    await this.findOwned(id, userId);
    return this.prisma.document.findUnique({
      where: { id },
      select: {
        ...DOCUMENT_SELECT,
        summaries: {
          select: { id: true, content: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    const document = await this.findOwned(id, userId);
    // cascade Prisma : supprime aussi Summary et Quiz associés
    await this.prisma.document.delete({ where: { id } });
    await unlink(document.path).catch(() => undefined);
    return { deleted: true };
  }

  async summarize(id: string, userId: string, refresh: boolean) {
    const document = await this.findOwned(id, userId);

    if (!refresh) {
      const existing = await this.prisma.summary.findFirst({
        where: { documentId: id },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return existing;
    }

    const text = this.requireText(document.extractedText);
    const content = await this.aiService.summarize(text);
    return this.prisma.summary.create({
      data: { documentId: id, content },
    });
  }

  async generateQuiz(id: string, userId: string, nbQuestions: number) {
    const document = await this.findOwned(id, userId);
    const text = this.requireText(document.extractedText);
    const questions: QuizQuestion[] = await this.aiService.generateQuiz(
      text,
      nbQuestions,
    );
    return this.prisma.quiz.create({
      data: { documentId: id, questions },
    });
  }

  private requireText(extractedText: string | null): string {
    if (!extractedText || extractedText.trim().length === 0) {
      throw new UnprocessableEntityException(
        'Document non lisible (pas de texte extractible)',
      );
    }
    return extractedText;
  }
}
