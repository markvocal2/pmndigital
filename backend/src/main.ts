import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { McpOAuthProvider } from './mcp/mcp-oauth.provider';
import { AiService } from './ai/ai.service';
import { IntegrationsService } from './ai/integrations.service';
import { mountMcp } from './mcp/mcp.http';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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

  // Mount the MCP server + OAuth 2.1 authorization server on the raw Express instance.
  // These live OUTSIDE the global '/api' prefix (at /mcp, /authorize, /token, /.well-known/*).
  mountMcp(app.getHttpAdapter().getInstance(), {
    provider: app.get(McpOAuthProvider),
    deps: {
      ai: app.get(AiService),
      integrations: app.get(IntegrationsService),
    },
    publicUrl: process.env.MCP_PUBLIC_URL || 'https://pmndigital.co',
  });

  await app.listen(parseInt(process.env.PORT || '3001', 10));
}
void bootstrap();
