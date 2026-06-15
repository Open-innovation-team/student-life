import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { INTERVIEW_CATALOG, normalizeCategory } from './interview-catalog';

const prisma = new PrismaClient();

const SELECT = {
  id: true,
  category: true,
  question: true,
  answer: true,
  source: true,
};

export type InterviewQuestionItem = {
  id: string;
  category: string;
  question: string;
  answer: string | null;
  source: string;
};

type OwnedApplication = {
  id: string;
  position: string;
  company: string;
};

@Injectable()
export class InterviewService {
  constructor(private readonly aiService: AiService) {}

  async getPrep(
    applicationId: string,
    userId: string,
  ): Promise<InterviewQuestionItem[]> {
    await this.requireApplication(applicationId, userId);
    const count = await prisma.interviewQuestion.count({
      where: { applicationId },
    });
    if (count === 0) await this.seedCatalog(applicationId);
    return this.list(applicationId);
  }

  async saveAnswer(
    applicationId: string,
    questionId: string,
    userId: string,
    answer: string,
  ): Promise<InterviewQuestionItem> {
    await this.requireApplication(applicationId, userId);
    const question = await prisma.interviewQuestion.findFirst({
      where: { id: questionId, applicationId },
    });
    if (!question) throw new NotFoundException('Question introuvable');

    return prisma.interviewQuestion.update({
      where: { id: questionId },
      data: { answer: answer.trim() || null },
      select: SELECT,
    });
  }

  async generate(
    applicationId: string,
    userId: string,
  ): Promise<InterviewQuestionItem[]> {
    const application = await this.requireApplication(applicationId, userId);
    const generated = await this.aiService.generateInterviewQuestions(
      application.position,
      application.company,
    );

    await prisma.interviewQuestion.createMany({
      data: generated.map((q) => ({
        applicationId,
        category: normalizeCategory(q.category),
        question: q.question.trim(),
        source: 'ai',
      })),
    });

    return prisma.interviewQuestion.findMany({
      where: { applicationId, source: 'ai' },
      orderBy: { createdAt: 'desc' },
      take: generated.length,
      select: SELECT,
    });
  }

  private list(applicationId: string): Promise<InterviewQuestionItem[]> {
    return prisma.interviewQuestion.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
      select: SELECT,
    });
  }

  private async seedCatalog(applicationId: string): Promise<void> {
    await prisma.interviewQuestion.createMany({
      data: INTERVIEW_CATALOG.map((q) => ({
        applicationId,
        category: q.category,
        question: q.question,
        source: 'catalog',
      })),
    });
  }

  private async requireApplication(
    applicationId: string,
    userId: string,
  ): Promise<OwnedApplication> {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId },
      select: { id: true, position: true, company: true },
    });
    if (!application) throw new NotFoundException('Candidature introuvable');
    return application;
  }
}
