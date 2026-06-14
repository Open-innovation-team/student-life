import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Controller('api/applications')
@UseGuards(SessionGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.applicationsService.list(user.id);
  }

  @Get('stats')
  stats(@CurrentUser() user: SessionUser) {
    return this.applicationsService.stats(user.id);
  }

  @Get('export')
  async export(@CurrentUser() user: SessionUser, @Res() res: Response) {
    const csv = await this.applicationsService.exportCsv(user.id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="candidatures.csv"',
    );
    res.send(csv);
  }

  @Get(':id')
  findOne(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.applicationsService.findOne(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, user.id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: SessionUser, @Param('id') id: string) {
    return this.applicationsService.delete(id, user.id);
  }
}
