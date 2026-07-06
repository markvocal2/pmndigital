import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { UsersService, type SafeUser } from './users.service';
import { AuditService } from '../audit/audit.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

const BCRYPT_ROUNDS = 10;

/** Acting admin (from the frontend-injected X-User-Id header) + request context. */
export interface Actor {
  id: number;
  ip?: string;
  userAgent?: string;
}

export interface PagedUsers {
  items: SafeUser[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Admin-only user management (add / edit / delete / assign role). Guarded at the
 * controller by AdminGuard; this service enforces data rules + lockout protection
 * (never let an admin delete/demote themselves or remove the last remaining ADMIN).
 */
@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly audit: AuditService,
  ) {}

  async list(params: {
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<PagedUsers> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const q = params.q?.trim();
    const where = q
      ? [
          { email: ILike(`%${q}%`) },
          { firstName: ILike(`%${q}%`) },
          { lastName: ILike(`%${q}%`) },
          { displayName: ILike(`%${q}%`) },
        ]
      : undefined;
    const [rows, total] = await this.users.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items: rows.map(UsersService.toSafe), total, page, limit };
  }

  async getOne(id: number): Promise<SafeUser> {
    return UsersService.toSafe(await this.findOrThrow(id));
  }

  async create(dto: AdminCreateUserDto, actor: Actor): Promise<SafeUser> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
    const user = this.users.create({
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
      role: dto.role ?? UserRole.USER,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      displayName: dto.displayName ?? null,
    });
    const saved = await this.users.save(user);
    await this.audit.log('user_created', {
      userId: actor.id,
      ip: actor.ip,
      userAgent: actor.userAgent,
      metadata: {
        targetUserId: saved.id,
        email: saved.email,
        role: saved.role,
      },
    });
    return UsersService.toSafe(saved);
  }

  async update(
    id: number,
    dto: AdminUpdateUserDto,
    actor: Actor,
  ): Promise<SafeUser> {
    const user = await this.findOrThrow(id);

    if (dto.email !== undefined && dto.email !== user.email) {
      const dup = await this.users.findOne({ where: { email: dto.email } });
      if (dup) throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
      user.email = dto.email;
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName || null;
    if (dto.lastName !== undefined) user.lastName = dto.lastName || null;
    if (dto.displayName !== undefined)
      user.displayName = dto.displayName || null;

    let roleChanged = false;
    if (dto.role !== undefined && dto.role !== user.role) {
      await this.assertRoleChangeAllowed(user, dto.role, actor);
      user.role = dto.role;
      roleChanged = true;
    }

    const saved = await this.users.save(user);
    await this.audit.log('user_updated', {
      userId: actor.id,
      ip: actor.ip,
      userAgent: actor.userAgent,
      metadata: { targetUserId: id, fields: Object.keys(dto) },
    });
    if (roleChanged) {
      await this.audit.log('user_role_changed', {
        userId: actor.id,
        ip: actor.ip,
        userAgent: actor.userAgent,
        metadata: { targetUserId: id, role: saved.role },
      });
    }
    return UsersService.toSafe(saved);
  }

  async resetPassword(
    id: number,
    newPassword: string,
    actor: Actor,
  ): Promise<void> {
    const user = await this.findOrThrow(id);
    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.users.save(user);
    await this.audit.log('user_password_reset', {
      userId: actor.id,
      ip: actor.ip,
      userAgent: actor.userAgent,
      metadata: { targetUserId: id },
    });
  }

  async remove(id: number, actor: Actor): Promise<void> {
    const user = await this.findOrThrow(id);
    if (user.id === actor.id) {
      throw new BadRequestException('ไม่สามารถลบบัญชีของตนเองได้');
    }
    if (user.role === UserRole.ADMIN) await this.assertNotLastAdmin();
    const email = user.email;
    // DB-level FK is ON DELETE SET NULL for Article.authorId + AuthAuditLog.userId,
    // so a user's articles/audit rows are preserved (orphaned to null), not deleted.
    await this.users.delete(id);
    await this.audit.log('user_deleted', {
      userId: actor.id,
      ip: actor.ip,
      userAgent: actor.userAgent,
      metadata: { targetUserId: id, email },
    });
  }

  private async findOrThrow(id: number): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
    return user;
  }

  private async assertRoleChangeAllowed(
    target: User,
    newRole: UserRole,
    actor: Actor,
  ): Promise<void> {
    // Only demotions of an ADMIN are risky.
    if (target.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      if (target.id === actor.id) {
        throw new BadRequestException('ไม่สามารถลดสิทธิ์ของบัญชีตนเองได้');
      }
      await this.assertNotLastAdmin();
    }
  }

  private async assertNotLastAdmin(): Promise<void> {
    const adminCount = await this.users.count({
      where: { role: UserRole.ADMIN },
    });
    if (adminCount <= 1) {
      throw new BadRequestException(
        'ต้องมีผู้ดูแล (ADMIN) อย่างน้อย 1 คนในระบบ',
      );
    }
  }
}
