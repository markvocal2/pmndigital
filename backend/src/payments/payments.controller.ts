import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { IsInt, IsString, Length, Min } from 'class-validator';
import { PaymentsService } from './payments.service';

export class CreateIntentDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @Length(3, 3)
  currency: string;
}

function userIdFromHeaders(req: Request): number {
  const raw = req.headers['x-user-id'];
  const id = parseInt(typeof raw === 'string' ? raw : '', 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new BadRequestException('X-User-Id header missing or invalid');
  }
  return id;
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('me')
  async listMine(@Req() req: Request) {
    const id = userIdFromHeaders(req);
    return this.payments.listPaymentMethods(id);
  }

  @Post('intents')
  async createIntent(@Body() dto: CreateIntentDto, @Req() req: Request) {
    const id = userIdFromHeaders(req);
    return this.payments.createIntent(dto.amount, dto.currency, id);
  }
}
