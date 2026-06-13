import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { createReadStream, mkdirSync } from 'fs';
import { extname } from 'path';
import { auth } from '../lib/auth';
import { AiQuotaService } from '../ai/ai-quota.service';
import { DocumentsService } from './documents.service';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 50);

const ALLOWED_QUESTION_COUNTS = [5, 10, 20];

@Controller('api/documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly aiQuotaService: AiQuotaService,
  ) {}

  private async getSession(req: Request) {
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: req.headers.cookie ?? '',
        authorization: req.headers.authorization ?? '',
      }),
    });
    if (!session?.user) throw new UnauthorizedException();
    return session.user;
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${extname(file.originalname) || '.pdf'}`),
      }),
      limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(
            new BadRequestException('Seuls les fichiers PDF sont acceptés'),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = await this.getSession(req);
    if (!file) throw new BadRequestException('Aucun fichier PDF fourni');
    return this.documentsService.create(user.id, file);
  }

  @Get()
  async list(@Req() req: Request) {
    const user = await this.getSession(req);
    return this.documentsService.listByUser(user.id);
  }

  @Get(':id')
  async getOne(@Req() req: Request, @Param('id') id: string) {
    const user = await this.getSession(req);
    return this.documentsService.getOne(id, user.id);
  }

  @Get(':id/file')
  async file(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const user = await this.getSession(req);
    const { path, filename } = await this.documentsService.getFilePath(
      id,
      user.id,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(filename)}"`,
    );
    createReadStream(path).pipe(res);
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    const user = await this.getSession(req);
    return this.documentsService.delete(id, user.id);
  }

  @Post(':id/summarize')
  async summarize(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('refresh') refresh?: string,
  ) {
    const user = await this.getSession(req);
    this.aiQuotaService.consume(user.id);
    return this.documentsService.summarize(id, user.id, refresh === 'true');
  }

  @Post(':id/quiz')
  async quiz(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('nbQuestions') nbQuestions?: number,
  ) {
    const user = await this.getSession(req);
    const count = Number(nbQuestions ?? 5);
    if (!ALLOWED_QUESTION_COUNTS.includes(count)) {
      throw new BadRequestException(
        `nbQuestions doit valoir ${ALLOWED_QUESTION_COUNTS.join(', ')}`,
      );
    }
    this.aiQuotaService.consume(user.id);
    return this.documentsService.generateQuiz(id, user.id, count);
  }
}
