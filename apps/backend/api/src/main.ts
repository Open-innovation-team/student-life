import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? [],
    credentials: true,
  });
  await app.listen(3001); // A modifier par la suite pour run via notre .env
}
void bootstrap();
