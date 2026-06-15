import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AiQuotaService } from '../ai/ai-quota.service';
import { InterviewService } from './interview.service';
import { SaveInterviewAnswerDto } from './dto/save-interview-answer.dto';

@Controller('api/applications/:applicationId/interview')
@UseGuards(SessionGuard)
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly aiQuotaService: AiQuotaService,
  ) {}

  @Get()
  getPrep(
    @CurrentUser() user: SessionUser,
    @Param('applicationId') applicationId: string,
  ): ReturnType<InterviewService['getPrep']> {
    return this.interviewService.getPrep(applicationId, user.id);
  }

  @Post('generate')
  generate(
    @CurrentUser() user: SessionUser,
    @Param('applicationId') applicationId: string,
  ): ReturnType<InterviewService['generate']> {
    this.aiQuotaService.consume(user.id);
    return this.interviewService.generate(applicationId, user.id);
  }

  @Patch(':questionId')
  saveAnswer(
    @CurrentUser() user: SessionUser,
    @Param('applicationId') applicationId: string,
    @Param('questionId') questionId: string,
    @Body() dto: SaveInterviewAnswerDto,
  ): ReturnType<InterviewService['saveAnswer']> {
    return this.interviewService.saveAnswer(
      applicationId,
      questionId,
      user.id,
      dto.answer ?? '',
    );
  }
}
