import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PREDEFINED_CATEGORIES } from './categories';

const prisma = new PrismaClient();

@Injectable()
export class CategoriesService {
  async list(userId: string) {
    const custom = await prisma.category.findMany({
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
      (await prisma.category.findUnique({
        where: { userId_name: { userId, name } },
      })) !== null;
    if (alreadyExists) {
      throw new ConflictException('Cette catégorie existe déjà');
    }

    return prisma.category.create({
      data: { userId, name },
      select: { id: true, name: true },
    });
  }
}
