import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Request } from 'express';
import { User, UserRole } from '../users/user.entity';

/** Gate admin endpoints: load the user named by the frontend-injected
 *  `X-User-Id` header and require role = ADMIN. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const raw = req.headers['x-user-id'];
    const id = parseInt(typeof raw === 'string' ? raw : '', 10);
    if (!Number.isFinite(id) || id <= 0) {
      throw new ForbiddenException('Authentication required');
    }
    const user = await this.users.findOne({ where: { id } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
