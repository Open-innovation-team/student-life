import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';

@Module({
  imports: [AiModule],
  controllers: [ApplicationsController, InterviewController],
  providers: [ApplicationsService, InterviewService],
})
export class ApplicationsModule {}
