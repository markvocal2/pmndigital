import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuditService } from '../audit/audit.service';
import {
  ErpService,
  ErpLicense,
  ErpOrder,
  ErpProduct,
} from '../erp/erp.service';

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? '/app/uploads';
const AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export type SafeUser = Omit<
  User,
  'passwordHash' | 'twoFactorSecret' | 'twoFactorBackupCodes'
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly audit: AuditService,
    private readonly erp: ErpService,
  ) {}

  static toSafe(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      name: user.name,
      avatarUrl: user.avatarUrl,
      twoFactorEnabled: user.twoFactorEnabled,
      erpCustomerId: user.erpCustomerId,
      erpSyncedAt: user.erpSyncedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  async getMe(id: number): Promise<SafeUser> {
    return UsersService.toSafe(await this.findById(id));
  }

  async updateProfile(
    id: number,
    dto: UpdateProfileDto,
    audit: { ip?: string; userAgent?: string },
  ): Promise<SafeUser> {
    const user = await this.findById(id);
    if (dto.firstName !== undefined) user.firstName = dto.firstName || null;
    if (dto.lastName !== undefined) user.lastName = dto.lastName || null;
    if (dto.displayName !== undefined)
      user.displayName = dto.displayName || null;
    const saved = await this.users.save(user);
    await this.audit.log('profile_updated', {
      userId: id,
      ip: audit.ip,
      userAgent: audit.userAgent,
      metadata: { fields: Object.keys(dto) },
    });
    return UsersService.toSafe(saved);
  }

  async changePassword(
    id: number,
    dto: ChangePasswordDto,
    audit: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const user = await this.findById(id);
    const ok = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!ok) {
      await this.audit.log('login_failed', {
        userId: id,
        ip: audit.ip,
        userAgent: audit.userAgent,
        metadata: { reason: 'wrong_old_password_on_change' },
      });
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new ConflictException(
        'New password must be different from current',
      );
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.users.save(user);
    await this.audit.log('password_changed', {
      userId: id,
      ip: audit.ip,
      userAgent: audit.userAgent,
    });
  }

  async saveAvatar(
    id: number,
    file: { buffer: Buffer; mimetype: string; size: number },
    audit: { ip?: string; userAgent?: string },
  ): Promise<SafeUser> {
    if (!AVATAR_MIME.includes(file.mimetype)) {
      throw new ConflictException(
        'Unsupported MIME type. Allowed: ' + AVATAR_MIME.join(', '),
      );
    }
    if (file.size > AVATAR_MAX_BYTES) {
      throw new ConflictException('Avatar file too large (max 2 MB)');
    }
    const ext =
      file.mimetype === 'image/jpeg'
        ? 'jpg'
        : file.mimetype === 'image/png'
          ? 'png'
          : 'webp';
    const hash = createHash('sha256')
      .update(file.buffer)
      .digest('hex')
      .slice(0, 8);
    const filename = id + '-' + hash + '.' + ext;
    const dir = path.join(UPLOADS_DIR, 'avatars');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), file.buffer);

    const user = await this.findById(id);
    if (user.avatarUrl) {
      const old = path.basename(user.avatarUrl);
      if (old !== filename) {
        await fs.unlink(path.join(dir, old)).catch(() => undefined);
      }
    }
    user.avatarUrl = '/uploads/avatars/' + filename;
    const saved = await this.users.save(user);
    await this.audit.log('avatar_updated', {
      userId: id,
      ip: audit.ip,
      userAgent: audit.userAgent,
      metadata: { filename, size: file.size, mime: file.mimetype },
    });
    return UsersService.toSafe(saved);
  }

  async deleteAvatar(
    id: number,
    audit: { ip?: string; userAgent?: string },
  ): Promise<SafeUser> {
    const user = await this.findById(id);
    if (user.avatarUrl) {
      const filename = path.basename(user.avatarUrl);
      await fs
        .unlink(path.join(UPLOADS_DIR, 'avatars', filename))
        .catch(() => undefined);
      user.avatarUrl = null;
      await this.users.save(user);
      await this.audit.log('avatar_deleted', {
        userId: id,
        ip: audit.ip,
        userAgent: audit.userAgent,
      });
    }
    return UsersService.toSafe(user);
  }

  async ensureErpSync(id: number): Promise<number | null> {
    const user = await this.findById(id);
    if (user.erpCustomerId) return user.erpCustomerId;
    if (!this.erp.isConfigured()) return null;
    const customer = await this.erp.syncCustomer({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
    });
    if (!customer) {
      await this.audit.log('erp_sync_failed', {
        userId: id,
        metadata: { reason: 'no_response_from_erp' },
      });
      return null;
    }
    user.erpCustomerId = customer.id;
    user.erpSyncedAt = new Date();
    await this.users.save(user);
    await this.audit.log('erp_sync_success', {
      userId: id,
      metadata: { erpCustomerId: customer.id },
    });
    return customer.id;
  }

  async getOrders(id: number): Promise<ErpOrder[]> {
    const customerId = await this.ensureErpSync(id);
    return this.erp.getCustomerOrders(customerId);
  }

  async getProducts(id: number): Promise<ErpProduct[]> {
    // id is currently unused (no per-user filtering yet) but kept for the
    // future: products filtered by customer tier / org / region.
    void id;
    return this.erp.getProducts();
  }

  async getLicenses(id: number): Promise<ErpLicense[]> {
    const customerId = await this.ensureErpSync(id);
    return this.erp.getCustomerLicenses(customerId);
  }
}
