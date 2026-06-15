import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module global : `PrismaService` est disponible par injection dans tous les
 * modules sans avoir à le ré-importer à chaque fois.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
