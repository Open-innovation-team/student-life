import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import {
  APPLICATION_STATUSES,
  FOLLOW_UP_DAYS,
  FOLLOW_UP_STATUSES,
  INTERVIEW_STATUSES,
  RESPONDED_STATUSES,
} from './statuses';

const prisma = new PrismaClient();

const SELECT = {
  id: true,
  company: true,
  position: true,
  platform: true,
  status: true,
  sentAt: true,
  notes: true,
  cvDocumentId: true,
  lmDocumentId: true,
  lastStatusAt: true,
};

type Status = { status: string; lastStatusAt: Date };

type Application = {
  id: string;
  company: string;
  position: string;
  platform: string | null;
  status: string;
  sentAt: Date;
  notes: string | null;
  cvDocumentId: string | null;
  lmDocumentId: string | null;
  lastStatusAt: Date;
};

type ApplicationWithFollowUp = Application & { needsFollowUp: boolean };

type ApplicationStats = {
  total: number;
  byStatus: Record<string, number>;
  interviews: number;
  responseRate: number;
};

type ApplicationUpdateData = {
  company?: string;
  position?: string;
  platform?: string | null;
  notes?: string | null;
  cvDocumentId?: string | null;
  lmDocumentId?: string | null;
  sentAt?: Date;
  status?: string;
  lastStatusAt?: Date;
};

function includes(statuses: readonly string[], status: string): boolean {
  return statuses.includes(status);
}

function needsFollowUp(app: Status): boolean {
  if (!includes(FOLLOW_UP_STATUSES, app.status)) return false;
  const days = (Date.now() - new Date(app.lastStatusAt).getTime()) / 86_400_000;
  return days >= FOLLOW_UP_DAYS;
}

function csvCell(value: string): string {
  return value.replace(/;/g, ',').replace(/\n/g, ' ');
}

@Injectable()
export class ApplicationsService {
  async list(userId: string): Promise<ApplicationWithFollowUp[]> {
    const apps = await prisma.application.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      select: SELECT,
    });
    return apps.map((a) => ({ ...a, needsFollowUp: needsFollowUp(a) }));
  }

  async findOne(id: string, userId: string): Promise<ApplicationWithFollowUp> {
    const app = await this.findOwned(id, userId);
    return { ...app, needsFollowUp: needsFollowUp(app) };
  }

  create(userId: string, dto: CreateApplicationDto): Promise<Application> {
    return prisma.application.create({
      data: {
        userId,
        company: dto.company,
        position: dto.position,
        platform: dto.platform || null,
        status: dto.status ?? 'Envoyée',
        sentAt: dto.sentAt ? new Date(dto.sentAt) : new Date(),
        notes: dto.notes || null,
        cvDocumentId: dto.cvDocumentId || null,
        lmDocumentId: dto.lmDocumentId || null,
      },
      select: SELECT,
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateApplicationDto,
  ): Promise<Application> {
    const current = await this.findOwned(id, userId);

    const data: ApplicationUpdateData = {};
    if (dto.company !== undefined) data.company = dto.company;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.platform !== undefined) data.platform = dto.platform || null;
    if (dto.notes !== undefined) data.notes = dto.notes || null;
    if (dto.cvDocumentId !== undefined)
      data.cvDocumentId = dto.cvDocumentId || null;
    if (dto.lmDocumentId !== undefined)
      data.lmDocumentId = dto.lmDocumentId || null;
    if (dto.sentAt !== undefined) data.sentAt = new Date(dto.sentAt);
    if (dto.status !== undefined && dto.status !== current.status) {
      data.status = dto.status;
      data.lastStatusAt = new Date();
    }

    return prisma.application.update({ where: { id }, data, select: SELECT });
  }

  async delete(id: string, userId: string): Promise<{ deleted: true }> {
    await this.findOwned(id, userId);
    await prisma.application.delete({ where: { id } });
    return { deleted: true };
  }

  async stats(userId: string): Promise<ApplicationStats> {
    const apps = await prisma.application.findMany({
      where: { userId },
      select: { status: true },
    });
    const total = apps.length;
    const byStatus: Record<string, number> = {};
    for (const status of APPLICATION_STATUSES) byStatus[status] = 0;
    for (const { status } of apps)
      byStatus[status] = (byStatus[status] ?? 0) + 1;

    const responded = apps.filter((a) =>
      includes(RESPONDED_STATUSES, a.status),
    ).length;
    const interviews = apps.filter((a) =>
      includes(INTERVIEW_STATUSES, a.status),
    ).length;

    return {
      total,
      byStatus,
      interviews,
      responseRate: total ? Math.round((responded / total) * 100) : 0,
    };
  }

  async exportCsv(userId: string): Promise<string> {
    const apps = await prisma.application.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      select: SELECT,
    });
    const header = "Entreprise;Poste;Plateforme;Statut;Date d'envoi;Notes";
    const rows = apps.map((a) =>
      [
        a.company,
        a.position,
        a.platform ?? '',
        a.status,
        new Date(a.sentAt).toISOString().slice(0, 10),
        a.notes ?? '',
      ]
        .map(csvCell)
        .join(';'),
    );
    return [header, ...rows].join('\n');
  }

  private async findOwned(id: string, userId: string): Promise<Application> {
    const app = await prisma.application.findFirst({
      where: { id, userId },
      select: SELECT,
    });
    if (!app) throw new NotFoundException('Candidature introuvable');
    return app;
  }
}
