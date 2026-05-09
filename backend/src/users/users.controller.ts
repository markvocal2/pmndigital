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
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  async me(@Req() req: Request) {
    const id = userIdFromHeaders(req);
    return { user: await this.users.getMe(id) };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return { user: await this.users.getMe(id) };
  }

  @Patch('me')
  async update(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    const id = userIdFromHeaders(req);
    return { user: await this.users.updateProfile(id, dto, auditContext(req)) };
  }

  @Post('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<void> {
    const id = userIdFromHeaders(req);
    await this.users.changePassword(id, dto, auditContext(req));
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    const id = userIdFromHeaders(req);
    if (!file) throw new BadRequestException('avatar file missing');
    return {
      user: await this.users.saveAvatar(
        id,
        { buffer: file.buffer, mimetype: file.mimetype, size: file.size },
        auditContext(req),
      ),
    };
  }

  @Delete('me/avatar')
  async deleteAvatar(@Req() req: Request) {
    const id = userIdFromHeaders(req);
    return { user: await this.users.deleteAvatar(id, auditContext(req)) };
  }
}
