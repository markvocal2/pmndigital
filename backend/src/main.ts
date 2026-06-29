import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();
  // All uploaded media now lives on PMN Drive (served via cdn.pmndigital.co) — no local static serving.
  await app.listen(parseInt(process.env.PORT || '3001', 10));
}
void bootstrap();
