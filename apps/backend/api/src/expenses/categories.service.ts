import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PREDEFINED_CATEGORIES } from './categories';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const custom = await this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return { predefined: PREDEFINED_CATEGORIES, custom };
  }

  async create(userId: string, rawName: string) {
    const name = rawName.trim();
    if (!name) throw new BadRequestException('Nom de catégorie requis');

    const alreadyExists =
      PREDEFINED_CATEGORIES.some(
        (c) => c.toLowerCase() === name.toLowerCase(),
      ) ||
      (await this.prisma.category.findUnique({
        where: { userId_name: { userId, name } },
      })) !== null;
    if (alreadyExists) {
      throw new ConflictException('Cette catégorie existe déjà');
    }

    return this.prisma.category.create({
      data: { userId, name },
      select: { id: true, name: true },
    });
  }
}
