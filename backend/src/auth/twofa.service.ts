import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { User } from '../users/user.entity';
import type { BackupCode } from '../users/user.entity';
import { encrypt, decrypt } from '../common/crypto.util';
import { AuditService } from '../audit/audit.service';

const ISSUER = 'PMN Digital';
const BACKUP_CODE_COUNT = 10;

function masterSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'NEXTAUTH_SECRET env not configured (required for 2FA encryption)',
    );
  }
  return s;
}

function generateBackupCode(): string {
  // 10 hex chars, hyphenated for readability: e.g., "a1b2-c3d4e"
  const bytes = randomBytes(5).toString('hex');
  return `${bytes.slice(0, 4)}-${bytes.slice(4)}`;
}

export interface SetupResult {
  secret: string;
  otpauthUrl: string;
  qrDataUrl: string;
}

export interface VerifyEnableResult {
  backupCodes: string[];
}

@Injectable()
export class TwoFAService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly audit: AuditService,
  ) {}

  /** Step 1 of enable: generate (and persist encrypted) a fresh secret + QR. */
  async setup(userId: number): Promise<SetupResult> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.twoFactorEnabled) {
      throw new ConflictException(
        '2FA already enabled — disable first to reset',
      );
    }

    const secret = authenticator.generateSecret();
    const accountLabel = user.email;
    const otpauthUrl = authenticator.keyuri(accountLabel, ISSUER, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Persist encrypted (not yet enabled — verify step flips the flag)
    user.twoFactorSecret = encrypt(secret, masterSecret());
    user.twoFactorEnabled = false;
    user.twoFactorBackupCodes = null;
    await this.users.save(user);

    return { secret, otpauthUrl, qrDataUrl };
  }

  /** Step 2: verify the TOTP code from the user's authenticator and enable 2FA. */
  async verifyAndEnable(
    userId: number,
    code: string,
    audit: { ip?: string; userAgent?: string },
  ): Promise<VerifyEnableResult> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }
    const secret = decrypt(user.twoFactorSecret, masterSecret());
    const ok = authenticator.check(code, secret);
    if (!ok) {
      await this.audit.log('login_2fa_failed', {
        userId,
        ip: audit.ip,
        userAgent: audit.userAgent,
        metadata: { phase: 'enable' },
      });
      throw new UnauthorizedException('Invalid verification code');
    }
    const plainBackupCodes = Array.from(
      { length: BACKUP_CODE_COUNT },
      generateBackupCode,
    );
    const hashedBackupCodes: BackupCode[] = await Promise.all(
      plainBackupCodes.map(async (c) => ({
        hash: await bcrypt.hash(c, 8),
        used: false,
      })),
    );
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = hashedBackupCodes;
    await this.users.save(user);
    await this.audit.log('2fa_enabled', {
      userId,
      ip: audit.ip,
      userAgent: audit.userAgent,
    });
    return { backupCodes: plainBackupCodes };
  }

  /** Disable 2FA after verifying password (and optionally a fresh code). */
  async disable(
    userId: number,
    password: string,
    code: string | undefined,
    audit: { ip?: string; userAgent?: string },
  ): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) throw new UnauthorizedException('Invalid password');
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // If 2FA on, require a fresh code or backup code to disable
      if (!code) {
        throw new UnauthorizedException(
          'Verification code required to disable 2FA',
        );
      }
      const okTotp = authenticator.check(
        code,
        decrypt(user.twoFactorSecret, masterSecret()),
      );
      if (!okTotp) {
        const backupOk = await this.tryBackupCode(user, code);
        if (!backupOk) {
          await this.audit.log('login_2fa_failed', {
            userId,
            ip: audit.ip,
            userAgent: audit.userAgent,
            metadata: { phase: 'disable' },
          });
          throw new UnauthorizedException('Invalid verification code');
        }
      }
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = null;
    await this.users.save(user);
    await this.audit.log('2fa_disabled', {
      userId,
      ip: audit.ip,
      userAgent: audit.userAgent,
    });
  }

  /** Verify a code during the login challenge (TOTP or backup). */
  async verifyChallenge(user: User, code: string): Promise<boolean> {
    if (!user.twoFactorEnabled || !user.twoFactorSecret) return true;
    const secret = decrypt(user.twoFactorSecret, masterSecret());
    if (authenticator.check(code, secret)) return true;
    return this.tryBackupCode(user, code);
  }

  /** Returns true and marks the matching backup code as used. */
  private async tryBackupCode(user: User, code: string): Promise<boolean> {
    const codes = user.twoFactorBackupCodes;
    if (!codes || !Array.isArray(codes)) return false;
    for (const bc of codes) {
      if (bc.used) continue;
      if (await bcrypt.compare(code, bc.hash)) {
        bc.used = true;
        user.twoFactorBackupCodes = [...codes];
        await this.users.save(user);
        await this.audit.log('2fa_backup_used', {
          userId: user.id,
        });
        return true;
      }
    }
    return false;
  }
}
