import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../cms/admin.guard';
import { IntegrationsService } from './integrations.service';
import { IntegrationProvider } from './integration.entity';
import { SaveIntegrationDto } from './dto';

function parseProvider(p: string): IntegrationProvider {
  const up = (p || '').toUpperCase();
  if (up === 'ANTHROPIC' || up === 'GEMINI' || up === 'OPENAI') return up as IntegrationProvider;
  throw new BadRequestException('unknown provider');
}

@Controller('admin/integrations')
@UseGuards(AdminGuard)
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  @Get()
  async list() {
    return { items: await this.svc.listStatus() };
  }
  @Put(':provider')
  async save(@Param('provider') p: string, @Body() dto: SaveIntegrationDto) {
    return { integration: await this.svc.save(parseProvider(p), dto) };
  }
  @Post(':provider/test')
  test(@Param('provider') p: string) {
    return this.svc.test(parseProvider(p));
  }
  @Delete(':provider')
  async disconnect(@Param('provider') p: string) {
    await this.svc.disconnect(parseProvider(p));
    return { ok: true };
  }
}
