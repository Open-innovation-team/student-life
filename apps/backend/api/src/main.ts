import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // En-têtes de sécurité HTTP (X-Content-Type-Options, X-Frame-Options, HSTS…)
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // Renvoie 400 si un champ inconnu est envoyé (au lieu de le retirer
      // silencieusement) → durcit la protection contre le mass assignment.
      forbidNonWhitelisted: true,
    }),
  );

  // Origines autorisées depuis l'env ; jamais '*' avec credentials: true.
  const allowedOrigins =
    process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',')
      .map((o) => o.trim())
      .filter(Boolean) ?? [];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
void bootstrap();
