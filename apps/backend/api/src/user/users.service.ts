import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

const prisma = new PrismaClient();

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  image: true,
  establishment: true,
  sector: true,
  studyLevel: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return prisma.user.update({
      where: { id: userId },
      data: dto,
      select: USER_SELECT,
    });
  }
}
