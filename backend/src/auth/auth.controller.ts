import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

function auditContext(req: Request) {
  const xff = req.headers['x-forwarded-for'];
  const ip =
    (typeof xff === 'string' ? xff.split(',')[0].trim() : null) ??
    req.socket?.remoteAddress ??
    null;
  const ua = (req.headers['user-agent'] as string) ?? null;
  return { ip: ip ?? undefined, userAgent: ua ?? undefined };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.auth.validateUser(dto, auditContext(req));
    return { user };
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.auth.register(dto);
    return { user };
  }
}
