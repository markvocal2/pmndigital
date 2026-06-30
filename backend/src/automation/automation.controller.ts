import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../cms/admin.guard';
import { AutomationService } from './automation.service';
import { UpdateAutomationDto } from './dto';

@Controller('admin/automation')
@UseGuards(AdminGuard)
export class AutomationController {
  constructor(private readonly svc: AutomationService) {}

  private check(key: string): string {
    if (!this.svc.isValidKey(key)) throw new BadRequestException('unknown job');
    return key;
  }

  @Get()
  async list() {
    return { items: await this.svc.listStatus() };
  }

  @Patch(':key')
  async update(@Param('key') key: string, @Body() dto: UpdateAutomationDto) {
    return { job: await this.svc.update(this.check(key), dto) };
  }

  @Post(':key/run')
  run(@Param('key') key: string) {
    return this.svc.runNow(this.check(key));
  }
}
