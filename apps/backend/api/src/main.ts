import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001); // A modifier par la suite pour run via notre .env
}
void bootstrap();
