import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminGuard } from '../cms/admin.guard';
import { AdminUsersService, type Actor } from './admin-users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';

/** Resolve the acting admin (id + request context) from the frontend-injected headers.
 *  AdminGuard has already verified this id belongs to an ADMIN. */
function actorFrom(req: Request): Actor {
  const raw = req.headers['x-user-id'];
  const id = parseInt(typeof raw === 'string' ? raw : '', 10);
  const xff = req.headers['x-forwarded-for'];
  const ip =
    (typeof xff === 'string' ? xff.split(',')[0].trim() : null) ??
    req.socket?.remoteAddress ??
    undefined;
  const userAgent = (req.headers['user-agent'] as string) ?? undefined;
  return { id, ip: ip ?? undefined, userAgent };
}

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly svc: AdminUsersService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.list({
      q,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return { user: await this.svc.getOne(id) };
  }

  @Post()
  async create(@Body() dto: AdminCreateUserDto, @Req() req: Request) {
    return { user: await this.svc.create(dto, actorFrom(req)) };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
    @Req() req: Request,
  ) {
    return { user: await this.svc.update(id, dto, actorFrom(req)) };
  }

  @Post(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminResetPasswordDto,
    @Req() req: Request,
  ): Promise<void> {
    await this.svc.resetPassword(id, dto.newPassword, actorFrom(req));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
  ): Promise<void> {
    await this.svc.remove(id, actorFrom(req));
  }
}
