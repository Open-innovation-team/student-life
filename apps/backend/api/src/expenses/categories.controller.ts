import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/session.guard';
import type { SessionUser } from '../auth/session.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('api/categories')
@UseGuards(SessionGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.categoriesService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.id, dto.name);
  }
}
