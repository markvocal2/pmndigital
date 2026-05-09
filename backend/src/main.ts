import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api', {
    // Static `/uploads` is served outside the /api prefix
    exclude: [{ path: 'uploads/(.*)', method: 0 }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();
  // Avatars and other user-uploaded content
  const uploadsDir = process.env.UPLOADS_DIR ?? '/app/uploads';
  app.useStaticAssets(path.resolve(uploadsDir), {
    prefix: '/uploads/',
    immutable: false,
    maxAge: 0,
  });
  await app.listen(parseInt(process.env.PORT || '3001', 10));
}
void bootstrap();
