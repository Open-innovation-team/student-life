import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Instance Prisma unique partagée par toute l'application (singleton).
 * Évite la multiplication des pools de connexions PostgreSQL : chaque service
 * injecte ce provider au lieu d'instancier son propre `new PrismaClient()`.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
