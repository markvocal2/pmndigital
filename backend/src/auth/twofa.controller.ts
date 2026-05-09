import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { TwoFAService } from './twofa.service';
import { DisableTwoFactorDto, TwoFactorCodeDto } from './dto/two-factor.dto';

function userIdFromHeaders(req: Request): number {
  const raw = req.headers['x-user-id'];
  const id = parseInt(typeof raw === 'string' ? raw : '', 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new BadRequestException('X-User-Id header missing or invalid');
  }
  return id;
}

function auditContext(req: Request) {
  const xff = req.headers['x-forwarded-for'];
  const ip =
    (typeof xff === 'string' ? xff.split(',')[0].trim() : null) ??
    req.socket?.remoteAddress ??
    null;
  const ua = (req.headers['user-agent'] as string) ?? null;
  return { ip: ip ?? undefined, userAgent: ua ?? undefined };
}

@Controller('auth/2fa')
export class TwoFAController {
  constructor(private readonly twofa: TwoFAService) {}

  @Post('setup')
  async setup(@Req() req: Request) {
    const id = userIdFromHeaders(req);
    return this.twofa.setup(id);
  }

  @Post('verify')
  async verify(@Body() dto: TwoFactorCodeDto, @Req() req: Request) {
    const id = userIdFromHeaders(req);
    return this.twofa.verifyAndEnable(id, dto.code, auditContext(req));
  }

  @Post('disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disable(
    @Body() dto: DisableTwoFactorDto,
    @Req() req: Request,
  ): Promise<void> {
    const id = userIdFromHeaders(req);
    await this.twofa.disable(id, dto.password, dto.code, auditContext(req));
  }
}
