import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Autorise les clients web / mobile a appeler l'API.
  app.enableCors({ origin: true, credentials: true });

  // Validation automatique des DTO (class-validator).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
