import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PdfService } from './pdf.service';

@Module({
  imports: [AiModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PdfService],
})
export class DocumentsModule {}
